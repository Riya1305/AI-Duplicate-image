/**
 * Color profiling service:
 * Computes normalized 64-bin RGB color histograms and color moments (mean and standard deviation).
 * Helps differentiate images with identical shape but vastly different color palettes.
 */

export function computeColorHistogram(img: CanvasImageSource, sampleSize = 64): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Array(64).fill(0);

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imgData.data;

  // 4x4x4 = 64 color bins (4 bins per channel: [0-63], [64-127], [128-191], [192-255])
  const histogram = new Array(64).fill(0);
  const totalPixels = sampleSize * sampleSize;

  for (let i = 0; i < data.length; i += 4) {
    const rBin = Math.min(3, Math.floor(data[i] / 64));
    const gBin = Math.min(3, Math.floor(data[i + 1] / 64));
    const bBin = Math.min(3, Math.floor(data[i + 2] / 64));

    const binIndex = rBin * 16 + gBin * 4 + bBin;
    histogram[binIndex]++;
  }

  // Normalize histogram to unit sum
  return histogram.map(val => val / totalPixels);
}

/**
 * Calculates color similarity between two normalized histograms using histogram intersection.
 * Returns percentage (0% to 100%).
 */
export function calculateColorSimilarity(histA?: number[], histB?: number[]): number {
  if (!histA || !histB || histA.length !== histB.length) return 50;

  let intersection = 0;
  for (let i = 0; i < histA.length; i++) {
    intersection += Math.min(histA[i], histB[i]);
  }

  // Intersection of unit-sum normalized histograms is in [0, 1]
  return Math.round(Math.min(1, Math.max(0, intersection)) * 1000) / 10;
}
