import React, { useRef, useState } from 'react';
import { X, Camera, Lightbulb, Download } from 'lucide-react';
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

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  currentUpload,
  currentResult,
  currentExif,
  selectedTitle,
  activeTags,
  onClose,
}) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingCard(true);
    setError(null);

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#000',
        scale: 2,
        useCORS: true,
      });

      const fileName = `photopath_${selectedTitle || 'insight'}_${Date.now()}.png`;

      // Convert canvas to blob for sharing
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png');
      });

      // Detect iOS devices
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      // Create file for sharing
      const file = new File([blob], fileName, { type: 'image/png' });
      
      // Check if Web Share API with file sharing is available
      const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
      
      if (isIOS) {
        // On iOS, use Web Share API which shows Photos as an option in the share sheet
        // User can select "Save Image" which saves directly to Photos app
        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: selectedTitle || 'PhotoPath 点评卡片',
            });
          } catch (shareError) {
            // User cancelled or share failed - this is OK, just return
            if ((shareError as Error).name !== 'AbortError') {
              // If it's not a user cancellation, fall back to download
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
            }
          }
        } else {
          // Fallback for iOS if Web Share API not available
          // Create download link - user can long-press to save to Photos
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        }
      } else if (isAndroid && canShareFiles) {
        // Use Web Share API for Android
        await navigator.share({
          files: [file],
          title: selectedTitle || 'PhotoPath 点评卡片',
        });
      } else {
        // Fallback to download for desktop and other browsers
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      // User cancelled share is not an error
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('生成卡片失败:', err);
      setError('生成卡片失败，请重试');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto"
      onClick={onClose}
    >
      <div className="relative max-w-sm sm:max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-full p-2"
        >
          <X size={20} />
        </button>

        {/* Card content */}
        <div
          ref={shareCardRef}
          className="bg-[#0a0a0a] rounded-lg overflow-hidden"
          style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif" }}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#D40000] rounded flex items-center justify-center text-[9px] sm:text-[10px] font-black">
                AP
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-400">PhotoPath</span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-600 mono">Lens Insight</span>
          </div>

          {/* Photo */}
          <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <img
              src={currentUpload}
              className="w-full aspect-[4/3] object-cover rounded-lg"
              alt=""
              crossOrigin="anonymous"
            />
          </div>

          {/* Title and tags */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{selectedTitle || '未命名作品'}</h3>
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
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-white/5 flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Camera size={12} className="text-zinc-600" />
                <span className="text-zinc-400">{currentExif.camera}</span>
              </div>
              <span>{currentExif.aperture}</span>
              <span>{currentExif.shutterSpeed}</span>
              <span>{currentExif.iso}</span>
            </div>
          )}

          {/* Scores */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: '构图', score: currentResult.scores.composition },
                { label: '光影', score: currentResult.scores.light },
                { label: '叙事', score: currentResult.scores.content },
                { label: '表达', score: currentResult.scores.completeness },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
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
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/5">
              <span className="text-xs sm:text-sm font-medium text-zinc-400">综合评分</span>
              <span className="text-2xl sm:text-3xl font-black text-[#D40000]">
                {currentResult.scores.overall.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Diagnosis summary */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5">
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
              {currentResult.analysis.diagnosis.split('\n')[0]}
            </p>
          </div>

          {/* Evolution strategy */}
          <div className="mx-4 sm:mx-6 mb-4 sm:mb-5 p-3 sm:p-4 bg-[#D40000]/10 border border-[#D40000]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={12} className="sm:w-[14px] sm:h-[14px] text-[#D40000]" />
              <span className="text-[11px] sm:text-xs font-bold text-[#D40000]">进化策略</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
              {currentResult.analysis.improvement}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-zinc-600 mono">
              AI 摄影点评 · {new Date().toLocaleDateString('zh-CN')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-600">photopath.app</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-center text-sm text-red-400">{error}</div>
        )}

        {/* Save/Share button */}
        <button
          onClick={generateShareCard}
          disabled={isGeneratingCard}
          className="mt-3 sm:mt-4 w-full py-3 sm:py-4 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-800 transition-all rounded-lg flex items-center justify-center gap-3"
        >
          {isGeneratingCard ? (
            <span className="text-sm">生成中...</span>
          ) : (
            <>
              <Download size={18} />
              <span className="text-sm font-medium">保存卡片</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
