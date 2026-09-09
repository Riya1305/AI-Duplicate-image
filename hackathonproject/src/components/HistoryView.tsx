import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Calendar, 
  HardDrive, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { ScanHistoryItem } from '../types/report';
import { getScanDetails, getScanHistory, deleteHistoryItem, clearAllHistory, HistoryDetails } from '../services/historyStorage';
import { formatBytes } from '../services/storageCalculator';

interface HistoryViewProps {
  onStartNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onStartNewScan }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [details, setDetails] = useState<HistoryDetails | null>(null);

  const refreshHistory = async () => {
    setHistory(await getScanHistory());
  };

  useEffect(() => {
    void refreshHistory().catch((error) => console.error('Failed to load scan history', error));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this scan history record? Original image files will not be affected.')) return;
    await deleteHistoryItem(id);
    if (details?.scan.id === id) setDetails(null);
    await refreshHistory();
  };

  const handleClearAll = async () => {
    if (window.confirm(`Remove ${history.length} history record${history.length === 1 ? '' : 's'}? Original image files will not be affected.`)) {
      await clearAllHistory();
      setHistory([]);
      setDetails(null);
    }
  };

  const formatDuration = (durationMs: number) => {
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const statusClass = (status: ScanHistoryItem['status']) => status === 'completed'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'processing'
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="w-6 h-6 text-indigo-400" />
            Analysis History Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Locally preserved scan logs and historical storage optimization snapshots
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 px-4 space-y-4 max-w-md mx-auto">
          <div className="w-18 h-18 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
            <HistoryIcon className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-bold text-white">No Previous Scans</h3>
          <p className="text-xs text-slate-400">
            Scan an image collection to generate automated local history logs.
          </p>
          <button
            onClick={onStartNewScan}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
          >
            <span>Start First Scan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
              <div
              key={item.id}
              onClick={() => void getScanDetails(item.id).then(setDetails)}
              className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">{new Date(item.scanDate).toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>{item.totalImages.toLocaleString()} image{item.totalImages === 1 ? '' : 's'} analyzed</span>
                  <span>•</span>
                  <span>{item.duplicateGroups} duplicate cluster{item.duplicateGroups === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span>Duration: {formatDuration(item.durationMs)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Recoverable</span>
                  <span className="text-base font-bold text-emerald-400">
                    {formatBytes(item.recoverableStorageBytes)}
                  </span>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(item.id);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl glass-panel border border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Scan Details</h3>
                <p className="text-xs text-slate-400">{new Date(details.scan.scanDate).toLocaleString()}</p>
              </div>
              <button onClick={() => setDetails(null)} className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer">Close</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ['Status', details.scan.status],
                ['Duration', formatDuration(details.scan.durationMs)],
                ['Images', details.scan.totalImages],
                ['Unique', details.scan.uniqueImages],
                ['Duplicates', details.scan.duplicateImages],
                ['Clusters', details.scan.duplicateGroups],
                ['Exact', details.scan.exactDuplicates],
                ['Near', details.scan.nearDuplicates],
                ['Total storage', formatBytes(details.scan.totalStorageBytes)],
                ['Duplicate storage', formatBytes(details.scan.duplicateStorageBytes)],
                ['Recoverable', formatBytes(details.scan.recoverableStorageBytes)],
                ['Method', details.scan.detectionMethod],
                ['Threshold', `${Math.round(details.scan.similarityThreshold * 100)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                  <span className="block text-slate-500">{label}</span>
                  <strong className="text-white">{value}</strong>
                </div>
              ))}
            </div>
            {details.clusters.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Duplicate Clusters</h4>
                {details.clusters.map((cluster) => (
                  <div key={cluster.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
                    <p>
                      Cluster #{cluster.clusterNumber}: {cluster.imageCount} images, {formatBytes(cluster.recoverableSizeBytes)} recoverable, {Math.round(cluster.similarityScore * 100)}% similarity
                    </p>
                    <div className="mt-2 space-y-1 text-slate-400">
                      {details.clusterImages
                        .filter((relation) => relation.clusterId === cluster.id)
                        .map((relation) => {
                          const image = details.images.find((item) => item.id === relation.imageId);
                          return (
                            <p key={relation.id}>
                              {image?.fileName || relation.imageId}{' '}
                              {relation.isRecommendedToDelete ? '(recommended to delete)' : '(representative)'}
                            </p>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
