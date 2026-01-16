import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Lightbulb, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { DetailedScores, DetailedAnalysis } from '../types';

interface ExifData {
  camera?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  captureDate?: string | null;
}

interface ShareCardModalProps {
  currentUpload: string;
  currentResult: { scores: DetailedScores; analysis: DetailedAnalysis };
  currentExif: ExifData | null;
  selectedTitle: string;
  activeTags: string[];
  onClose: () => void;
}

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Helper function to download the image
const downloadImage = async (imageUrl: string, title: string, isMobile: boolean): Promise<boolean> => {
  const fileName = `photopath_${title || 'insight'}_${Date.now()}.png`;

  try {
    const blob = dataURLtoBlob(imageUrl);

    // Try Web Share API first (best for mobile)
    if (isMobile && navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'image/png' });
      const shareData = { files: [file] };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    }

    // Fallback: Create blob URL and download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup after a delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    return true;
  } catch (err) {
    console.error('Download failed:', err);
    return false;
  }
};

// Timeout wrapper for promises
const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
};

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  currentUpload,
  currentResult,
  currentExif,
  selectedTitle,
  activeTags,
  onClose,
}) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Clean up the generated image URL when the component unmounts
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const generateShareCard = async () => {
    if (!shareCardRef.current || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationComplete(false);

    // Make the share card visible for rendering if it was hidden
    if (shareCardRef.current) {
      shareCardRef.current.style.display = 'block';
    }

    try {
      // Give the browser a moment to render the element
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvasPromise = html2canvas(shareCardRef.current, {
        backgroundColor: '#000',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 15000,
      });

      // Add 30 second timeout for the entire generation process
      const canvas = await withTimeout(
        canvasPromise,
        30000,
        '生成超时，请重试'
      );

      const imageUrl = canvas.toDataURL('image/png', 0.95);
      setGeneratedImageUrl(imageUrl);
      setGenerationComplete(true);

    } catch (err) {
      console.error('Failed to generate share card:', err);
      const errorMsg = err instanceof Error ? err.message : '生成失败，请刷新或稍后重试。';
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
      // Hide the original card after rendering to only show the image
      if (shareCardRef.current) {
        shareCardRef.current.style.display = 'none';
      }
    }
  };

  const handleBack = () => {
    setGeneratedImageUrl(null);
    setGenerationComplete(false);
    setError(null);
     if(shareCardRef.current) {
        shareCardRef.current.style.display = 'block';
    }
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!generatedImageUrl || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const success = await downloadImage(generatedImageUrl, selectedTitle, isMobile);
      if (!success) {
        setError('保存失败，请长按图片手动保存');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('保存失败，请长按图片手动保存');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] rounded-lg max-w-sm sm:max-w-md w-full p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors z-20"
        >
          <X size={24} />
        </button>

        {/* View after image is generated */}
        {generationComplete && generatedImageUrl ? (
          <div className="text-white text-center">
            <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              生成成功
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {isMobile ? '点击按钮保存，或长按图片手动保存' : '点击下方按钮下载图片'}
            </p>
            <div className="bg-black rounded-lg p-2 my-4 flex justify-center">
               <img
                src={generatedImageUrl}
                alt="生成的分享卡片"
                className="max-h-[60vh] w-auto max-w-full rounded-md object-contain"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 py-3 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">保存中...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span className="font-medium">{isMobile ? '保存到相册' : '下载长图'}</span>
                </>
              )}
            </button>
            <button
              onClick={handleBack}
              className="w-full mt-2 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              <span className="text-sm">返回</span>
            </button>
          </div>
        ) : (
          <>
            {/* Generation Button */}
            <div className={`text-center transition-opacity ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
                <h3 className="text-lg font-bold mb-1 text-white">分享点评卡片</h3>
                <p className="text-sm text-zinc-400 mb-4">将本次 AI 点评生成为一张可分享的图片。</p>
                <button
                    onClick={generateShareCard}
                    disabled={isGenerating}
                    className="w-full py-3 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-800 disabled:cursor-not-allowed transition-all rounded-lg flex items-center justify-center gap-3 text-white"
                >
                    <Download size={18} />
                    <span className="font-medium">生成长图</span>
                </button>
            </div>

            {/* Loading Indicator */}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-lg">
                    <div className="w-6 h-6 border-4 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-zinc-300">正在生成中，请稍候...</span>
                </div>
            )}
          </>
        )}

        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>


        {/* Hidden element for rendering */}
        <div className="absolute -left-[9999px] top-0">
             <div
                ref={shareCardRef}
                className="bg-[#0a0a0a] rounded-lg overflow-hidden w-full"
                style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif", width: '400px' }}
                >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#D40000] rounded flex items-center justify-center text-[10px] font-black">
                AP
              </div>
              <span className="text-sm font-medium text-zinc-400">PhotoPath</span>
            </div>
            <span className="text-xs text-zinc-600 mono">Lens Insight</span>
          </div>

          {/* Photo */}
          <div className="px-4 pt-4">
            <img
              src={currentUpload}
              className="w-full aspect-[4/3] object-cover rounded-lg"
              alt=""
              crossOrigin="anonymous"
            />
          </div>

          {/* Title and tags */}
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xl font-bold text-white mb-2">{selectedTitle || '未命名作品'}</h3>
            <div className="flex flex-wrap gap-2">
              {activeTags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Camera params */}
          {currentExif && (
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Camera size={14} className="text-zinc-600" />
                <span className="text-zinc-400">{currentExif.camera}</span>
              </div>
              <span>{currentExif.aperture}</span>
              <span>{currentExif.shutterSpeed}</span>
              <span>{currentExif.iso}</span>
            </div>
          )}

          {/* Scores */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: '构图', score: currentResult.scores.composition },
                { label: '光影', score: currentResult.scores.light },
                { label: '色彩', score: currentResult.scores.color },
                { label: '技术', score: currentResult.scores.technical },
                { label: '表达', score: currentResult.scores.expression },
              ].map((item, idx) => (
                <div key={item.label} className={`flex items-center justify-between ${idx === 4 ? 'col-span-2' : ''}`}>
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D40000] rounded-full"
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 w-8 text-right">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall score */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-sm font-medium text-zinc-400">综合评分</span>
              <span className="text-3xl font-black text-[#D40000]">
                {currentResult.scores.overall.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Diagnosis summary */}
          <div className="px-6 pb-5">
            <h4 className="text-sm font-bold text-zinc-300 mb-2">诊断分析</h4>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.diagnosis}
            </p>
          </div>

          {/* Evolution strategy */}
          <div className="mx-6 mb-5 p-4 bg-[#D40000]/10 border border-[#D40000]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-[#D40000]" />
              <span className="text-xs font-bold text-[#D40000]">进化策略</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.improvement}
            </p>
          </div>

          {/* Story and mood notes */}
          <div className="px-6 pb-5 space-y-3">
            {currentResult.analysis.storyNote && (
              <div>
                <span className="text-xs text-zinc-500">故事感：</span>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.storyNote}
                </p>
              </div>
            )}
            {currentResult.analysis.moodNote && (
              <div>
                <span className="text-xs text-zinc-500">情绪：</span>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.moodNote}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 mono">
              AI 摄影点评 · {new Date().toLocaleDateString('zh-CN')}
            </span>
            <span className="text-[10px] text-zinc-600">photopath.app</span>
          </div>
            </div>
        </div>
    </div>
  );
};