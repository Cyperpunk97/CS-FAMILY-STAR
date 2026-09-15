import { ALLOWED_IMAGE_TYPES, LIMITS } from './types';

/**
 * Client-side image downscaling.
 *
 * Review photos were uploaded exactly as the camera produced them — a modern phone
 * shoots 12 MP JPEGs of 4–8 MB. On campus Wi-Fi that is a slow upload, it burns
 * Supabase storage, and it now exceeds the 5 MB bucket limit outright. Resizing to
 * 1600 px and re-encoding as WebP typically lands under 300 KB with no visible loss
 * at the size these photos are displayed.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  extension: string;
  /** Bytes saved, for the "compressed from X" hint in the UI. */
  originalBytes: number;
}

export function isAllowedImage(file: File): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap handles EXIF orientation and is much faster where supported.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

/**
 * Returns a downscaled WebP copy, or the original file when shrinking it would not
 * help (already small) or the browser cannot encode WebP.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const original = { blob: file as Blob, extension: 'jpg', originalBytes: file.size };

  if (!isAllowedImage(file)) {
    throw new Error('Please choose a JPEG, PNG, WebP or GIF image.');
  }
  // Animated GIFs would lose their animation on a canvas round-trip.
  if (file.type === 'image/gif') {
    if (file.size > LIMITS.imageBytesMax) {
      throw new Error('That GIF is larger than 5 MB. Please pick a smaller one.');
    }
    return { ...original, extension: 'gif' };
  }

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await loadBitmap(file);
  } catch {
    throw new Error('Could not read that image. Try a different photo.');
  }

  const width = 'width' in source ? source.width : 0;
  const height = 'height' in source ? source.height : 0;
  if (!width || !height) throw new Error('Could not read that image.');

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return original;

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if ('close' in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY)
  );

  // Keep the original if encoding failed or somehow made the file bigger.
  if (!blob || blob.size >= file.size) {
    if (file.size > LIMITS.imageBytesMax) {
      throw new Error('That image is larger than 5 MB. Please pick a smaller one.');
    }
    return original;
  }

  if (blob.size > LIMITS.imageBytesMax) {
    throw new Error('That image is too large even after compression.');
  }

  return { blob, extension: 'webp', originalBytes: file.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
