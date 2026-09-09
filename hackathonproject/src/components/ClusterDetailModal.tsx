import React from 'react';
import { 
  X, 
  Star, 
  CheckSquare, 
  Square, 
  SplitSquareVertical, 
  HardDrive, 
  Info, 
  FileText, 
  ShieldAlert, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { DuplicateCluster } from '../types/cluster';
import { ImageMetadata } from '../types/image';
import { Badge } from './common/Badge';
import { formatBytes } from '../services/storageCalculator';

interface ClusterDetailModalProps {
  cluster: DuplicateCluster;
  onClose: () => void;
  onCompareTwo: (imgA: ImageMetadata, imgB: ImageMetadata) => void;
  onToggleSelection: (clusterId: string, imageId: string) => void;
  onApplyCleanup: (clusterId: string) => void;
  onViewDetails?: (img: ImageMetadata, cluster?: DuplicateCluster) => void;
}

export const ClusterDetailModal: React.FC<ClusterDetailModalProps> = ({
  cluster,
  onClose,
  onCompareTwo,
  onToggleSelection,
  onApplyCleanup,
  onViewDetails,
}) => {

  const keeperImage = cluster.images.find((img) => img.id === cluster.recommendedKeepId) || cluster.images[0];

  const selectedCount = cluster.selectedForCleanup.length;
  const selectedSize = cluster.images
    .filter((img) => cluster.selectedForCleanup.includes(img.id))
    .reduce((acc, img) => acc + img.size, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-5xl w-full rounded-3xl glass-panel border border-slate-700 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-900/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-extrabold text-white">
                Cluster #{cluster.clusterNumber.toString().padStart(2, '0')} Review
              </h3>
              <Badge type={cluster.duplicateType} size="sm" />
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {cluster.averageSimilarity}% Average Similarity
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Total Storage: <strong className="text-white">{formatBytes(cluster.totalSize)}</strong> •{' '}
              Potential Savings: <strong className="text-emerald-400">{formatBytes(cluster.recoverableSize)}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Recommendation Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-slate-900/60 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300">
                Smart Keep Recommendation:
              </span>{' '}
              <span className="text-xs text-slate-300">
                {cluster.recommendedKeepReason}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Recommended file to keep is marked with a gold badge
          </span>
        </div>

        {/* Image Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cluster.images.map((img) => {
              const isKeeper = img.id === cluster.recommendedKeepId;
              const isSelected = cluster.selectedForCleanup.includes(img.id);

              return (
                <div
                  key={img.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all relative flex flex-col justify-between ${
                    isKeeper
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900/50 shadow-lg shadow-amber-500/5'
                      : isSelected
                      ? 'border-indigo-500/40 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  {/* Card top row */}
                  <div className="flex items-start justify-between gap-2">
                    {isKeeper ? (
                      <Badge type="keeper" size="sm" />
                    ) : (
                      <button
                        onClick={() => onToggleSelection(cluster.id, img.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="text-[11px] font-medium">
                          {isSelected ? 'Marked for cleanup' : 'Keep this file'}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(img, cluster)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                          title="View complete forensic diagnostic details"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      )}

                      {!isKeeper && (
                        <button
                          onClick={() => onCompareTwo(keeperImage, img)}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Compare side-by-side with recommended file"
                        >
                          <SplitSquareVertical className="w-3.5 h-3.5" />
                          <span>Compare</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 h-44 flex items-center justify-center p-2">
                    {img.dataUrl ? (
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="text-slate-600 text-xs">No preview</div>
                    )}
                  </div>

                  {/* Metadata Specs */}
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-white truncate" title={img.name}>
                      {img.name}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1">
                      <div>
                        Dimensions:{' '}
                        <span className="text-slate-200 font-medium">
                          {img.width} × {img.height}
                        </span>
                      </div>
                      <div>
                        Size:{' '}
                        <span className="text-slate-200 font-medium">
                          {formatBytes(img.size)}
                        </span>
                      </div>
                      <div>
                        Format:{' '}
                        <span className="text-slate-200 uppercase font-medium">
                          {img.name.split('.').pop() || img.type}
                        </span>
                      </div>
                      <div>
                        Ratio:{' '}
                        <span className="text-slate-200 font-medium">
                          {img.aspectRatio}:1
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hashes snippet */}
                  <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono truncate">
                    SHA: {img.sha256 ? img.sha256.substring(0, 16) + '...' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-300">
            Selected for cleanup:{' '}
            <strong className="text-white">{selectedCount} files</strong> (
            <strong className="text-emerald-400">{formatBytes(selectedSize)}</strong> recoverable)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => {
                onApplyCleanup(cluster.id);
                onClose();
              }}
              disabled={selectedCount === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              Delete Marked Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
