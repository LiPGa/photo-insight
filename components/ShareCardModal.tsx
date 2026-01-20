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
  // Config: Xiaohongshu/Instagram Portrait Ratio (Target ~3:4 or longer)
  const WIDTH = 1080;
  const PADDING = 72;
  const BG_COLOR = '#0a0a0a'; // Deep Black
  const CARD_BG = '#141414';  // Slightly lighter panel
  const RED = '#ff4d4f';      // Accent Red
  const GOLD = '#D4AF37';     // Gold for high scores
  const WHITE = '#ffffff';
  const TEXT_SECONDARY = '#a3a3a3';
  
  // --- Score Tier Logic ---
  const getScoreTier = (score: number) => {
    if (score >= 9.0) return { label: '✦ 传世之作', color: GOLD, text: '#000000' };
    if (score >= 8.0) return { label: '◈ 大师作品', color: '#E0E0E0', text: '#000000' }; // Platinum
    if (score >= 7.0) return { label: '◎ 精彩瞬间', color: RED, text: '#FFFFFF' };
    if (score >= 6.0) return { label: '○ 值得记录', color: '#525252', text: '#FFFFFF' };
    return { label: '· 继续探索', color: '#262626', text: '#808080' };
  };
  const tier = getScoreTier(scores.overall);

  // Load image
  const photo = await loadImage(imageSrc);

  // --- Layout Calculations ---
  // 1. Image Section
  // Fit width (minus padding), dynamic height but capped
  const displayWidth = WIDTH - (PADDING * 2);
  const photoAspect = photo.width / photo.height;
  let displayHeight = displayWidth / photoAspect;
  
  // Cap height at 1:1.25 ratio to prevent super tall images pushing content off
  if (displayHeight > displayWidth * 1.25) {
    displayHeight = displayWidth * 1.25;
  }

  // 2. Text Prep (Diagnosis Only)
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  
  let shortDiagnosis = analysis.diagnosis || '';
  // Truncate if extremely long (keep mostly intact as it's the only text now)
  if (shortDiagnosis.length > 120) {
      shortDiagnosis = shortDiagnosis.substring(0, 118) + '...';
  }
  
  tempCtx.font = '500 42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  const diagnosisLines = wrapText(tempCtx, shortDiagnosis, displayWidth - 40);

  // --- Height Summation ---
  let currentY = PADDING;
  currentY += displayHeight; // Photo
  currentY += 60; // Gap
  currentY += 160; // Title & Score Row
  
  if (tags.length > 0) currentY += 100; // Tags
  
  if (exif) currentY += 120; // EXIF
  
  currentY += 340; // Dimension Scores Grid (Generous space)
  
  // Diagnosis Box
  const diagBoxHeight = (diagnosisLines.length * 64) + 100; 
  currentY += diagBoxHeight;
  
  currentY += 180; // Footer
  
  const TOTAL_HEIGHT = currentY;

  // --- Draw ---
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = TOTAL_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, TOTAL_HEIGHT);

  let y = PADDING;

  // 1. Photo
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  
  ctx.beginPath();
  ctx.roundRect(PADDING, y, displayWidth, displayHeight, 24);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.clip();
  
  // Draw Image (Center Crop/Fit)
  const sWidth = photo.width;
  const sHeight = (photo.width / displayWidth) * displayHeight;
  const sY = (photo.height - sHeight) / 2;
  ctx.drawImage(photo, 0, sY, sWidth, sHeight, PADDING, y, displayWidth, displayHeight);
  ctx.restore();
  
  // Watermark
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 24px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText('PhotoInsight', WIDTH - PADDING - 20, y + displayHeight - 20);
  ctx.restore();

  y += displayHeight + 60;

  // 2. Title & Big Score
  // Title Left
  ctx.textAlign = 'left';
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  let drawTitle = title || 'UNTITLED';
  // Truncate title
  if (ctx.measureText(drawTitle).width > displayWidth - 350) {
      drawTitle = drawTitle.substring(0, 8) + '...';
  }
  ctx.fillText(drawTitle, PADDING, y + 50);

  // Score Right (Massive)
  const scoreText = scores.overall.toFixed(1);
  ctx.textAlign = 'right';
  ctx.fillStyle = tier.color === GOLD ? GOLD : RED; // Use Gold for top tier, Red for others
  ctx.font = '800 140px "IBM Plex Mono", monospace'; 
  ctx.fillText(scoreText, WIDTH - PADDING, y + 60);

  // Label "Score"
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('综合评分', WIDTH - PADDING - 280, y + 10); 
  
  // Badge Below Score
  const badgeW = 200;
  const badgeH = 50;
  const badgeX = WIDTH - PADDING - badgeW + 10;
  const badgeY = y + 80;
  
  ctx.fillStyle = tier.color;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 25);
  ctx.fill();
  
  ctx.fillStyle = tier.text;
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tier.label, badgeX + badgeW/2, badgeY + 34);

  y += 180;

  // 3. Tags
  if (tags.length > 0) {
    let tagX = PADDING;
    ctx.textAlign = 'left';
    ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    
    for (const tag of tags.slice(0, 3)) {
      const tagText = `# ${tag}`;
      const metrics = ctx.measureText(tagText);
      const tagW = metrics.width + 48;
      
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      ctx.roundRect(tagX, y, tagW, 56, 28);
      ctx.fill();
      
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.fillText(tagText, tagX + 24, y + 38);
      
      tagX += tagW + 24;
    }
    y += 100;
  }

  // 4. EXIF
  if (exif && (exif.camera || exif.aperture)) {
     y += 20;
     ctx.strokeStyle = '#333';
     ctx.lineWidth = 2;
     ctx.beginPath();
     ctx.moveTo(PADDING, y);
     ctx.lineTo(WIDTH - PADDING, y);
     ctx.stroke();
     
     y += 70;
     
     ctx.fillStyle = TEXT_SECONDARY;
     ctx.font = '400 30px "IBM Plex Mono", monospace';
     ctx.textAlign = 'left';
     
     const parts = [];
     if (exif.camera && exif.camera !== 'Unknown') parts.push(exif.camera);
     const lensInfo = [exif.focalLength, exif.aperture, exif.shutterSpeed, exif.iso]
        .filter(x => x && x !== '--').join('  ');
     if (lensInfo) parts.push(lensInfo);
     
     ctx.fillText(parts.join(' | '), PADDING, y);
     y += 70;
  }

  // 5. Dimension Scores (Clean Grid)
  y += 40;
  const dimensions = [
      { label: '构图', val: scores.composition },
      { label: '光影', val: scores.light },
      { label: '色彩', val: scores.color },
      { label: '技术', val: scores.technical },
      { label: '表达', val: scores.expression },
  ];
  
  const itemW = (displayWidth - 60) / 3; 
  
  dimensions.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = PADDING + (col * (itemW + 30));
      const dy = y + (row * 130); 
      
      // Label
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, x, dy);
      
      // Bar Track
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      ctx.roundRect(x, dy + 20, itemW - 20, 16, 8);
      ctx.fill();
      
      // Bar Fill
      let barColor = WHITE;
      if (d.val >= 8.5) barColor = GOLD;
      else if (d.val >= 7.0) barColor = WHITE;
      else barColor = RED;

      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(x, dy + 20, (itemW - 20) * (d.val / 10), 16, 8);
      ctx.fill();
      
      // Value
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 40px "IBM Plex Mono", monospace';
      ctx.fillText(d.val.toFixed(1), x + itemW - 60, dy + 5); 
  });
  
  y += 320; 

  // 6. Review Card (Diagnosis Only)
  y += 20;
  
  ctx.fillStyle = CARD_BG;
  ctx.beginPath();
  ctx.roundRect(PADDING, y, displayWidth, diagBoxHeight, 32);
  ctx.fill();
  
  // Accent Line
  ctx.fillStyle = tier.color === GOLD ? GOLD : RED;
  ctx.beginPath();
  ctx.roundRect(PADDING, y + 40, 6, diagBoxHeight - 80, 3);
  ctx.fill();
  
  let textY = y + 70;
  const textX = PADDING + 50;
  
  ctx.fillStyle = '#F0F0F0'; // Bright text
  ctx.font = '500 42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  
  diagnosisLines.forEach(line => {
      ctx.fillText(line, textX, textY);
      textY += 68; 
  });
  
  y += diagBoxHeight;

  // 7. Footer
  y += 80;
  ctx.fillStyle = '#444';
  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('—— AI 摄影美学分析 ——', WIDTH / 2, y);
  
  y += 50;
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = '600 36px "IBM Plex Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText('PHOTO INSIGHT', WIDTH / 2, y);

  return canvas.toDataURL('image/jpeg', 0.95);
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
