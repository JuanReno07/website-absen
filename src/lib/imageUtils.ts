/**
 * Utility to compress image files or Data URLs using Canvas on the client side.
 * Reduces 10MB+ high resolution files to ~30-80KB, preventing HTTP payload errors
 * and ensuring fast page load & localStorage caching for logos and screenshots.
 */
export function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    const processSrc = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const isPng = src.startsWith('data:image/png') || src.endsWith('.png');
        const mimeType = isPng ? 'image/png' : 'image/webp';

        try {
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch (e) {
          resolve(src);
        }
      };

      img.onerror = () => resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : src);
      img.src = src;
    };

    if (typeof dataUrlOrFile === 'string') {
      processSrc(dataUrlOrFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        processSrc(e.target?.result as string);
      };
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}
