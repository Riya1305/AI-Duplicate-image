import { ImageMetadata } from '../types/image';
import { DuplicateCluster, DuplicateMatch } from '../types/cluster';

class DisjointSet {
  private parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p !== item) {
      const root = this.find(p);
      this.parent.set(item, root);
      return root;
    }
    return item;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

/**
 * Evaluates images in a cluster and picks the single best image to keep.
 * Prioritizes:
 * 1. Resolution (pixel area width * height)
 * 2. Uncompressed or modern format (PNG, WebP over lossy JPG)
 * 3. File size (richer pixel detail)
 * 4. Original filename indicators (avoid "(1)", "copy", "thumbnail", "compressed")
 */
function evaluateBestImageToKeep(images: ImageMetadata[]): { bestId: string; reason: string } {
  if (images.length === 0) return { bestId: '', reason: '' };
  if (images.length === 1) return { bestId: images[0].id, reason: 'Only image in group' };

  let best = images[0];
  let bestScore = -1;
  let bestReason = '';

  for (const img of images) {
    let score = 0;
    const reasons: string[] = [];

    // Resolution score (major weight: 0 - 50 points)
    const pixels = img.width * img.height;
    const maxPixelReference = 3840 * 2160; // 4K reference
    const resolutionScore = Math.min(50, (pixels / maxPixelReference) * 50);
    score += resolutionScore;

    // File size quality density (up to 25 points)
    const sizeScore = Math.min(25, (img.size / (10 * 1024 * 1024)) * 25);
    score += sizeScore;

    // Format bonus (up to 15 points)
    const format = (img.type || img.name.split('.').pop() || '').toLowerCase();
    if (format.includes('png') || format.includes('webp')) {
      score += 15;
    } else if (format.includes('jpeg') || format.includes('jpg')) {
      score += 10;
    }

    // Clean name bonus (penalize obvious copy names)
    const nameLower = img.name.toLowerCase();
    if (nameLower.includes('copy') || nameLower.includes('compressed') || nameLower.includes('thumb') || /\(\d+\)/.test(nameLower)) {
      score -= 15;
    } else {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      best = img;

      // Construct explanatory rationale
      const isHighRes = img.width >= 1920 || img.height >= 1080;
      if (isHighRes) {
        reasons.push(`Highest resolution (${img.width}×${img.height})`);
      } else {
        reasons.push(`Best dimensions (${img.width}×${img.height})`);
      }
      if (img.size > 500 * 1024) {
        reasons.push('highest visual detail preservation');
      }
      bestReason = reasons.join(' and ');
    }
  }

  return {
    bestId: best.id,
    reason: bestReason || 'Optimal resolution and quality profile.',
  };
}

/**
 * Builds connected duplicate clusters from pairwise matches above similarity thresholds.
 */
export function buildDuplicateClusters(
  images: ImageMetadata[],
  matches: DuplicateMatch[]
): DuplicateCluster[] {
  const uf = new DisjointSet();
  const imageMap = new Map<string, ImageMetadata>();
  images.forEach(img => imageMap.set(img.id, img));

  // Connect items with valid duplicate matches
  const matchLookup = new Map<string, DuplicateMatch>();

  for (const match of matches) {
    if (match.classification !== 'unique') {
      uf.union(match.imageAId, match.imageBId);
      matchLookup.set(`${match.imageAId}_${match.imageBId}`, match);
      matchLookup.set(`${match.imageBId}_${match.imageAId}`, match);
    }
  }

  // Group images by disjoint set root
  const clustersByRoot = new Map<string, string[]>();
  for (const img of images) {
    const root = uf.find(img.id);
    if (!clustersByRoot.has(root)) {
      clustersByRoot.set(root, []);
    }
    clustersByRoot.get(root)!.push(img.id);
  }

  const resultClusters: DuplicateCluster[] = [];
  let clusterCounter = 1;

  for (const [, memberIds] of clustersByRoot.entries()) {
    // Only clusters with 2 or more images are duplicate groups
    if (memberIds.length < 2) continue;

    const clusterImages = memberIds
      .map(id => imageMap.get(id))
      .filter((img): img is ImageMetadata => img !== undefined);

    if (clusterImages.length < 2) continue;

    // Calculate cluster similarity statistics
    let simSum = 0;
    let simCount = 0;
    let highestSim = 0;
    let lowestSim = 100;
    let hasExact = false;
    let hasNear = false;

    for (let i = 0; i < clusterImages.length; i++) {
      for (let j = i + 1; j < clusterImages.length; j++) {
        const key = `${clusterImages[i].id}_${clusterImages[j].id}`;
        const match = matchLookup.get(key);
        if (match) {
          simSum += match.similarity;
          simCount++;
          highestSim = Math.max(highestSim, match.similarity);
          lowestSim = Math.min(lowestSim, match.similarity);

          if (match.classification === 'exact') hasExact = true;
          if (match.classification === 'near') hasNear = true;
        }
      }
    }

    const avgSim = simCount > 0 ? Math.round((simSum / simCount) * 10) / 10 : 90;
    if (highestSim === 0) highestSim = avgSim;
    if (lowestSim === 100) lowestSim = avgSim;

    // Duplicate classification for cluster
    let duplicateType: DuplicateCluster['duplicateType'] = 'similar';
    if (hasExact && !hasNear && avgSim >= 99.5) {
      duplicateType = 'exact';
    } else if (hasNear || avgSim >= 85) {
      duplicateType = 'near';
    }

    // Storage calculation
    const totalSize = clusterImages.reduce((acc, img) => acc + img.size, 0);

    // Smart keep recommendation
    const { bestId, reason } = evaluateBestImageToKeep(clusterImages);
    const bestImage = clusterImages.find(img => img.id === bestId) || clusterImages[0];
    const recoverableSize = Math.max(0, totalSize - bestImage.size);

    // Default cleanup selection: all other copies
    const defaultCleanup = clusterImages.filter(img => img.id !== bestId).map(img => img.id);

    resultClusters.push({
      id: `cluster-${clusterCounter}`,
      clusterNumber: clusterCounter,
      images: clusterImages,
      duplicateType,
      averageSimilarity: avgSim,
      highestSimilarity: highestSim,
      lowestSimilarity: lowestSim,
      totalSize,
      recoverableSize,
      recommendedKeepId: bestId,
      recommendedKeepReason: reason,
      selectedForCleanup: defaultCleanup,
    });

    clusterCounter++;
  }

  // Sort clusters by potential recoverable size descending (biggest space wasters first)
  return resultClusters.sort((a, b) => b.recoverableSize - a.recoverableSize);
}
