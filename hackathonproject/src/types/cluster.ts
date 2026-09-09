import { DuplicateClassification, ImageMetadata } from './image';

export interface DuplicateMatch {
  imageAId: string;
  imageBId: string;
  similarity: number; // 0 to 100
  classification: DuplicateClassification;
  exactMatch: boolean;
  pHashDistance: number;
  dHashDistance: number;
  aHashDistance: number;
  colorSimilarity: number;
  embeddingSimilarity?: number;
}

export interface DuplicateCluster {
  id: string;
  clusterNumber: number;
  images: ImageMetadata[];
  duplicateType: DuplicateClassification;
  averageSimilarity: number; // 0 to 100
  highestSimilarity: number; // 0 to 100
  lowestSimilarity: number;
  totalSize: number; // sum of all images in bytes
  recoverableSize: number; // total size minus recommended keep image size
  recommendedKeepId: string;
  recommendedKeepReason: string;
  selectedForCleanup: string[]; // image IDs selected for cleanup
}

export interface ClusterFilterOptions {
  searchQuery: string;
  duplicateType: 'all' | 'exact' | 'near' | 'similar';
  minSimilarity: number;
  sortBy: 'similarity' | 'size' | 'savings' | 'count' | 'name';
  sortOrder: 'asc' | 'desc';
}
