/**
 * Utility to compress image files or Data URLs using HTML5 Canvas on the client side.
 * Converts heavy raw screenshots (1-5MB) into crisp, optimized WebP (~30-60KB).
 * Preserves text clarity for FiveM/Discord text logs while saving ~95% database storage.
 */
export function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 1440,
  maxHeight = 1440,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve) => {
    const processSrc = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional scale down if exceeds max dimensions
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

        try {
          // Export to WebP for 95% space saving
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
          // Safe fallback to JPEG
          const jpegData = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegData);
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
