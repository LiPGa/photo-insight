import { useState, useEffect } from 'react';

const THUMBNAIL_CACHE_KEY = 'photoinsight_thumbnails';
const THUMBNAIL_SIZE = 200; // 缩略图最大尺寸

// 生成缩略图
export const generateThumbnail = (
  imageUrl: string,
  maxSize: number = THUMBNAIL_SIZE
): Promise<string> => {
  return new Promise((resolve) => {
    // 如果不是 base64，直接返回原图
    if (!imageUrl.startsWith('data:')) {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // 计算缩放比例
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 使用较低质量的 JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
};

// 获取或生成缩略图
export const getThumbnail = async (id: string, imageUrl: string): Promise<string> => {
  // 尝试从缓存获取
  try {
    const cache = JSON.parse(sessionStorage.getItem(THUMBNAIL_CACHE_KEY) || '{}');
    if (cache[id]) {
      return cache[id];
    }
  } catch (e) {}

  // 生成新缩略图
  const thumbnail = await generateThumbnail(imageUrl);

  // 保存到缓存
  try {
    const cache = JSON.parse(sessionStorage.getItem(THUMBNAIL_CACHE_KEY) || '{}');
    cache[id] = thumbnail;
    // 限制缓存大小
    const keys = Object.keys(cache);
    if (keys.length > 30) {
      delete cache[keys[0]];
    }
    sessionStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}

  return thumbnail;
};

// Hook: 懒加载缩略图
export function useThumbnail(id: string, imageUrl: string, enabled: boolean = true) {
  const [thumbnail, setThumbnail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !imageUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    getThumbnail(id, imageUrl).then((thumb) => {
      if (!cancelled) {
        setThumbnail(thumb);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, imageUrl, enabled]);

  return { thumbnail, loading };
}
