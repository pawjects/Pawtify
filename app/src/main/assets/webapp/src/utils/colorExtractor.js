/**
 * Lightweight Canvas API Color Extraction for Pawtify
 * Extracts the dominant vibrant color from album artwork to generate
 * a dynamic glowing drop-shadow strictly behind the thumbnail.
 */

const colorCache = new Map();
const DEFAULT_COLOR = { r: 29, g: 185, b: 84 }; // Monet Green fallback

export function extractDominantColor(imageUrl, callback) {
  if (!imageUrl) {
    callback(DEFAULT_COLOR);
    return;
  }

  if (colorCache.has(imageUrl)) {
    callback(colorCache.get(imageUrl));
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        callback(DEFAULT_COLOR);
        return;
      }

      // Small sample size (32x32) for instant, non-blocking execution
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      let bestColor = null;
      let maxScore = -1;
      let totalR = 0, totalG = 0, totalB = 0, count = 0;

      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;

        // Calculate saturation & lightness to prioritize vibrant musical tones
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 510;
        const d = max - min;
        const s = max === 0 ? 0 : d / max;

        // Skip near-black and washed out whites
        if (l < 0.12 || l > 0.92) continue;

        totalR += r;
        totalG += g;
        totalB += b;
        count++;

        // Vibrant color score based on saturation and moderate lightness
        const score = s * 1.5 + (1 - Math.abs(l - 0.5));
        if (score > maxScore) {
          maxScore = score;
          bestColor = { r, g, b };
        }
      }

      let result = bestColor;
      if (!result && count > 0) {
        result = {
          r: Math.round(totalR / count),
          g: Math.round(totalG / count),
          b: Math.round(totalB / count),
        };
      }

      const finalColor = result || DEFAULT_COLOR;
      colorCache.set(imageUrl, finalColor);
      callback(finalColor);
    } catch (e) {
      // Handle tainted canvas / CORS gracefully
      colorCache.set(imageUrl, DEFAULT_COLOR);
      callback(DEFAULT_COLOR);
    }
  };

  img.onerror = () => {
    callback(DEFAULT_COLOR);
  };

  img.src = imageUrl;
}
