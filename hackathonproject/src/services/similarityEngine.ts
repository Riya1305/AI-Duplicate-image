import { ImageMetadata } from '../types/image';
import { DuplicateMatch } from '../types/cluster';
import { ScanConfig } from '../types/analysis';
import { calculateHammingDistance, hammingToSimilarity } from './perceptualHash';
import { calculateColorSimilarity } from './colorProfiler';
import { calculateCosineSimilarity } from './embeddingService';

/**
 * Computes pairwise similarity between two analyzed images using exact hashes,
 * perceptual hashes (pHash, dHash, aHash), color distributions, and visual embeddings.
 */
export function computePairwiseSimilarity(
  imgA: ImageMetadata,
  imgB: ImageMetadata,
  config: ScanConfig
): DuplicateMatch {
  // Check exact duplicate first via SHA-256
  const isExactHashMatch = 
    Boolean(config.exactSha256Enabled && imgA.sha256 && imgB.sha256 && imgA.sha256 === imgB.sha256);

  if (isExactHashMatch) {
    return {
      imageAId: imgA.id,
      imageBId: imgB.id,
      similarity: 100.0,
      classification: 'exact',
      exactMatch: true,
      pHashDistance: 0,
      dHashDistance: 0,
      aHashDistance: 0,
      colorSimilarity: 100.0,
      embeddingSimilarity: 100.0,
    };
  }

  // Calculate perceptual hash distances
  const pHashDist = imgA.pHash && imgB.pHash 
    ? calculateHammingDistance(imgA.pHash, imgB.pHash) 
    : 64;
  const dHashDist = imgA.dHash && imgB.dHash 
    ? calculateHammingDistance(imgA.dHash, imgB.dHash) 
    : 64;
  const aHashDist = imgA.aHash && imgB.aHash 
    ? calculateHammingDistance(imgA.aHash, imgB.aHash) 
    : 64;

  const pHashSim = hammingToSimilarity(pHashDist);
  const dHashSim = hammingToSimilarity(dHashDist);
  const aHashSim = hammingToSimilarity(aHashDist);

  // Color similarity
  const colorSim = calculateColorSimilarity(imgA.colorHistogram, imgB.colorHistogram);

  // Embedding cosine similarity
  const embSim = calculateCosineSimilarity(imgA.embedding, imgB.embedding);

  // Aspect ratio similarity
  const maxAspect = Math.max(imgA.aspectRatio, imgB.aspectRatio) || 1;
  const aspectDiff = Math.abs(imgA.aspectRatio - imgB.aspectRatio);
  const aspectSim = Math.max(0, (1 - aspectDiff / maxAspect) * 100);

  // Weighted combination
  // Normalizing weights
  const totalWeight =
    config.pHashWeight +
    config.dHashWeight +
    config.aHashWeight +
    config.colorWeight +
    config.aspectRatioWeight +
    (config.cnnEmbeddingsEnabled ? 0.35 : 0);

  const weightedScore =
    (pHashSim * config.pHashWeight +
      dHashSim * config.dHashWeight +
      aHashSim * config.aHashWeight +
      colorSim * config.colorWeight +
      aspectSim * config.aspectRatioWeight +
      (config.cnnEmbeddingsEnabled ? embSim * 0.35 : 0)) /
    totalWeight;

  const finalSimilarity = Math.min(99.9, Math.max(0, Math.round(weightedScore * 10) / 10));

  // Determine classification
  let classification: DuplicateMatch['classification'] = 'unique';
  if (pHashDist <= config.pHashMaxDistance && finalSimilarity >= config.nearDuplicateThreshold) {
    classification = 'near';
  } else if (finalSimilarity >= config.nearDuplicateThreshold) {
    classification = 'near';
  } else if (finalSimilarity >= config.similarThreshold) {
    classification = 'similar';
  }

  return {
    imageAId: imgA.id,
    imageBId: imgB.id,
    similarity: finalSimilarity,
    classification,
    exactMatch: false,
    pHashDistance: pHashDist,
    dHashDistance: dHashDist,
    aHashDistance: aHashDist,
    colorSimilarity: colorSim,
    embeddingSimilarity: embSim,
  };
}
