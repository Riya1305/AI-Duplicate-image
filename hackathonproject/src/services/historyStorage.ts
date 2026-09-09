import { DuplicateCluster } from '../types/cluster';
import { ImageMetadata } from '../types/image';
import { ScanHistoryItem, StorageReport } from '../types/report';

const DATABASE_NAME = 'ai_duplicate_finder_database';
const DATABASE_VERSION = 2;
const LEGACY_STORAGE_KEY = 'ai_duplicate_finder_history_v1';
const HISTORY = 'scan_history';
const IMAGES = 'scanned_images';
const CLUSTERS = 'duplicate_clusters';
const RELATIONS = 'cluster_images';

export interface ScannedImageRecord {
  id: string; scanId: number; fileName: string; filePath?: string; fileSizeBytes: number;
  width: number; height: number; format: string; mimeType: string; sha256Hash?: string;
  phash?: string; dhash?: string; ahash?: string; embedding?: number[];
  isDuplicate: boolean; isRepresentative: boolean; createdAt: string;
}
export interface DuplicateClusterRecord {
  id: string; scanId: number; clusterNumber: number; imageCount: number;
  totalSizeBytes: number; recoverableSizeBytes: number; representativeImageId: string;
  similarityScore: number; clusterType: 'exact' | 'near_duplicate' | 'visually_similar'; createdAt: string;
}
export interface ClusterImageRecord {
  id: string; clusterId: string; imageId: string; isRecommendedToDelete: boolean;
  isDeleted: boolean; createdAt: string;
}
export interface HistoryDetails {
  scan: ScanHistoryItem; images: ScannedImageRecord[];
  clusters: DuplicateClusterRecord[]; clusterImages: ClusterImageRecord[];
}
export type DetectionMethod = ScanHistoryItem['detectionMethod'];

const nonNegative = (value: number) => Number.isFinite(value) && value >= 0 ? value : 0;
const threshold = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const upgradeTransaction = request.transaction!;
      const make = (name: string, keyPath: string | string[], autoIncrement = false) => {
        if (database.objectStoreNames.contains(name)) return upgradeTransaction.objectStore(name);
        return database.createObjectStore(name, { keyPath, autoIncrement });
      };
      const history = make(HISTORY, 'id', true);
      if (!history.indexNames.contains('scan_date')) history.createIndex('scan_date', 'scanDate');
      if (!history.indexNames.contains('status')) history.createIndex('status', 'status');
      const images = make(IMAGES, 'id');
      if (!images.indexNames.contains('scan_id')) images.createIndex('scan_id', 'scanId');
      if (!images.indexNames.contains('sha256_hash')) images.createIndex('sha256_hash', 'sha256Hash');
      const clusters = make(CLUSTERS, 'id');
      if (!clusters.indexNames.contains('scan_id')) clusters.createIndex('scan_id', 'scanId');
      const relations = make(RELATIONS, 'id');
      if (!relations.indexNames.contains('cluster_id')) relations.createIndex('cluster_id', 'clusterId');
      if (!relations.indexNames.contains('image_id')) relations.createIndex('image_id', 'imageId');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function migrateLegacy(database: IDBDatabase): Promise<void> {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;
  try {
    const items = JSON.parse(raw) as Array<Record<string, unknown>>;
    const transaction = database.transaction(HISTORY, 'readwrite');
    const store = transaction.objectStore(HISTORY);
    items.forEach((item) => {
      const now = new Date().toISOString();
      store.add({
        scanDate: String(item.scanDate || item.date || now), completedAt: String(item.completedAt || item.date || now),
        status: item.status === 'completed' ? 'completed' : 'failed', totalImages: nonNegative(Number(item.totalImages)),
        duplicateGroups: nonNegative(Number(item.duplicateGroups)), duplicateImages: nonNegative(Number(item.duplicateImages)),
        uniqueImages: Math.max(0, Number(item.totalImages || 0) - Number(item.duplicateImages || 0)),
        exactDuplicates: 0, nearDuplicates: 0, durationMs: nonNegative(Number(item.durationMs || Number(item.processingTimeSeconds || 0) * 1000)),
        totalStorageBytes: nonNegative(Number(item.totalStorageBytes || item.totalBytes)), duplicateStorageBytes: 0,
        recoverableStorageBytes: nonNegative(Number(item.recoverableStorageBytes || item.recoverableBytes)), detectionMethod: 'hybrid',
        similarityThreshold: 0.88, createdAt: now, updatedAt: now,
      });
    });
    await complete(transaction);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) { console.error('Failed to migrate legacy scan history', error); }
}

export async function createScanHistory(input: { detectionMethod: DetectionMethod; similarityThreshold: number }): Promise<number> {
  const database = await openDatabase();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const request = database.transaction(HISTORY, 'readwrite').objectStore(HISTORY).add({
      scanDate: now, status: 'processing', totalImages: 0, duplicateGroups: 0, duplicateImages: 0, uniqueImages: 0,
      exactDuplicates: 0, nearDuplicates: 0, durationMs: 0, totalStorageBytes: 0, duplicateStorageBytes: 0,
      recoverableStorageBytes: 0, detectionMethod: input.detectionMethod, similarityThreshold: threshold(input.similarityThreshold),
      createdAt: now, updatedAt: now,
    });
    request.onsuccess = () => resolve(Number(request.result));
    request.onerror = () => reject(request.error);
  });
}

export async function updateScanHistory(scanId: number, patch: Partial<ScanHistoryItem>): Promise<void> {
  const database = await openDatabase();
  const existing = await new Promise<ScanHistoryItem | undefined>((resolve, reject) => {
    const request = database.transaction(HISTORY, 'readonly').objectStore(HISTORY).get(scanId);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  if (!existing) return;
  const transaction = database.transaction(HISTORY, 'readwrite');
  transaction.objectStore(HISTORY).put({ ...existing, ...patch, id: scanId, updatedAt: new Date().toISOString() });
  await complete(transaction);
}

export async function saveScanResults(scanId: number, report: StorageReport, images: ImageMetadata[], clusters: DuplicateCluster[], detectionMethod: DetectionMethod, similarityThreshold: number): Promise<void> {
  const database = await openDatabase();
  const existing = await new Promise<ScanHistoryItem | undefined>((resolve, reject) => {
    const request = database.transaction(HISTORY, 'readonly').objectStore(HISTORY).get(scanId);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  if (!existing) return;
  const transaction = database.transaction([HISTORY, IMAGES, CLUSTERS, RELATIONS], 'readwrite');
  const imageStore = transaction.objectStore(IMAGES); const clusterStore = transaction.objectStore(CLUSTERS); const relationStore = transaction.objectStore(RELATIONS);
  const createdAt = new Date().toISOString(); const duplicateIds = new Set(clusters.flatMap((cluster) => cluster.images.map((image) => image.id)));
  images.forEach((image) => {
    imageStore.put({
      id: image.id,
      scanId,
      fileName: image.name,
      filePath: image.relativePath,
      fileSizeBytes: nonNegative(image.size),
      width: nonNegative(image.width),
      height: nonNegative(image.height),
      format: (image.name.split('.').pop() || image.type).toUpperCase(),
      mimeType: image.type,
      sha256Hash: image.sha256,
      phash: image.pHash,
      dhash: image.dHash,
      ahash: image.aHash,
      embedding: image.embedding,
      isDuplicate: duplicateIds.has(image.id),
      isRepresentative: clusters.some((cluster) => cluster.recommendedKeepId === image.id),
      createdAt,
    } satisfies ScannedImageRecord);
  });
  clusters.forEach((cluster) => { const clusterId = `${scanId}-${cluster.id}`; clusterStore.put({ id: clusterId, scanId, clusterNumber: cluster.clusterNumber, imageCount: cluster.images.length, totalSizeBytes: nonNegative(cluster.totalSize), recoverableSizeBytes: nonNegative(cluster.recoverableSize), representativeImageId: cluster.recommendedKeepId, similarityScore: nonNegative(cluster.averageSimilarity) / 100, clusterType: cluster.duplicateType === 'exact' ? 'exact' : cluster.duplicateType === 'near' ? 'near_duplicate' : 'visually_similar', createdAt } satisfies DuplicateClusterRecord); cluster.images.forEach((image) => relationStore.put({ id: `${clusterId}-${image.id}`, clusterId, imageId: image.id, isRecommendedToDelete: image.id !== cluster.recommendedKeepId, isDeleted: false, createdAt } satisfies ClusterImageRecord)); });
  const now = new Date().toISOString();
  transaction.objectStore(HISTORY).put({ ...existing, id: scanId, completedAt: now, status: 'completed', totalImages: report.totalImages, duplicateGroups: report.duplicateGroups, duplicateImages: report.duplicateImages, uniqueImages: report.uniqueImages, exactDuplicates: report.exactDuplicateGroups, nearDuplicates: report.nearDuplicateGroups, durationMs: Math.round(report.processingTimeSeconds * 1000), totalStorageBytes: report.totalStorageBytes, duplicateStorageBytes: report.duplicateStorageBytes, recoverableStorageBytes: report.recoverableStorageBytes, detectionMethod, similarityThreshold: threshold(similarityThreshold), updatedAt: now });
  await complete(transaction);
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const database = await openDatabase(); await migrateLegacy(database);
  return new Promise((resolve, reject) => { const request = database.transaction(HISTORY, 'readonly').objectStore(HISTORY).getAll(); request.onsuccess = () => resolve((request.result as ScanHistoryItem[]).sort((a, b) => b.id - a.id)); request.onerror = () => reject(request.error); });
}

export async function getScanDetails(scanId: number): Promise<HistoryDetails | null> {
  const database = await openDatabase();
  const get = <T>(store: string, key: IDBValidKey) => new Promise<T | undefined>((resolve, reject) => { const request = database.transaction(store, 'readonly').objectStore(store).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const scan = await get<ScanHistoryItem>(HISTORY, scanId); if (!scan) return null;
  const getAll = <T>(store: string, index: string, key: IDBValidKey) => new Promise<T[]>((resolve, reject) => { const request = database.transaction(store, 'readonly').objectStore(store).index(index).getAll(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const images = await getAll<ScannedImageRecord>(IMAGES, 'scan_id', scanId); const clusters = await getAll<DuplicateClusterRecord>(CLUSTERS, 'scan_id', scanId); const clusterImages = (await Promise.all(clusters.map((cluster) => getAll<ClusterImageRecord>(RELATIONS, 'cluster_id', cluster.id)))).flat();
  return { scan, images, clusters, clusterImages };
}

export async function deleteHistoryItem(scanId: number): Promise<void> {
  const database = await openDatabase(); const details = await getScanDetails(scanId); if (!details) return;
  const transaction = database.transaction([HISTORY, IMAGES, CLUSTERS, RELATIONS], 'readwrite'); transaction.objectStore(HISTORY).delete(scanId); details.images.forEach((item) => transaction.objectStore(IMAGES).delete(item.id)); details.clusters.forEach((item) => transaction.objectStore(CLUSTERS).delete(item.id)); details.clusterImages.forEach((item) => transaction.objectStore(RELATIONS).delete(item.id)); await complete(transaction);
}

export async function clearAllHistory(): Promise<void> { const database = await openDatabase(); const transaction = database.transaction([HISTORY, IMAGES, CLUSTERS, RELATIONS], 'readwrite'); [HISTORY, IMAGES, CLUSTERS, RELATIONS].forEach((store) => transaction.objectStore(store).clear()); await complete(transaction); }
