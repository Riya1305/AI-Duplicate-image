import { useState, useRef, useCallback } from 'react';
import { ImageMetadata, FileValidationError } from '../types/image';
import { DuplicateCluster, DuplicateMatch } from '../types/cluster';
import { AnalysisProgress, ScanConfig, DEFAULT_SCAN_CONFIG, PipelineStage } from '../types/analysis';
import { StorageReport } from '../types/report';
import { computeSHA256 } from '../services/cryptoHash';
import { computePHash, computeDHash, computeAHash, loadImageElement } from '../services/perceptualHash';
import { computeColorHistogram } from '../services/colorProfiler';
import { extractVisualEmbedding } from '../services/embeddingService';
import { computePairwiseSimilarity } from '../services/similarityEngine';
import { buildDuplicateClusters } from '../services/clusteringEngine';
import { generateStorageReport } from '../services/storageCalculator';
import { createScanHistory, saveScanResults, updateScanHistory } from '../services/historyStorage';

const INITIAL_STAGES: AnalysisProgress['stages'] = [
  { stage: 'extracting', label: 'Extracting & validating images', completed: false, active: false, progress: 0 },
  { stage: 'thumbnails', label: 'Generating normalized thumbnails', completed: false, active: false, progress: 0 },
  { stage: 'exact_hashes', label: 'Computing SHA-256 exact cryptographic hashes', completed: false, active: false, progress: 0 },
  { stage: 'perceptual_hashes', label: 'Computing perceptual signatures (pHash, dHash, aHash)', completed: false, active: false, progress: 0 },
  { stage: 'visual_embeddings', label: 'Extracting CNN visual feature embeddings', completed: false, active: false, progress: 0 },
  { stage: 'comparing', label: 'Comparing visual signatures & cross-matching', completed: false, active: false, progress: 0 },
  { stage: 'clustering', label: 'Building duplicate clusters & keep advisor', completed: false, active: false, progress: 0 },
  { stage: 'savings', label: 'Calculating storage savings & analytics', completed: false, active: false, progress: 0 },
];

export function useImageAnalysis() {
  const [config, setConfig] = useState<ScanConfig>(DEFAULT_SCAN_CONFIG);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'idle',
    currentStageIndex: 0,
    totalStages: INITIAL_STAGES.length,
    overallProgress: 0,
    itemsProcessed: 0,
    totalItems: 0,
    processingSpeed: 0,
    estimatedRemainingSeconds: 0,
    currentOperation: 'Ready to scan',
    stages: INITIAL_STAGES,
  });

  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [report, setReport] = useState<StorageReport | null>(null);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const abortControllerRef = useRef<boolean>(false);

  // Helper to update individual stage progress
  const updateStageState = (
    stageName: PipelineStage,
    active: boolean,
    completed: boolean,
    stageProgress: number,
    operation: string,
    overallPct: number,
    processed = 0,
    total = 0,
    speed = 0,
    eta = 0
  ) => {
    setProgress((prev) => {
      const idx = prev.stages.findIndex((s) => s.stage === stageName);
      const updatedStages = prev.stages.map((s, i) => {
        if (s.stage === stageName) {
          return { ...s, active, completed, progress: stageProgress };
        }
        if (i < idx) {
          return { ...s, active: false, completed: true, progress: 100 };
        }
        return s;
      });

      return {
        stage: stageName,
        currentStageIndex: Math.max(0, idx),
        totalStages: prev.stages.length,
        overallProgress: Math.min(100, Math.max(prev.overallProgress, Math.round(overallPct))),
        itemsProcessed: processed,
        totalItems: total,
        processingSpeed: speed,
        estimatedRemainingSeconds: eta,
        currentOperation: operation,
        stages: updatedStages,
      };
    });
  };

  const cancelScan = useCallback(() => {
    abortControllerRef.current = true;
    setIsScanning(false);
    setStage('idle');
    setProgress((p) => ({ ...p, currentOperation: 'Scan cancelled by user' }));
  }, []);

  const resetScan = useCallback(() => {
    abortControllerRef.current = false;
    setStage('idle');
    setIsScanning(false);
    setImages([]);
    setClusters([]);
    setReport(null);
    setValidationErrors([]);
    setProgress({
      stage: 'idle',
      currentStageIndex: 0,
      totalStages: INITIAL_STAGES.length,
      overallProgress: 0,
      itemsProcessed: 0,
      totalItems: 0,
      processingSpeed: 0,
      estimatedRemainingSeconds: 0,
      currentOperation: 'Ready to scan',
      stages: INITIAL_STAGES.map((s) => ({ ...s, active: false, completed: false, progress: 0 })),
    });
  }, []);

  const startScan = useCallback(
    async (fileList: File[], fileHandles = new Map<string, FileSystemFileHandle>()) => {
      if (fileList.length === 0) return;
      abortControllerRef.current = false;
      setIsScanning(true);
      setValidationErrors([]);
      const startTime = performance.now();
      let scanId: number | undefined;

      try {
        scanId = await createScanHistory({
          detectionMethod: 'hybrid',
          similarityThreshold: config.nearDuplicateThreshold / 100,
        });
        const finishCancelled = async () => {
          if (scanId !== undefined) {
            await updateScanHistory(scanId, {
              status: 'cancelled',
              durationMs: performance.now() - startTime,
            });
          }
        };

        // Stage 1: Validation & Extraction
        setStage('extracting');
        updateStageState('extracting', true, false, 20, 'Validating file formats and readability...', 5, 0, fileList.length);

        const validImages: ImageMetadata[] = [];
        const errors: FileValidationError[] = [];
        const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const ext = (file.name.split('.').pop() || '').toLowerCase();
          const isImageMime = file.type.startsWith('image/');
          const isKnownExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);

          if (!isImageMime && !isKnownExt) {
            errors.push({ file, reason: `Unsupported file format (.${ext || 'unknown'})` });
            continue;
          }

          if (file.size === 0) {
            errors.push({ file, reason: 'Empty file (0 bytes)' });
            continue;
          }

          validImages.push({
            id: `img-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: file.size,
            type: file.type || `image/${ext}`,
            width: 0,
            height: 0,
            aspectRatio: 1,
            file,
            fileHandle: fileHandles.get(`${file.name}-${file.size}-${file.lastModified}`),
            status: 'pending',
          });
        }

        setValidationErrors(errors);

        if (validImages.length === 0) {
          throw new Error('No valid readable image files found in the provided selection.');
        }

        const total = validImages.length;
        updateStageState('extracting', false, true, 100, `Validated ${total} images successfully`, 12, total, total);

        // Stage 2: Normalization & Thumbnails
        setStage('thumbnails');
        updateStageState('thumbnails', true, false, 0, 'Generating normalized thumbnails and reading dimensions...', 15, 0, total);

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) {
            await finishCancelled();
            return;
          }
          const item = validImages[i];
          try {
            const imgEl = await loadImageElement(item.file!);
            item.width = imgEl.naturalWidth || imgEl.width;
            item.height = imgEl.naturalHeight || imgEl.height;
            item.aspectRatio = Math.round(((item.width || 1) / (item.height || 1)) * 100) / 100;

            // Generate small thumbnail for smooth UI preview
            const thumbCanvas = document.createElement('canvas');
            const maxDim = 160;
            let tw = item.width;
            let th = item.height;
            if (tw > th) {
              if (tw > maxDim) {
                th = Math.round((th * maxDim) / tw);
                tw = maxDim;
              }
            } else {
              if (th > maxDim) {
                tw = Math.round((tw * maxDim) / th);
                th = maxDim;
              }
            }
            thumbCanvas.width = Math.max(1, tw);
            thumbCanvas.height = Math.max(1, th);
            const tCtx = thumbCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(imgEl, 0, 0, thumbCanvas.width, thumbCanvas.height);
              item.dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {
            item.status = 'error';
            item.errorMessage = 'Failed to decode image data';
          }

          const pct = Math.round(((i + 1) / total) * 100);
          const elapsed = (performance.now() - startTime) / 1000;
          const speed = Math.round(((i + 1) / (elapsed || 0.1)) * 10) / 10;
          const eta = Math.max(1, Math.round((total - (i + 1)) / (speed || 1)));

          if (i % 2 === 0 || i === total - 1) {
            updateStageState(
              'thumbnails',
              true,
              false,
              pct,
              `Generated preview ${i + 1} of ${total}`,
              12 + pct * 0.12,
              i + 1,
              total,
              speed,
              eta
            );
          }
        }
        updateStageState('thumbnails', false, true, 100, `Decoded ${total} images`, 24, total, total);

        // Stage 3: Exact Cryptographic Hashing (SHA-256)
        setStage('exact_hashes');
        updateStageState('exact_hashes', true, false, 0, 'Computing SHA-256 file fingerprints...', 25, 0, total);

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) {
            await finishCancelled();
            return;
          }
          const item = validImages[i];
          if (item.file) {
            item.sha256 = await computeSHA256(item.file);
          }
          const pct = Math.round(((i + 1) / total) * 100);
          if (i % 3 === 0 || i === total - 1) {
            updateStageState('exact_hashes', true, false, pct, `Hashed ${i + 1} of ${total} files`, 24 + pct * 0.12, i + 1, total);
          }
        }
        updateStageState('exact_hashes', false, true, 100, `Calculated SHA-256 for all ${total} files`, 36, total, total);

        // Stage 4: Perceptual Hashing (pHash, dHash, aHash, Color)
        setStage('perceptual_hashes');
        updateStageState('perceptual_hashes', true, false, 0, 'Computing pHash (DCT), dHash, and aHash...', 37, 0, total);

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) {
            await finishCancelled();
            return;
          }
          const item = validImages[i];
          try {
            const imgEl = await loadImageElement(item.file || item.dataUrl || '');
            item.pHash = computePHash(imgEl);
            item.dHash = computeDHash(imgEl);
            item.aHash = computeAHash(imgEl);
            item.colorHistogram = computeColorHistogram(imgEl);
          } catch (err) {
            console.warn('Perceptual hash error on item', item.name, err);
          }

          const pct = Math.round(((i + 1) / total) * 100);
          const elapsed = (performance.now() - startTime) / 1000;
          const speed = Math.round(((i + 1) / (elapsed || 0.1)) * 10) / 10;
          const eta = Math.max(1, Math.round((total - (i + 1)) / (speed || 1)));

          if (i % 2 === 0 || i === total - 1) {
            updateStageState(
              'perceptual_hashes',
              true,
              false,
              pct,
              `Generated perceptual fingerprints ${i + 1} of ${total}`,
              36 + pct * 0.16,
              i + 1,
              total,
              speed,
              eta
            );
          }
        }
        updateStageState('perceptual_hashes', false, true, 100, `Perceptual hashing completed`, 52, total, total);

        // Stage 5: Visual Embeddings
        setStage('visual_embeddings');
        updateStageState('visual_embeddings', true, false, 0, 'Extracting 64-D visual texture & gradient embeddings...', 53, 0, total);

        for (let i = 0; i < total; i++) {
            if (abortControllerRef.current) {
              await finishCancelled();
              return;
            }
          const item = validImages[i];
          try {
            const imgEl = await loadImageElement(item.file || item.dataUrl || '');
            item.embedding = extractVisualEmbedding(imgEl);
            item.status = 'ready';
          } catch (err) {
            console.warn('Embedding error on item', item.name, err);
          }

          const pct = Math.round(((i + 1) / total) * 100);
          if (i % 2 === 0 || i === total - 1) {
            updateStageState('visual_embeddings', true, false, pct, `Extracted embedding ${i + 1} of ${total}`, 52 + pct * 0.16, i + 1, total);
          }
        }
        updateStageState('visual_embeddings', false, true, 100, `Feature embeddings ready`, 68, total, total);

        // Stage 6: Cross-matching & Pairwise Comparison
        setStage('comparing');
        const totalPairs = (total * (total - 1)) / 2;
        updateStageState('comparing', true, false, 0, `Cross-matching ${totalPairs} image pairs...`, 69, 0, totalPairs);

        const matches: DuplicateMatch[] = [];
        let pairsDone = 0;

        for (let i = 0; i < total; i++) {
          for (let j = i + 1; j < total; j++) {
            if (abortControllerRef.current) {
              await finishCancelled();
              return;
            }
            const match = computePairwiseSimilarity(validImages[i], validImages[j], config);
            if (match.classification !== 'unique') {
              matches.push(match);
            }
            pairsDone++;

            if (pairsDone % 15 === 0 || pairsDone === totalPairs) {
              const pct = totalPairs > 0 ? Math.round((pairsDone / totalPairs) * 100) : 100;
              updateStageState(
                'comparing',
                true,
                false,
                pct,
                `Compared ${pairsDone} of ${totalPairs} pairs`,
                68 + pct * 0.16,
                pairsDone,
                totalPairs
              );
            }
          }
        }
        updateStageState('comparing', false, true, 100, `Identified ${matches.length} duplicate matches`, 84, pairsDone, totalPairs);

        // Stage 7: Clustering & Keep Recommendations
        setStage('clustering');
        updateStageState('clustering', true, false, 50, 'Building duplicate clusters and evaluating best-to-keep files...', 88, 0, matches.length);

        const generatedClusters = buildDuplicateClusters(validImages, matches);
        updateStageState('clustering', false, true, 100, `Built ${generatedClusters.length} duplicate clusters`, 94, generatedClusters.length, generatedClusters.length);

        // Stage 8: Storage Savings & Analytics
        setStage('savings');
        updateStageState('savings', true, false, 75, 'Calculating potential storage reduction and format statistics...', 96, 0, 1);

        const durationSeconds = (performance.now() - startTime) / 1000;
        const generatedReport = generateStorageReport(validImages, generatedClusters, durationSeconds);

        if (scanId !== undefined) {
          await saveScanResults(
            scanId,
            generatedReport,
            validImages,
            generatedClusters,
            'hybrid',
            config.nearDuplicateThreshold / 100
          );
        }

        setImages(validImages);
        setClusters(generatedClusters);
        setReport(generatedReport);

        updateStageState('savings', false, true, 100, 'Scan completed successfully!', 100, total, total);
        setStage('complete');
      } catch (err: unknown) {
        console.error('Scan error:', err);
        if (scanId !== undefined) {
          await updateScanHistory(scanId, {
            status: 'failed',
            durationMs: performance.now() - startTime,
            errorMessage: err instanceof Error ? err.message : 'Unknown error during scan',
          });
        }
        setStage('error');
        setProgress((prev) => ({
          ...prev,
          currentOperation: `Error: ${err instanceof Error ? err.message : 'Unknown error during scan'}`,
        }));
      } finally {
        setIsScanning(false);
      }
    },
    [config]
  );

  // Toggle image selection for cleanup inside a cluster
  const toggleCleanupSelection = useCallback((clusterId: string, imageId: string) => {
    setClusters((prev) =>
      prev.map((c) => {
        if (c.id !== clusterId) return c;
        const exists = c.selectedForCleanup.includes(imageId);
        const updated = exists
          ? c.selectedForCleanup.filter((id) => id !== imageId)
          : [...c.selectedForCleanup, imageId];

        // Recalculate recoverable size based on active selections
        const selectedImages = c.images.filter((img) => updated.includes(img.id));
        const recoverable = selectedImages.reduce((acc, img) => acc + img.size, 0);

        return {
          ...c,
          selectedForCleanup: updated,
          recoverableSize: recoverable,
        };
      })
    );
  }, []);

  // Update whole selection list for a cluster
  const setClusterCleanupSelection = useCallback((clusterId: string, selectedIds: string[]) => {
    setClusters((prev) =>
      prev.map((c) => {
        if (c.id !== clusterId) return c;
        const selectedImages = c.images.filter((img) => selectedIds.includes(img.id));
        const recoverable = selectedImages.reduce((acc, img) => acc + img.size, 0);
        return {
          ...c,
          selectedForCleanup: selectedIds,
          recoverableSize: recoverable,
        };
      })
    );
  }, []);

  // Execute cleanup conceptually (removes cleaned duplicate images from clusters and recalculates report)
  const applyCleanup = useCallback((targetClusterId?: string) => {
    setClusters((prevClusters) => {
      const cleanupIds = new Set(
        prevClusters
          .filter((cluster) => !targetClusterId || cluster.id === targetClusterId)
          .flatMap((cluster) => cluster.selectedForCleanup)
      );
      const filesToDelete = prevClusters
        .filter((cluster) => !targetClusterId || cluster.id === targetClusterId)
        .flatMap((cluster) => cluster.images)
        .filter((image) => cleanupIds.has(image.id) && image.fileHandle);

      void Promise.all(filesToDelete.map(async (image) => {
        const handle = image.fileHandle!;
        const writableHandle = handle as FileSystemFileHandle & {
          requestPermission: (options: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
          remove?: () => Promise<void>;
        };
        try {
          const permission = await writableHandle.requestPermission({ mode: 'readwrite' });
          if (permission === 'granted' && writableHandle.remove) {
            await writableHandle.remove();
          } else {
            console.warn(`Could not delete ${image.name}: filesystem permission was not granted.`);
          }
        } catch (error) {
          console.warn(`Could not delete ${image.name} from the file system.`, error);
        }
      }));
      const updatedClusters: DuplicateCluster[] = [];

      for (const cluster of prevClusters) {
        if (!targetClusterId || cluster.id === targetClusterId) {
          // Remove selected images
          const remainingImages = cluster.images.filter((img) => !cluster.selectedForCleanup.includes(img.id));
          if (remainingImages.length >= 2) {
            const totalSize = remainingImages.reduce((acc, img) => acc + img.size, 0);
            const keepImage = remainingImages.find((img) => img.id === cluster.recommendedKeepId) || remainingImages[0];
            const recoverable = Math.max(0, totalSize - keepImage.size);
            updatedClusters.push({
              ...cluster,
              images: remainingImages,
              totalSize,
              recoverableSize: recoverable,
              selectedForCleanup: remainingImages.filter((img) => img.id !== keepImage.id).map((img) => img.id),
            });
          }
          // If only 1 image remains, cluster is resolved!
        } else {
          updatedClusters.push(cluster);
        }
      }

      // Remove cleaned files from the working collection as well as their clusters.
      setImages((currImages) => {
        const remainingImages = currImages.filter((image) => !cleanupIds.has(image.id));
        if (report) {
          const newReport = generateStorageReport(remainingImages, updatedClusters, report.processingTimeSeconds);
          setReport(newReport);
        }
        return remainingImages;
      });

      return updatedClusters;
    });
  }, [report]);

  return {
    config,
    setConfig,
    stage,
    progress,
    images,
    clusters,
    report,
    validationErrors,
    isScanning,
    startScan,
    cancelScan,
    resetScan,
    toggleCleanupSelection,
    setClusterCleanupSelection,
    applyCleanup,
  };
}
