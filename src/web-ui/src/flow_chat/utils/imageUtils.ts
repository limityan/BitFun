/**
 * Media processing utility functions
 */

import type { ImageContext, VideoContext } from '@/shared/types/context';
import { CHAT_INPUT_CONFIG } from '../constants/chatInputConfig';
import {
  isImageFile as checkIsImageFile,
  isVideoFile as checkIsVideoFile,
} from '@/infrastructure/language-detection';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('imageUtils');
const IMAGE_TYPES = [...CHAT_INPUT_CONFIG.media.image.acceptedTypes];
const VIDEO_TYPES = [...CHAT_INPUT_CONFIG.media.video.acceptedTypes];
const IMAGE_MAX_BYTES = CHAT_INPUT_CONFIG.media.image.maxFileSizeBytes;
const VIDEO_MAX_BYTES = CHAT_INPUT_CONFIG.media.video.maxFileSizeBytes;

/**
 * Build a human-readable, unique-ish filename for an image that came from the
 * clipboard (which has no real path). We deliberately avoid an incrementing
 * `image-N` counter because that name used to leak into the prompt and made
 * the model believe a file named `image-1.png` actually existed on disk.
 */
function generateClipboardImageName(mimeType: string): string {
  const ext = (mimeType.split('/')[1] || 'png').toLowerCase();
  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
    `-${pad(now.getMilliseconds(), 3)}`;
  return `clipboard-${stamp}.${ext}`;
}

/**
 * Generate image thumbnail
 * @param file Image file
 * @param maxSize Maximum size (default 200px)
 * @returns Base64 encoded thumbnail
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        let width = img.width;
        let height = img.height;
        
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
        
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from file path (Tauri environment)
 * @param filePath File path
 * @returns Base64 encoded thumbnail
 */
export async function generateThumbnailFromPath(
  filePath: string
): Promise<string> {
  // In a Tauri environment, the backend can generate thumbnails.
  // Here we simplify the process and return the file path directly.
  // TODO: Implement backend thumbnail generation
  return `file://${filePath}`;
}

/**
 * Validate image file
 * @param file File object
 * @returns Validation result
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!IMAGE_TYPES.includes(file.type as typeof IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}`
    };
  }
  
  if (file.size >= IMAGE_MAX_BYTES) {
    return {
      valid: false,
      error: `Image too large (${(file.size / 1024 / 1024).toFixed(2)}MB), maximum supported 10MB`
    };
  }
  
  return { valid: true };
}

export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!VIDEO_TYPES.includes(file.type as typeof VIDEO_TYPES[number])) {
    return {
      valid: false,
      error: `Unsupported video format: ${file.type}`
    };
  }

  if (file.size > VIDEO_MAX_BYTES) {
    return {
      valid: false,
      error: `Video too large (${(file.size / 1024 / 1024).toFixed(2)}MB), maximum supported 50MB`
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 * @param file Image file
 * @returns Image width and height
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to get image dimensions'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type from filename
 * @param filename Filename
 * @returns MIME type
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeMap: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  
  return mimeMap[ext || ''] || 'image/jpeg';
}

export function getVideoMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();

  const mimeMap: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
  };

  return mimeMap[ext || ''] || 'video/webm';
}

/**
 * Create ImageContext from file
 * @param file File object
 * @returns ImageContext
 */
export async function createImageContextFromFile(
  file: File
): Promise<ImageContext> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  let dimensions = { width: 0, height: 0 };
  try {
    dimensions = await getImageDimensions(file);
  } catch (error) {
    log.warn('Failed to get image dimensions', { fileName: file.name, error });
  }
  
  let thumbnailUrl: string | undefined;
  try {
    thumbnailUrl = await generateThumbnail(file);
  } catch (error) {
    log.warn('Failed to generate thumbnail', { fileName: file.name, error });
  }
  
  const imageContext: ImageContext = {
    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    imagePath: (file as any).path || '', // Electron/Tauri environments may have a path property.
    imageName: file.name,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    mimeType: file.type,
    source: 'file',
    isLocal: Boolean((file as any).path),
    timestamp: Date.now(),
    thumbnailUrl,
    metadata: {}
  };
  
  // If there is no path (web environment), read as data URL.
  if (!imageContext.imagePath) {
    imageContext.dataUrl = await readFileAsDataUrl(file);
    imageContext.isLocal = false;
  }
  
  return imageContext;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Create ImageContext from clipboard
 * @param file File object from clipboard
 * @returns ImageContext
 */
export async function createImageContextFromClipboard(
  file: File
): Promise<ImageContext> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  let dimensions = { width: 0, height: 0 };
  try {
    dimensions = await getImageDimensions(file);
  } catch (error) {
    log.warn('Failed to get image dimensions', { fileName: file.name, error });
  }
  
  let thumbnailUrl: string | undefined;
  try {
    thumbnailUrl = await generateThumbnail(file);
  } catch (error) {
    log.warn('Failed to generate thumbnail', { fileName: file.name, error });
  }
  
  const dataUrl = await readFileAsDataUrl(file);
  
  const imageContext: ImageContext = {
    id: `img-clipboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    imagePath: '', // Clipboard images do not have a path.
    imageName: (() => {
      const raw = file.name || '';
      const genericPattern = /^image\.\w+$/i;
      if (!raw || genericPattern.test(raw)) {
        return generateClipboardImageName(file.type || 'image/png');
      }
      return raw;
    })(),
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    mimeType: file.type,
    dataUrl,
    source: 'clipboard',
    isLocal: false,
    timestamp: Date.now(),
    thumbnailUrl,
    metadata: {
      fromClipboard: true
    }
  };
  
  return imageContext;
}

/**
 * Check if file is an image
 * Use global language detection service
 * @param filename Filename
 * @returns Whether it is an image
 */
export function isImageFile(filename: string): boolean {
  return checkIsImageFile(filename);
}

export function isVideoFile(filename: string): boolean {
  return checkIsVideoFile(filename);
}

async function getVideoMetadata(file: File): Promise<{
  width: number;
  height: number;
  durationMs: number;
  previewUrl: string | undefined;
  thumbnailUrl: string | undefined;
}> {
  const previewUrl = URL.createObjectURL(file);

  try {
    const metadata = await new Promise<{
      width: number;
      height: number;
      durationMs: number;
      thumbnailUrl?: string;
    }>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.removeAttribute('src');
        video.load();
      };

      video.onloadeddata = () => {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        const durationMs = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;
        let thumbnailUrl: string | undefined;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width || 1);
          canvas.height = Math.max(1, height || 1);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnailUrl = canvas.toDataURL('image/jpeg', 0.72);
          }
        } catch (error) {
          log.warn('Failed to generate video thumbnail', { fileName: file.name, error });
        }

        cleanup();
        resolve({ width, height, durationMs, thumbnailUrl });
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video metadata'));
      };

      video.src = previewUrl;
    });

    return {
      ...metadata,
      previewUrl,
      thumbnailUrl: metadata.thumbnailUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

export async function createVideoContextFromFile(
  file: File
): Promise<VideoContext> {
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let metadata = {
    width: 0,
    height: 0,
    durationMs: 0,
    previewUrl: undefined as string | undefined,
    thumbnailUrl: undefined as string | undefined,
  };

  try {
    metadata = await getVideoMetadata(file);
  } catch (error) {
    log.warn('Failed to get video metadata', { fileName: file.name, error });
  }

  const context: VideoContext = {
    id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'video',
    videoPath: (file as any).path || '',
    videoName: file.name,
    width: metadata.width,
    height: metadata.height,
    durationMs: metadata.durationMs,
    fileSize: file.size,
    mimeType: file.type || getVideoMimeTypeFromFilename(file.name),
    previewUrl: metadata.previewUrl,
    thumbnailUrl: metadata.thumbnailUrl,
    source: 'file',
    isLocal: Boolean((file as any).path),
    timestamp: Date.now(),
    metadata: {},
  };

  if (!context.videoPath) {
    context.dataUrl = await readFileAsDataUrl(file);
    context.isLocal = false;
  }

  return context;
}

/**
 * Format file size
 * @param bytes Bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

