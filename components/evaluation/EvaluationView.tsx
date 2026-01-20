import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import exifr from 'exifr';
import { PhotoEntry, NavTab } from '../../types';
import { MAX_FILE_SIZE, getTodayPrompt } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useDailyUsage } from '../../hooks/useDailyUsage';
import { useImageCache } from '../../hooks/useImageCache';
import { usePhotoAnalysis } from '../../hooks/usePhotoAnalysis';
import { savePhotoEntry } from '../../services/dataService';
import { uploadImage } from '../../services/cloudinaryService';
import { compressImage } from '../../services/imageCompression';
import { UploadArea } from './UploadArea';
import { AnalyzingOverlay } from './AnalyzingOverlay';
import { TechnicalPanel } from './TechnicalPanel';
import { ResultPanel } from './ResultPanel';
import { ShareCardModal } from '../ShareCardModal';
import { DailyPromptCard } from '../learn/DailyPromptCard';
import { GuestSavePrompt } from '../GuestSavePrompt';

interface ExifData {
  camera: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  captureDate: string | null;
}

interface EvaluationViewProps {
  entries: PhotoEntry[];
  setEntries: React.Dispatch<React.SetStateAction<PhotoEntry[]>>;
  onNavigateToArchives: () => void;
  onNavigateToLearn: () => void;
  onShowAuthModal: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  entries,
  setEntries,
  onNavigateToArchives,
  onNavigateToLearn,
  onShowAuthModal,
}) => {
  const todayPrompt = getTodayPrompt();
  const { user } = useAuth();
  const { remainingUses, incrementUsage, dailyLimit } = useDailyUsage(user?.id);
  const { duplicateWarning, cachedResult, checkImage, saveToCache, clearWarning, clearCache } = useImageCache();
  const {
    isAnalyzing,
    currentResult,
    error,
    thinkingState,
    thinkingIndex,
    currentTip,
    startAnalysis,
    clearResult,
    clearError,
    setResult,
  } = usePhotoAnalysis();

  const [currentUpload, setCurrentUpload] = useState<string | null>(null); // Cloudinary URL or base64
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 本地预览 URL
  const [currentExif, setCurrentExif] = useState<ExifData | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showGuestSavePrompt, setShowGuestSavePrompt] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const currentFileRef = useRef<File | null>(null);

  const isLimitReached = remainingUses <= 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
      setUploadError(`文件过大 (上限 ${maxSizeMB}MB)`);
      return;
    }

    setUploadError(null);
    currentFileRef.current = file;

    // 清除之前的上传状态，确保按钮禁用直到新图片上传完成
    setCurrentUpload(null);
    clearResult();

    // Set default EXIF values
    setCurrentExif({
      camera: 'Unknown',
      aperture: '--',
      shutterSpeed: '--',
      iso: '--',
      focalLength: '--',
      captureDate: null,
    });

    // 创建本地预览 URL（不用 base64，更快）
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // 尽早生成图片哈希检查重复（使用本地 blob URL）
    checkImage(objectUrl);

    // 同时开始上传到 Cloudinary (先压缩)
    setIsUploading(true);
    
    // 异步处理：压缩和上传
    const processUpload = async () => {
      try {
        // 1. 尝试压缩 (目标 ~2.5MB)
        let fileToUpload = file;
        try {
          fileToUpload = await compressImage(file, 2.5);
        } catch (compressionErr) {
          console.warn('Image compression failed, proceeding with original:', compressionErr);
        }

        // 2. 上传
        const result = await uploadImage(fileToUpload);
        setCurrentUpload(result.url); // 存 Cloudinary URL
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        
        // 降级：使用 base64 (尝试使用压缩后的文件)
        // 如果 uploadImage 失败，我们依然尝试用 compressed file 转 base64，因为更小
        const fileForBase64 = await compressImage(file, 2.5).catch(() => file);
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          setCurrentUpload(base64);
        };
        reader.readAsDataURL(fileForBase64);
        setUploadError(`${errorMessage}，已切换本地模式`);
      } finally {
        setIsUploading(false);
      }
    };

    processUpload();

    // Extract EXIF data (使用原始文件，因为 canvas 压缩会丢失 EXIF)
    try {
      const exifData = await exifr.parse(file);
      if (exifData) {
        let captureDate = null;
        if (exifData.DateTimeOriginal) {
          captureDate = new Date(exifData.DateTimeOriginal).toISOString();
        } else if (exifData.CreateDate) {
          captureDate = new Date(exifData.CreateDate).toISOString();
        }

        setCurrentExif({
          camera: exifData.Model || exifData.Make || 'Unknown',
          aperture: exifData.FNumber ? `f/${exifData.FNumber}` : '--',
          shutterSpeed: exifData.ExposureTime
            ? exifData.ExposureTime < 1
              ? `1/${Math.round(1 / exifData.ExposureTime)}s`
              : `${exifData.ExposureTime}s`
            : '--',
          iso: exifData.ISO ? `ISO ${exifData.ISO}` : '--',
          focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength)}mm` : '--',
          captureDate,
        });
      }
    } catch (e) {
      console.warn('EXIF extraction failed:', e);
    }
  };


  const handleStartAnalysis = async () => {
    if (!currentUpload || isLimitReached) return;

    // Pass empty string for context as the feature is removed
    const result = await startAnalysis(currentUpload, currentExif || {}, '');
    if (result) {
      if (result.analysis.suggestedTitles?.length) {
        setSelectedTitle(result.analysis.suggestedTitles[0]);
      }
      if (result.analysis.suggestedTags?.length) {
        setActiveTags(result.analysis.suggestedTags);
      }
      // Save full result to cache for future duplicate detection
      saveToCache(
        result.analysis.suggestedTitles?.[0] || 'Untitled',
        result.scores,
        result.analysis,
        currentUpload
      );
      incrementUsage();
    }
  };

  // Use cached result from previous analysis of the same image
  const handleUseCachedResult = () => {
    if (cachedResult) {
      // Load cached scores/analysis directly without API call
      setResult({
        scores: cachedResult.scores,
        analysis: cachedResult.analysis,
      });

      // Set title and tags from cached result
      if (cachedResult.analysis.suggestedTitles?.length) {
        setSelectedTitle(cachedResult.analysis.suggestedTitles[0]);
      } else {
        setSelectedTitle(cachedResult.title);
      }
      if (cachedResult.analysis.suggestedTags?.length) {
        setActiveTags(cachedResult.analysis.suggestedTags);
      }
      clearWarning();
    }
  };

  const handleCopyInstagram = () => {
    if (!currentResult?.analysis) return;
    const caption = currentResult.analysis.instagramCaption || '';
    const hashtags = currentResult.analysis.instagramHashtags
      ?.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ') || '';
    const text = `${caption}\n\n${hashtags}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRecord = async () => {
    if (!currentUpload || !currentResult || isSaving) return;

    setIsSaving(true);

    const photoDate = currentExif?.captureDate
      ? new Date(currentExif.captureDate).toLocaleDateString('zh-CN').replace(/\//g, '.')
      : new Date().toLocaleDateString('zh-CN').replace(/\//g, '.');

    const newEntry: PhotoEntry = {
      id: `SEQ_${Date.now().toString().slice(-6)}`,
      title: selectedTitle || 'UNTITLED',
      imageUrl: currentUpload,
      date: photoDate,
      location: 'STATION_ALPHA',
      notes: '', // Empty notes as the feature is removed
      tags: activeTags,
      params: {
        camera: currentExif?.camera,
        aperture: currentExif?.aperture,
        iso: currentExif?.iso,
        shutterSpeed: currentExif?.shutterSpeed,
      },
      scores: currentResult.scores,
      analysis: currentResult.analysis,
    };

    try {
      if (user) {
        const savedEntry = await savePhotoEntry(newEntry, user.id);
        if (savedEntry) {
          setEntries([savedEntry, ...entries]);
        } else {
          setEntries([newEntry, ...entries]);
          console.warn('保存到云端失败，已保存到本地');
        }
      } else {
        setEntries([newEntry, ...entries]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Keep current state so user can generate share card after saving
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save button click - show prompt for guests
  const handleSaveClick = () => {
    if (!user) {
      setShowGuestSavePrompt(true);
    } else {
      handleSaveRecord();
    }
  };

  // Guest chooses to login first, then save
  const handleLoginSave = () => {
    setPendingSave(true);
    setShowGuestSavePrompt(false);
    onShowAuthModal();
  };

  // Guest chooses to save to session only
  const handleSessionSave = () => {
    setShowGuestSavePrompt(false);
    handleSaveRecord();
  };

  // Complete pending save after successful login
  useEffect(() => {
    if (user && pendingSave && currentUpload && currentResult) {
      handleSaveRecord();
      setPendingSave(false);
    }
  }, [user, pendingSave]);

  const handleClearUpload = () => {
    // 清理 Object URL 避免内存泄漏
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setCurrentUpload(null);
    setPreviewUrl(null);
    clearResult();
    setCurrentExif(null);
    clearError();
    setUploadError(null);
    clearCache(); // Clear image hash and cached result state
    currentFileRef.current = null;
  };

  // 显示用的图片 URL（优先用本地预览，更快）
  const displayUrl = previewUrl || currentUpload;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      {/* Left Area: Display & Technical */}
      <div className={`flex flex-col bg-[#050505] transition-all duration-1000 ease-in-out ${currentResult ? 'lg:flex-grow-0 lg:w-[50%]' : 'flex-grow'}`}>
        <div className={`flex-grow flex flex-col items-center justify-center relative overflow-hidden min-h-[50vh] ${displayUrl ? 'p-0 sm:p-2' : 'p-6 sm:p-10'}`}>
          {/* Error Alert */}
          {(error || uploadError) && (
            <div className="absolute top-10 z-30 flex items-center gap-2 bg-[#D40000] text-white px-4 py-2 rounded-sm mono text-[10px] animate-in slide-in-from-top-4">
              <AlertCircle size={14} /> {error || uploadError}
              <button onClick={() => { clearError(); setUploadError(null); }} className="ml-4 hover:opacity-50">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && !currentResult && (
            <div className="absolute top-10 z-30 flex items-center gap-3 bg-amber-600 text-white px-4 py-3 rounded-sm text-sm animate-in slide-in-from-top-4">
              <AlertCircle size={16} />
              <div>
                <span className="font-medium">这张照片之前分析过</span>
                <span className="text-white/70 ml-2">
                  「{duplicateWarning.title}」{duplicateWarning.date}
                </span>
              </div>
              {cachedResult && (
                <button
                  onClick={handleUseCachedResult}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                >
                  使用上次结果
                </button>
              )}
              <button onClick={clearWarning} className="ml-2 hover:opacity-50">
                <X size={14} />
              </button>
            </div>
          )}

          {displayUrl ? (
            <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ${currentResult ? 'opacity-100' : 'scale-100'}`}>
              <div className="relative group w-full h-full flex items-center justify-center p-4">
                {(isAnalyzing || isUploading) && (
                  <AnalyzingOverlay
                    thinkingState={isUploading ? { main: '正在上传图片...', sub: '上传到云存储中' } : thinkingState}
                    thinkingIndex={isUploading ? 0 : thinkingIndex}
                    currentTip={currentTip}
                  />
                )}
                <img
                  src={displayUrl}
                  className="max-w-full max-h-[55vh] sm:max-h-[75vh] object-contain shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 bg-zinc-900/50"
                  alt="Preview"
                />
                
                {/* Floating Start Button for Mobile/Desktop Convenience */}
                {!currentResult && !isAnalyzing && !isUploading && (
                  <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-center z-20 px-4">
                    <button
                      onClick={handleStartAnalysis}
                      disabled={isLimitReached}
                      className="bg-[#D40000] hover:bg-[#B30000] text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 animate-in slide-in-from-bottom-4 backdrop-blur-sm bg-opacity-90"
                    >
                      <Zap size={18} fill="currentColor" />
                      {isLimitReached ? '次数用完' : '开始分析'}
                    </button>
                  </div>
                )}

                {!isAnalyzing && !isUploading && (
                  <button
                    onClick={handleClearUpload}
                    className="absolute top-4 right-4 bg-white text-black p-2 hover:bg-[#D40000] hover:text-white transition-all shadow-2xl z-30 rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                )}
                {/* 上传状态指示 */}
                {isUploading && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                    <Loader2 size={14} className="animate-spin text-[#D40000]" />
                    <span className="text-xs text-zinc-400">上传中...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full max-w-xl">
              {/* Compact Daily Prompt */}
              <div className="w-full mb-4 px-4">
                <DailyPromptCard
                  prompt={todayPrompt}
                  onStartChallenge={onNavigateToLearn}
                  compact
                />
              </div>
              <UploadArea onFileSelect={handleFileUpload} />
            </div>
          )}
        </div>

        {/* Technical Panel - Only show when image is uploaded */}
        {currentUpload && (
          <TechnicalPanel
            currentExif={currentExif}
            currentUpload={currentUpload}
            currentResult={currentResult}
            copied={copied}
            onCopyInstagram={handleCopyInstagram}
          />
        )}
      </div>

      {/* Right Panel: Analysis Result */}
      <ResultPanel
        currentResult={currentResult}
        currentUpload={currentUpload}
        isAnalyzing={isAnalyzing}
        isUploading={isUploading}
        isLimitReached={isLimitReached}
        remainingUses={remainingUses}
        user={user}
        selectedTitle={selectedTitle}
        activeTags={activeTags}
        isSaving={isSaving}
        onStartAnalysis={handleStartAnalysis}
        onSelectTitle={setSelectedTitle}
        onShowShareCard={() => setShowShareCard(true)}
        onSaveClick={handleSaveClick}
        onShowAuthModal={onShowAuthModal}
      />

      {/* Share Card Modal */}
      {showShareCard && currentResult && currentUpload && (
        <ShareCardModal
          currentUpload={currentUpload}
          currentResult={currentResult}
          currentExif={currentExif}
          selectedTitle={selectedTitle}
          activeTags={activeTags}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Guest Save Prompt Modal */}
      <GuestSavePrompt
        isOpen={showGuestSavePrompt}
        onClose={() => setShowGuestSavePrompt(false)}
        onLoginSave={handleLoginSave}
        onSessionSave={handleSessionSave}
      />
    </div>
  );
};
