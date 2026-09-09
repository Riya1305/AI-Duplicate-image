/**
 * Visual Feature Embedding Service:
 * Computes a high-dimensional spatial gradient & texture embedding vector (64 dimensions)
 * from normalized multi-scale image regions using Sobel convolution filters and variance pooling.
 * Calculates cosine similarity between visual embeddings for cropping and editing robustness.
 */

export function extractVisualEmbedding(img: CanvasImageSource, size = 64): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Array(64).fill(0);

  ctx.drawImage(img, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Convert to grayscale grid for filter analysis
  const gray = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // 4x4 spatial blocks -> 16 regions.
  // In each region, we extract 4 features:
  // 1. Mean luminance
  // 2. Luminance variance (texture energy)
  // 3. Horizontal gradient magnitude (Sobel Dx)
  // 4. Vertical gradient magnitude (Sobel Dy)
  // Total dimensions: 16 * 4 = 64 features.
  const blockSize = Math.floor(size / 4);
  const embedding: number[] = [];

  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      let sumLum = 0;
      let sumSqLum = 0;
      let sumGx = 0;
      let sumGy = 0;
      let count = 0;

      const startY = by * blockSize;
      const endY = (by + 1) * blockSize;
      const startX = bx * blockSize;
      const endX = (bx + 1) * blockSize;

      for (let y = Math.max(1, startY); y < Math.min(size - 1, endY); y++) {
        for (let x = Math.max(1, startX); x < Math.min(size - 1, endX); x++) {
          const val = gray[y * size + x];
          sumLum += val;
          sumSqLum += val * val;

          // Sobel approximation for local edge gradients
          const gx = (gray[y * size + (x + 1)] - gray[y * size + (x - 1)]);
          const gy = (gray[(y + 1) * size + x] - gray[(y - 1) * size + x]);

          sumGx += Math.abs(gx);
          sumGy += Math.abs(gy);
          count++;
        }
      }

      if (count > 0) {
        const meanLum = sumLum / count;
        const variance = Math.max(0, (sumSqLum / count) - (meanLum * meanLum));
        const stdDev = Math.sqrt(variance);
        const meanGx = sumGx / count;
        const meanGy = sumGy / count;

        embedding.push(meanLum / 255.0);
        embedding.push(stdDev / 128.0);
        embedding.push(meanGx / 128.0);
        embedding.push(meanGy / 128.0);
      } else {
        embedding.push(0, 0, 0, 0);
      }
    }
  }

  // Normalize embedding vector to unit L2 norm
  const norm = Math.sqrt(embedding.reduce((acc, v) => acc + v * v, 0));
  if (norm > 0) {
    return embedding.map(v => v / norm);
  }
  return embedding;
}

/**
 * Computes Cosine Similarity between two L2-normalized feature vectors.
 * Returns percentage (0% to 100%).
 */
export function calculateCosineSimilarity(vecA?: number[], vecB?: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 50;

  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }

  // Clamped to [0, 1] range for normalized non-negative visual representations
  const clamped = Math.max(0, Math.min(1, dot));
  return Math.round(clamped * 1000) / 10;
}
