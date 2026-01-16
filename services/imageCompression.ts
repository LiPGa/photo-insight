
/**
 * 图片压缩服务
 * 用于在上传到云存储前压缩图片，节省带宽和存储空间
 */

/**
 * 压缩图片到指定大小（默认为 2.5MB 左右）
 * 策略：
 * 1. 如果文件小于目标大小，直接返回
 * 2. 限制最大边长（例如 2560px）
 * 3. 调整 JPEG 质量
 * 
 * @param file 原始文件
 * @param targetSizeMB 目标大小（MB）
 * @returns 压缩后的文件
 */
export async function compressImage(file: File, targetSizeMB: number = 2.5): Promise<File> {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  
  // 如果文件已经够小，直接返回
  if (file.size <= targetSizeBytes) {
    return file;
  }

  // 只处理图片
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      // 1. 尺寸限制策略
      // 如果文件很大 (>5MB)，我们更积极地调整尺寸
      // 2560px 对于大多数屏幕显示和分析来说已经足够清晰 (2K分辨率)
      const MAX_DIMENSION = file.size > 5 * 1024 * 1024 ? 2048 : 2560;
      
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Canvas context not supported, returning original file');
        resolve(file);
        return;
      }

      // 使用平滑缩放算法
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // 2. 质量压缩策略
      // 优先尝试 WebP (通常压缩率更高且质量更好)，如果浏览器不支持会自动回退或由后续逻辑处理
      // 但考虑到兼容性和 EXIF 信息的潜在丢失(虽然 canvas 本身就会丢 EXIF)，
      // 这里统一转为 JPEG，因为它是照片最通用的格式。
      // 注意：Canvas 导出不仅会丢失 EXIF，也会丢失色彩配置文件。
      // 但为了"节省空间"这是必要的权衡。原始 EXIF 数据我们应该在压缩前提取并在上传时另存(Current logic does this in EvaluationView)。
      
      const mimeType = 'image/jpeg';
      let quality = 0.85; // 初始质量

      const tryCompress = (currentQuality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // 失败回退
              return;
            }

            // 如果压缩后满足要求，或者质量已经很低(避免过度失真)，则返回
            if (blob.size <= targetSizeBytes || currentQuality <= 0.5) {
              // 构造新文件，保留原名（后缀可能需要变，但为了简单暂保持原名或加 .jpg）
              // Cloudinary 通常能识别内容。为了安全，我们把 type 设为 jpeg
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const newFile = new File([blob], newName, {
                type: mimeType,
                lastModified: Date.now(),
              });
              
              console.log(`压缩完成: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(newFile.size / 1024 / 1024).toFixed(2)}MB (Quality: ${currentQuality})`);
              resolve(newFile);
            } else {
              // 递归降低质量
              tryCompress(currentQuality - 0.15);
            }
          },
          mimeType,
          currentQuality
        );
      };

      tryCompress(quality);
    };

    img.onerror = (error) => {
      console.warn('Image load failed during compression', error);
      resolve(file);
    };
  });
}
