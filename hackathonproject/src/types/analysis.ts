export type PipelineStage = 
  | 'idle'
  | 'extracting'
  | 'thumbnails'
  | 'exact_hashes'
  | 'perceptual_hashes'
  | 'visual_embeddings'
  | 'comparing'
  | 'clustering'
  | 'savings'
  | 'complete'
  | 'error';

export interface StageStatus {
  stage: PipelineStage;
  label: string;
  completed: boolean;
  active: boolean;
  progress: number; // 0 to 100
}

export interface AnalysisProgress {
  stage: PipelineStage;
  currentStageIndex: number;
  totalStages: number;
  overallProgress: number; // 0 to 100
  itemsProcessed: number;
  totalItems: number;
  processingSpeed: number; // items/sec
  estimatedRemainingSeconds: number;
  currentOperation: string;
  stages: StageStatus[];
}

export interface ScanConfig {
  nearDuplicateThreshold: number; // e.g. 88%
  similarThreshold: number; // e.g. 70%
  pHashMaxDistance: number; // e.g. 8
  exactSha256Enabled: boolean;
  croppingDetectionEnabled: boolean;
  cnnEmbeddingsEnabled: boolean;
  colorWeight: number; // default 0.15
  pHashWeight: number; // default 0.45
  dHashWeight: number; // default 0.25
  aHashWeight: number; // default 0.10
  aspectRatioWeight: number; // default 0.05
  maxAnalysisDimension: number; // default 512px
  batchSize: number; // default 8
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  nearDuplicateThreshold: 88,
  similarThreshold: 70,
  pHashMaxDistance: 8,
  exactSha256Enabled: true,
  croppingDetectionEnabled: true,
  cnnEmbeddingsEnabled: true,
  colorWeight: 0.15,
  pHashWeight: 0.45,
  dHashWeight: 0.25,
  aHashWeight: 0.10,
  aspectRatioWeight: 0.05,
  maxAnalysisDimension: 512,
  batchSize: 8,
};
