interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  skipIfUnder?: number; // bytes - skip compression for small files
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  skipIfUnder: 500 * 1024, // 500KB
};

/**
 * Compress and resize an image file using the Canvas API before upload.
 * Returns the original file unchanged if:
 *  - The file is already under skipIfUnder bytes
 *  - The file type is not supported by canvas (e.g. HEIC without browser support)
 *  - Compression fails for any reason (graceful fallback)
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (file.size <= opts.skipIfUnder) {
    return file;
  }

  // Only compress types the canvas can handle
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = calculateDimensions(
      bitmap.width,
      bitmap.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // If already within dimensions and it's a JPEG under reasonable size, skip
    if (width === bitmap.width && height === bitmap.height && file.type === 'image/jpeg') {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', opts.quality);
    });

    if (!blob || blob.size >= file.size) {
      // Compression made it bigger or failed - use original
      return file;
    }

    return new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    // Any failure (e.g. corrupt image, unsupported format) - return original
    return file;
  }
}

function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}
