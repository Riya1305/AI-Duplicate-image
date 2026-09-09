/**
 * Perceptual Hashing Service:
 * Implements pHash (DCT-based), dHash (difference gradient), and aHash (average brightness),
 * along with Hamming distance metrics.
 */

// Helper: load an ImageBitmap or HTMLImageElement safely
export async function loadImageElement(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for hashing: ' + err));
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

// Convert image to grayscale ImageData of specified width and height
export function renderToGrayscaleCanvas(
  img: CanvasImageSource,
  targetWidth: number,
  targetHeight: number
): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Smooth resizing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const gray = new Uint8ClampedArray(targetWidth * targetHeight);

  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Standard ITU-R BT.601 luma formula
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return gray;
}

/**
 * aHash: Average Hash (8x8 -> 64 bits)
 * Resizes to 8x8, computes mean intensity, sets bit 1 if pixel >= mean.
 */
export function computeAHash(img: CanvasImageSource): string {
  const gray = renderToGrayscaleCanvas(img, 8, 8);
  let sum = 0;
  for (let i = 0; i < 64; i++) {
    sum += gray[i];
  }
  const mean = sum / 64;

  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += gray[i] >= mean ? '1' : '0';
  }
  return hash;
}

/**
 * dHash: Difference Hash (9x8 -> 64 bits)
 * Resizes to 9x8, compares adjacent horizontal pixels. Bit is 1 if left > right.
 */
export function computeDHash(img: CanvasImageSource): string {
  const gray = renderToGrayscaleCanvas(img, 9, 8);
  let hash = '';

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = gray[y * 9 + x];
      const right = gray[y * 9 + x + 1];
      hash += left > right ? '1' : '0';
    }
  }
  return hash;
}

/**
 * pHash: Perceptual Hash using Discrete Cosine Transform (DCT)
 * 1. Resizes image to 32x32 grayscale
 * 2. Computes 2D DCT for top-left 8x8 low-frequency coefficients
 * 3. Finds median of coefficients (excluding DC component at [0,0])
 * 4. Produces 64-bit binary hash
 */
export function computePHash(img: CanvasImageSource): string {
  const N = 32;
  const gray = renderToGrayscaleCanvas(img, N, N);

  // Precompute cosine table for 32x32
  const cosTable: number[][] = [];
  for (let u = 0; u < 8; u++) {
    cosTable[u] = [];
    for (let x = 0; x < N; x++) {
      cosTable[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
    }
  }

  // 1D DCT along columns first for efficiency, or direct 2D calculation for top-left 8x8
  const dct: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        const cosX = cosTable[u][x];
        for (let y = 0; y < N; y++) {
          sum += gray[y * N + x] * cosX * cosTable[v][y];
        }
      }

      const alphaU = u === 0 ? 1 / Math.sqrt(2) : 1;
      const alphaV = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct.push(sum * (2 / N) * alphaU * alphaV);
    }
  }

  // Exclude DC component (dct[0]) to calculate median of AC components
  const acValues = dct.slice(1);
  const sorted = [...acValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += dct[i] > median ? '1' : '0';
  }

  return hash;
}

/**
 * Computes Hamming distance between two binary hash strings.
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) {
    return 64;
  }
  let dist = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) {
      dist++;
    }
  }
  return dist;
}

/**
 * Converts Hamming distance (0 to 64) to similarity percentage (0% to 100%).
 */
export function hammingToSimilarity(distance: number, maxBits = 64): number {
  const bounded = Math.max(0, Math.min(maxBits, distance));
  return Math.round((1 - bounded / maxBits) * 1000) / 10;
}
