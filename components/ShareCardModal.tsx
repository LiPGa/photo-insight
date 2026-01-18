import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { DetailedScores, DetailedAnalysis } from '../types';

// Detect mobile device once
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

// Load image with timeout
const loadImage = (src: string, timeout = 5000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => reject(new Error('Image load timeout')), timeout);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load failed'));
    };
    img.src = src;
  });
};

// Wrap text to fit within maxWidth, returns array of lines
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    let currentLine = '';
    const chars = paragraph.split('');

    for (const char of chars) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
};

// Native Canvas rendering - much faster than html2canvas
const renderShareCardCanvas = async (
  imageSrc: string,
  title: string,
  tags: string[],
  exif: ExifData | null,
  scores: DetailedScores,
  analysis: DetailedAnalysis
): Promise<string> => {
  // Canvas dimensions
  const WIDTH = 800;
  const PADDING = 48;
  const CONTENT_WIDTH = WIDTH - PADDING * 2;

  // Colors
  const BG_COLOR = '#0a0a0a';
  const RED = '#D40000';
  const WHITE = '#ffffff';
  const GRAY_300 = '#d4d4d8';
  const GRAY_400 = '#a1a1aa';
  const GRAY_500 = '#71717a';
  const GRAY_600 = '#52525b';
  const GRAY_800 = '#27272a';
  const GRAY_900 = '#18181b';

  // Load image first
  const photo = await loadImage(imageSrc);

  // Calculate photo dimensions (4:3 aspect ratio, fit width)
  const photoWidth = CONTENT_WIDTH;
  const photoHeight = photoWidth * 0.75;

  // Create temporary canvas to measure text heights
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Pre-calculate text sections
  const diagnosisLines = wrapText(tempCtx, analysis.diagnosis || '', CONTENT_WIDTH);
  const improvementLines = wrapText(tempCtx, analysis.improvement || '', CONTENT_WIDTH - 32);
  const storyLines = analysis.storyNote ? wrapText(tempCtx, analysis.storyNote, CONTENT_WIDTH) : [];
  const moodLines = analysis.moodNote ? wrapText(tempCtx, analysis.moodNote, CONTENT_WIDTH) : [];

  // Calculate total height
  let totalHeight = 0;
  totalHeight += 80;  // Header
  totalHeight += 16 + photoHeight + 16; // Photo section
  totalHeight += 60 + (tags.length > 0 ? 40 : 0); // Title + tags
  totalHeight += exif ? 50 : 0; // EXIF
  totalHeight += 200; // Scores section
  totalHeight += 60 + diagnosisLines.length * 36; // Diagnosis
  totalHeight += 80 + improvementLines.length * 36; // Improvement box
  totalHeight += storyLines.length > 0 ? 40 + storyLines.length * 32 : 0;
  totalHeight += moodLines.length > 0 ? 40 + moodLines.length * 32 : 0;
  totalHeight += 60; // Footer
  totalHeight += 40; // Extra padding

  // Create main canvas
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  let y = 0;

  // === Header ===
  y += 32;
  // Logo box
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.roundRect(PADDING, y, 48, 48, 8);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('AP', PADDING + 12, y + 32);

  // App name
  ctx.fillStyle = GRAY_400;
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('知影 PhotoInsight', PADDING + 64, y + 34);

  // Lens Insight text
  ctx.fillStyle = GRAY_600;
  ctx.font = '20px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Lens Insight', WIDTH - PADDING, y + 34);
  ctx.textAlign = 'left';

  y += 48;

  // Header border
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // === Photo ===
  y += 16;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(PADDING, y, photoWidth, photoHeight, 12);
  ctx.clip();

  // Draw photo with cover fit
  const imgRatio = photo.width / photo.height;
  const targetRatio = photoWidth / photoHeight;
  let sx = 0, sy = 0, sw = photo.width, sh = photo.height;

  if (imgRatio > targetRatio) {
    sw = photo.height * targetRatio;
    sx = (photo.width - sw) / 2;
  } else {
    sh = photo.width / targetRatio;
    sy = (photo.height - sh) / 2;
  }

  ctx.drawImage(photo, sx, sy, sw, sh, PADDING, y, photoWidth, photoHeight);
  ctx.restore();

  y += photoHeight + 24;

  // === Title ===
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(title || '未命名作品', PADDING, y);
  y += 16;

  // === Tags ===
  if (tags.length > 0) {
    y += 12;
    let tagX = PADDING;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    for (const tag of tags.slice(0, 3)) {
      const tagWidth = ctx.measureText(tag).width + 16;
      ctx.fillStyle = GRAY_900;
      ctx.beginPath();
      ctx.roundRect(tagX, y, tagWidth, 28, 4);
      ctx.fill();
      ctx.fillStyle = GRAY_500;
      ctx.fillText(tag, tagX + 8, y + 20);
      tagX += tagWidth + 8;
    }
    y += 40;
  }

  // Border
  y += 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // === EXIF ===
  if (exif) {
    y += 24;
    ctx.fillStyle = GRAY_500;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    const exifParts = [exif.camera, exif.aperture, exif.shutterSpeed, exif.iso].filter(Boolean);
    ctx.fillText(exifParts.join('  ·  '), PADDING, y);
    y += 24;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(WIDTH - PADDING, y);
    ctx.stroke();
  }

  // === Scores ===
  y += 32;
  const scoreItems = [
    { label: '构图', score: scores.composition },
    { label: '光影', score: scores.light },
    { label: '色彩', score: scores.color },
    { label: '技术', score: scores.technical },
    { label: '表达', score: scores.expression },
  ];

  const colWidth = CONTENT_WIDTH / 2;

  for (let i = 0; i < scoreItems.length; i++) {
    const item = scoreItems[i];
    const col = i % 2;
    const x = PADDING + col * colWidth;

    // Label
    ctx.fillStyle = GRAY_500;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(item.label, x, y);

    // Progress bar background
    const barX = x + 60;
    const barWidth = 120;
    ctx.fillStyle = GRAY_800;
    ctx.beginPath();
    ctx.roundRect(barX, y - 10, barWidth, 8, 4);
    ctx.fill();

    // Progress bar fill
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.roundRect(barX, y - 10, barWidth * (item.score / 10), 8, 4);
    ctx.fill();

    // Score value
    ctx.fillStyle = GRAY_300;
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.score.toFixed(1), barX + barWidth + 48, y);
    ctx.textAlign = 'left';

    if (col === 1 || i === scoreItems.length - 1) {
      y += 36;
    }
  }

  // Overall score
  y += 16;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  y += 32;
  ctx.fillStyle = GRAY_400;
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('综合评分', PADDING, y);

  ctx.fillStyle = RED;
  ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(scores.overall.toFixed(1), WIDTH - PADDING, y + 8);
  ctx.textAlign = 'left';

  y += 40;

  // === Diagnosis ===
  y += 16;
  ctx.fillStyle = GRAY_300;
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('诊断分析', PADDING, y);
  y += 24;

  ctx.fillStyle = GRAY_400;
  ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
  for (const line of diagnosisLines) {
    ctx.fillText(line, PADDING, y);
    y += 32;
  }

  // === Improvement Box ===
  y += 16;
  const boxPadding = 16;
  const improvementBoxHeight = 56 + improvementLines.length * 32;

  // Box background
  ctx.fillStyle = 'rgba(212, 0, 0, 0.1)';
  ctx.strokeStyle = 'rgba(212, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(PADDING, y, CONTENT_WIDTH, improvementBoxHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Box title
  y += boxPadding + 20;
  ctx.fillStyle = RED;
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('💡 进化策略', PADDING + boxPadding, y);
  y += 24;

  // Box content
  ctx.fillStyle = GRAY_300;
  ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
  for (const line of improvementLines) {
    ctx.fillText(line, PADDING + boxPadding, y);
    y += 32;
  }

  y += boxPadding;

  // === Story Note ===
  if (storyLines.length > 0) {
    y += 16;
    ctx.fillStyle = GRAY_500;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('故事感：', PADDING, y);
    y += 24;

    ctx.fillStyle = GRAY_400;
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    for (const line of storyLines) {
      ctx.fillText(line, PADDING, y);
      y += 28;
    }
  }

  // === Mood Note ===
  if (moodLines.length > 0) {
    y += 16;
    ctx.fillStyle = GRAY_500;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('情绪：', PADDING, y);
    y += 24;

    ctx.fillStyle = GRAY_400;
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    for (const line of moodLines) {
      ctx.fillText(line, PADDING, y);
      y += 28;
    }
  }

  // === Footer ===
  y += 24;
  ctx.fillStyle = 'rgba(24, 24, 27, 0.5)';
  ctx.fillRect(0, y, WIDTH, 60);

  y += 36;
  ctx.fillStyle = GRAY_600;
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillText(`AI 摄影点评 · ${new Date().toLocaleDateString('zh-CN')}`, PADDING, y);

  ctx.textAlign = 'right';
  ctx.fillText('photoinsight.app', WIDTH - PADDING, y);
  ctx.textAlign = 'left';

  // Export as JPEG for speed
  return canvas.toDataURL('image/jpeg', 0.9);
};

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Helper function to download the image
const downloadImage = async (imageUrl: string, title: string): Promise<boolean> => {
  const fileName = `photoinsight_${title || 'insight'}_${Date.now()}.jpg`;

  try {
    const blob = dataURLtoBlob(imageUrl);

    // Try Web Share API first (best for mobile)
    if (isMobileDevice && navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'image/jpeg' });
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

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 300);

    return true;
  } catch (err) {
    console.error('Download failed:', err);
    return false;
  }
};

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  currentUpload,
  currentResult,
  currentExif,
  selectedTitle,
  activeTags,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Clean up the generated image URL when the component unmounts
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const generateShareCard = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationComplete(false);

    try {
      const imageUrl = await renderShareCardCanvas(
        currentUpload,
        selectedTitle,
        activeTags,
        currentExif,
        currentResult.scores,
        currentResult.analysis
      );

      setGeneratedImageUrl(imageUrl);
      setGenerationComplete(true);
    } catch (err) {
      console.error('Failed to generate share card:', err);
      setError('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [currentUpload, selectedTitle, activeTags, currentExif, currentResult, isGenerating]);

  const handleBack = () => {
    setGeneratedImageUrl(null);
    setGenerationComplete(false);
    setError(null);
  };

  const handleSave = useCallback(async () => {
    if (!generatedImageUrl || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const success = await downloadImage(generatedImageUrl, selectedTitle);
      if (!success) {
        setError('保存失败，请长按图片手动保存');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('保存失败，请长按图片手动保存');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImageUrl, isSaving, selectedTitle]);

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
              {isMobileDevice ? '点击按钮保存，或长按图片手动保存' : '点击下方按钮下载图片'}
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
                  <span className="font-medium">{isMobileDevice ? '保存到相册' : '下载长图'}</span>
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
                    <span className="mt-4 text-zinc-300">正在生成中...</span>
                </div>
            )}
          </>
        )}

        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};
