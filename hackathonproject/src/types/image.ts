export type DuplicateClassification = 'exact' | 'near' | 'similar' | 'unique';

export interface ImageMetadata {
  id: string;
  name: string;
  size: number; // in bytes
  type: string;
  width: number;
  height: number;
  aspectRatio: number;
  dataUrl?: string; // preview thumbnail url
  file?: File; // original file object
  fileHandle?: FileSystemFileHandle; // permission-aware handle when supported
  relativePath?: string;
  
  // Hashes & Signatures
  sha256?: string;
  pHash?: string; // 64-bit binary string
  dHash?: string; // 64-bit binary string
  aHash?: string; // 64-bit binary string
  
  // Color & Feature Vector
  colorHistogram?: number[]; // normalized 64-bin RGB color vector
  colorMoments?: {
    mean: [number, number, number];
    stdDev: [number, number, number];
  };
  embedding?: number[]; // high-dimensional visual feature embedding
  
  // Processing status
  status: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface FileValidationError {
  file: File | { name: string; size: number; type: string };
  reason: string;
}
