import { MAX_FILE_SIZE } from '../constants';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvmjukj2e';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'photoinsight';

// Cloudinary file limits (Cloudinary free tier supports up to 20MB for images, setting to 15MB for safety)
// Use the same limit as UI validation to avoid mismatches
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * 上传图片到 Cloudinary
 * @param file - 图片文件
 * @returns 图片 URL 和元数据
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  // Validate file before upload (using same limit as UI validation)
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
    throw new Error(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，上限 ${maxSizeMB}MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    throw new Error(`不支持的文件格式: ${file.type || '未知'}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'photoinsight');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'POST', body: formData });
  } catch (fetchError) {
    throw new Error(`网络错误: ${fetchError}`);
  }

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore parse error
    }

    // Provide more specific error messages
    const cloudinaryError = errorBody?.error?.message || errorBody?.message;
    if (response.status === 400) {
      if (cloudinaryError?.includes('preset')) {
        throw new Error('上传配置错误，请联系管理员');
      }
      if (cloudinaryError?.includes('Invalid')) {
        throw new Error('文件格式不支持');
      }
      throw new Error(`上传失败: ${cloudinaryError || '请求无效'}`);
    }
    if (response.status === 401) {
      throw new Error('上传认证失败，请刷新页面重试');
    }
    if (response.status === 429) {
      throw new Error('上传次数已达上限，请稍后重试');
    }
    throw new Error(`图片上传失败: ${cloudinaryError || `HTTP ${response.status}`}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

/**
 * 生成 Cloudinary 缩略图 URL
 * 利用 Cloudinary 的 URL 变换功能，无需额外请求
 */
export function getThumbnailUrl(url: string, width = 200, height?: number): string {
  if (!url || !url.includes('cloudinary')) {
    return url; // 非 Cloudinary URL，原样返回
  }

  const transformation = height
    ? `w_${width},h_${height},c_fill,q_auto,f_auto`
    : `w_${width},c_scale,q_auto,f_auto`;

  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * 生成优化后的图片 URL（用于详情页等需要高清图的场景）
 */
export function getOptimizedUrl(url: string, maxWidth = 1200): string {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  return url.replace('/upload/', `/upload/w_${maxWidth},c_limit,q_auto,f_auto/`);
}

/**
 * 检查是否是 Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com');
}

/**
 * 从 base64 上传（兼容旧数据）
 */
export async function uploadBase64(base64: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', base64);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'photoinsight');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore
    }
    const errorMessage = errorBody?.error?.message || `HTTP ${response.status}`;
    throw new Error(`图片上传失败: ${errorMessage}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}
