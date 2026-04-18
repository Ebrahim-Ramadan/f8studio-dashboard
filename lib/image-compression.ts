/**
 * Compress an image file using Canvas. Reduces file size by 60-80% typically.
 * @param file Image file to compress
 * @param maxWidth Max width in pixels (default 1920)
 * @param maxHeight Max height in pixels (default 1920)
 * @param quality JPEG quality 0-1 (default 0.7, higher = better quality but larger)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.7
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const img = new Image();

        img.onload = async () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Failed to get 2D context from canvas");
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP output when possible for better compression of photographic images.
          const preferType = (() => {
            try {
              // If browser supports webp, prefer it for smaller output when original isn't already webp
              const supportsWebp = HTMLCanvasElement.prototype.toBlob && typeof Blob !== "undefined";
              if (supportsWebp && file.type !== "image/webp") return "image/webp";
            } catch {}
            return file.type || "image/jpeg";
          })();

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              // If compression made the file larger, return the original file to avoid regressions.
              if (blob.size >= file.size) {
                resolve(file);
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: preferType,
                lastModified: Date.now()
              });

              resolve(compressedFile);
            },
            preferType,
            quality
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = event.target?.result as string;
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
