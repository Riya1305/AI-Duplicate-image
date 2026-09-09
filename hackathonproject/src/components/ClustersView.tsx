import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  ArrowUpDown, 
  Eye, 
  SplitSquareVertical, 
  PlusCircle, 
  CheckCircle2,
  FolderOpen,
  LayoutGrid,
  Grid,
  Columns2,
  Star,
  CheckSquare,
  Square,
  HardDrive
  ,Trash2
} from 'lucide-react';
import { DuplicateCluster, ClusterFilterOptions } from '../types/cluster';
import { ImageMetadata } from '../types/image';
import { Badge } from './common/Badge';
import { SimilarityGauge } from './common/SimilarityGauge';
import { ImageGrid } from './ImageGrid';
import { formatBytes } from '../services/storageCalculator';

export type ClusterViewMode = 'clusters' | 'grid' | 'split';

interface ClustersViewProps {
  images: ImageMetadata[];
  clusters: DuplicateCluster[];
  hasScanned: boolean;
  onReviewCluster: (cluster: DuplicateCluster) => void;
  onCompareCluster: (cluster: DuplicateCluster) => void;
  onCompareTwo: (imgA: ImageMetadata, imgB: ImageMetadata) => void;
  onViewDetails: (img: ImageMetadata, cluster?: DuplicateCluster) => void;
  onToggleSelection: (clusterId: string, imageId: string) => void;
  onApplyCleanup: () => void;
  onStartNewScan: () => void;
}

export const ClustersView: React.FC<ClustersViewProps> = ({
  images,
  clusters,
  hasScanned,
  onReviewCluster,
  onCompareCluster,
  onCompareTwo,
  onViewDetails,
  onToggleSelection,
  onApplyCleanup,
  onStartNewScan,
}) => {
  const [viewMode, setViewMode] = useState<ClusterViewMode>('clusters');
  const [selectedSplitClusterId, setSelectedSplitClusterId] = useState<string>(
    clusters[0]?.id || ''
  );

  const [filter, setFilter] = useState<ClusterFilterOptions>({
    searchQuery: '',
    duplicateType: 'all',
    minSimilarity: 0,
    sortBy: 'savings',
    sortOrder: 'desc',
  });

  const filteredClusters = useMemo(() => {
    return clusters
      .filter((c) => {
        if (filter.duplicateType !== 'all' && c.duplicateType !== filter.duplicateType) {
          return false;
        }
        if (c.highestSimilarity < filter.minSimilarity) {
          return false;
        }
        if (filter.searchQuery.trim()) {
          const query = filter.searchQuery.toLowerCase();
          const hasMatchingImage = c.images.some(
            (img) => img.name.toLowerCase().includes(query) || img.type.toLowerCase().includes(query)
          );
          const hasClusterNumber = `cluster #${c.clusterNumber}`.toLowerCase().includes(query);
          return hasMatchingImage || hasClusterNumber;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (filter.sortBy === 'savings') diff = b.recoverableSize - a.recoverableSize;
        if (filter.sortBy === 'similarity') diff = b.highestSimilarity - a.highestSimilarity;
        if (filter.sortBy === 'count') diff = b.images.length - a.images.length;
        if (filter.sortBy === 'size') diff = b.totalSize - a.totalSize;
        if (filter.sortBy === 'name') diff = a.clusterNumber - b.clusterNumber;

        return filter.sortOrder === 'asc' ? -diff : diff;
      });
  }, [clusters, filter]);

  const totalRecoverable = clusters.reduce((acc, c) => acc + c.recoverableSize, 0);
  const selectedCount = clusters.reduce((acc, cluster) => acc + cluster.selectedForCleanup.length, 0);

  // Selected cluster for split-screen two-column view
  const activeSplitCluster = useMemo(() => {
    return (
      clusters.find((c) => c.id === selectedSplitClusterId) ||
      filteredClusters[0] ||
      clusters[0]
    );
  }, [clusters, filteredClusters, selectedSplitClusterId]);

  if (!hasScanned) {
    return (
      <div className="text-center py-20 px-4 space-y-5 max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
          <Layers className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Your duplicate workspace is empty</h3>
          <p className="text-sm text-slate-400">
            Upload a folder, ZIP archive, or collection of images to detect duplicate groups.
          </p>
        </div>
        <button
          onClick={onStartNewScan}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Scan</span>
        </button>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-20 px-4 space-y-5 max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">🎉 No duplicates detected</h3>
          <p className="text-sm text-slate-400">
            Your image collection looks clean! Every image in this dataset appears visually unique.
          </p>
        </div>
        <button
          onClick={onStartNewScan}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
        >
          <span>Scan Another Folder</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            Duplicate Clusters ({clusters.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organized by perceptual signatures & exact hashes • Recoverable storage:{' '}
            <strong className="text-emerald-400">{formatBytes(totalRecoverable)}</strong>
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {selectedCount > 0 && (
            <button
              onClick={onApplyCleanup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
              title="Delete all marked duplicate images"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedCount})
            </button>
          )}
          <button
            onClick={() => setViewMode('clusters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'clusters'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Cluster Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Clusters</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="All Images Flat Grid View"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Images</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Two-Column Split Workspace"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Two-Column</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Cluster Cards View (Default) */}
      {viewMode === 'clusters' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by filename or cluster #..."
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              {(['all', 'exact', 'near', 'similar'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter({ ...filter, duplicateType: t })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    filter.duplicateType === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
                className="bg-slate-900/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
              >
                <option value="savings">Recoverable Savings</option>
                <option value="similarity">Highest Similarity</option>
                <option value="count">Duplicate Count</option>
                <option value="size">Total Size</option>
                <option value="name">Cluster Number</option>
              </select>
            </div>
          </div>

          {/* Cluster Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClusters.map((cluster) => {
              const repImage = cluster.images[0];
              return (
                <div
                  key={cluster.id}
                  className="rounded-2xl glass-card border border-slate-800/80 hover:border-indigo-500/40 p-5 space-y-4 shadow-xl flex flex-col justify-between group transition-all duration-300"
                >
                  {/* Card Header: Cluster Number & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase block">
                        Cluster #{cluster.clusterNumber.toString().padStart(2, '0')}
                      </span>
                      <span className="text-base font-bold text-white">
                        {cluster.images.length} images
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge type={cluster.duplicateType} size="sm" />
                    </div>
                  </div>

                  {/* Thumbnails preview strip */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800 h-44 flex items-center justify-center p-2">
                    {repImage?.dataUrl ? (
                      <img
                        src={repImage.dataUrl}
                        alt={repImage.name}
                        className="max-h-full max-w-full object-contain rounded-lg shadow-md group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <FolderOpen className="w-10 h-10 text-slate-600" />
                    )}

                    {/* Circular Similarity Gauge floating badge */}
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md rounded-full p-1 border border-slate-800 shadow-md">
                      <SimilarityGauge score={cluster.highestSimilarity} size={46} strokeWidth={4} />
                    </div>
                  </div>

                  {/* Metadata details */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Total Storage:</span>
                      <span className="font-semibold text-white">{formatBytes(cluster.totalSize)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Potential Savings:</span>
                      <span className="font-bold text-emerald-400">{formatBytes(cluster.recoverableSize)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Similarity Range:</span>
                      <span className="font-medium text-slate-300">
                        {cluster.lowestSimilarity}% – {cluster.highestSimilarity}%
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => onReviewCluster(cluster)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Group</span>
                    </button>

                    <button
                      onClick={() => onCompareCluster(cluster)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Compare</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: All Images Responsive Grid View */}
      {viewMode === 'grid' && (
        <ImageGrid
          images={images}
          clusters={clusters}
          onViewDetails={onViewDetails}
          onCompare={onCompareTwo}
          onToggleSelection={onToggleSelection}
        />
      )}

      {/* VIEW 3: Two-Column Split Workspace (Section 35) */}
      {viewMode === 'split' && activeSplitCluster && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cluster List Navigation (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl glass-panel border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Duplicate Group
              </span>
              <span className="text-[11px] text-slate-500">
                {filteredClusters.length} clusters
              </span>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredClusters.map((c) => {
                const isSelected = c.id === activeSplitCluster.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedSplitClusterId(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500/60 bg-indigo-950/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        {c.images[0]?.dataUrl && (
                          <img src={c.images[0].dataUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">
                            Cluster #{c.clusterNumber}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            {c.highestSimilarity}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {c.images.length} files • {formatBytes(c.totalSize)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                      +{formatBytes(c.recoverableSize)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Cluster Focus Workspace (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl glass-panel border border-slate-800 p-6 space-y-6">
            {/* Header for Active Cluster */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    Cluster #{activeSplitCluster.clusterNumber}
                  </h3>
                  <Badge type={activeSplitCluster.duplicateType} size="sm" />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    {activeSplitCluster.averageSimilarity}% Average Similarity
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Contains {activeSplitCluster.images.length} copies • Total Size: {formatBytes(activeSplitCluster.totalSize)} •{' '}
                  <strong className="text-emerald-400">
                    {formatBytes(activeSplitCluster.recoverableSize)} Recoverable
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCompareCluster(activeSplitCluster)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm cursor-pointer"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>Compare in Studio</span>
                </button>
              </div>
            </div>

            {/* Smart Keep Recommendation Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Keep Recommendation: {activeSplitCluster.recommendedKeepReason}</span>
              </div>
            </div>

            {/* Images inside this cluster */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeSplitCluster.images.map((img) => {
                const isKeeper = img.id === activeSplitCluster.recommendedKeepId;
                const isSelected = activeSplitCluster.selectedForCleanup.includes(img.id);

                return (
                  <div
                    key={img.id}
                    className={`rounded-xl border p-3 space-y-2.5 transition-all relative flex flex-col justify-between ${
                      isKeeper
                        ? 'border-amber-500/40 bg-amber-950/15'
                        : isSelected
                        ? 'border-indigo-500/40 bg-indigo-950/20'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {isKeeper ? (
                        <Badge type="keeper" size="sm" />
                      ) : (
                        <button
                          onClick={() => onToggleSelection(activeSplitCluster.id, img.id)}
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span>{isSelected ? 'Marked for cleanup' : 'Keep file'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewDetails(img, activeSplitCluster)}
                        className="text-slate-400 hover:text-white p-1"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-32 rounded-lg bg-slate-950 flex items-center justify-center p-1.5 overflow-hidden">
                      {img.dataUrl && (
                        <img src={img.dataUrl} alt="" className="max-h-full max-w-full object-contain rounded-md" />
                      )}
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <p className="font-semibold text-white truncate" title={img.name}>{img.name}</p>
                      <div className="flex justify-between text-slate-400">
                        <span>{img.width}×{img.height}</span>
                        <span>{formatBytes(img.size)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
