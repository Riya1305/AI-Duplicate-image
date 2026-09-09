import { DuplicateCluster } from './cluster';

export interface StorageReport {
  totalImages: number;
  duplicateImages: number;
  uniqueImages: number;
  duplicateGroups: number;
  exactDuplicateGroups: number;
  nearDuplicateGroups: number;
  similarGroups: number;
  
  totalStorageBytes: number;
  duplicateStorageBytes: number;
  recoverableStorageBytes: number;
  savingsPercentage: number;
  
  averageSimilarity: number;
  processingTimeSeconds: number;
  scanDate: string;
  
  clusters: DuplicateCluster[];
  formatBreakdown: Record<string, { count: number; bytes: number }>;
}

export interface ScanHistoryItem {
  id: number;
  scanDate: string;
  completedAt?: string;
  status: 'completed' | 'failed' | 'cancelled' | 'processing';
  totalImages: number;
  duplicateGroups: number;
  duplicateImages: number;
  uniqueImages: number;
  exactDuplicates: number;
  nearDuplicates: number;
  durationMs: number;
  totalStorageBytes: number;
  duplicateStorageBytes: number;
  recoverableStorageBytes: number;
  detectionMethod: 'pHash' | 'dHash' | 'aHash' | 'cosine_embedding' | 'hybrid';
  similarityThreshold: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
