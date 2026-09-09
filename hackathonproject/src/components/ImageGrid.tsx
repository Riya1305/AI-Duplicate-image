import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  SplitSquareVertical, 
  CheckSquare, 
  Square, 
  Star, 
  Filter, 
  Layers, 
  HardDrive,
  Sliders,
  FolderOpen
} from 'lucide-react';
import { ImageMetadata } from '../types/image';
import { DuplicateCluster } from '../types/cluster';
import { Badge } from './common/Badge';
import { formatBytes } from '../services/storageCalculator';

interface ImageGridProps {
  images: ImageMetadata[];
  clusters: DuplicateCluster[];
  onViewDetails: (image: ImageMetadata, cluster?: DuplicateCluster) => void;
  onCompare: (imageA: ImageMetadata, imageB: ImageMetadata) => void;
  onToggleSelection: (clusterId: string, imageId: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  clusters,
  onViewDetails,
  onCompare,
  onToggleSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'exact' | 'near' | 'similar' | 'unique'>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [minSimilarity, setMinSimilarity] = useState<number>(0);
  const [sizeFilter, setSizeFilter] = useState<'all' | '500kb' | '1mb' | '5mb'>('all');
  const [sortBy, setSortBy] = useState<'similarity' | 'size' | 'resolution' | 'name'>('similarity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Build quick image-to-cluster mapping
  const imageClusterMap = useMemo(() => {
    const map = new Map<string, { cluster: DuplicateCluster; isKeeper: boolean; isSelected: boolean }>();
    clusters.forEach((c) => {
      c.images.forEach((img) => {
        map.set(img.id, {
          cluster: c,
          isKeeper: c.recommendedKeepId === img.id,
          isSelected: c.selectedForCleanup.includes(img.id),
        });
      });
    });
    return map;
  }, [clusters]);

  // Extract unique file formats present in collection
  const availableFormats = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => {
      const ext = (img.name.split('.').pop() || '').toUpperCase();
      if (ext) set.add(ext);
    });
    return Array.from(set).sort();
  }, [images]);

  // Filter and sort images
  const filteredImages = useMemo(() => {
    return images
      .filter((img) => {
        const clusterInfo = imageClusterMap.get(img.id);
        const dupType = clusterInfo ? clusterInfo.cluster.duplicateType : 'unique';
        const similarity = clusterInfo ? clusterInfo.cluster.highestSimilarity : 0;

        // Duplicate type filter
        if (typeFilter !== 'all' && dupType !== typeFilter) return false;

        // Format filter
        if (formatFilter !== 'all') {
          const ext = (img.name.split('.').pop() || '').toUpperCase();
          if (ext !== formatFilter) return false;
        }

        // Similarity threshold slider
        if (clusterInfo && similarity < minSimilarity) return false;
        if (!clusterInfo && minSimilarity > 0) return false;

        // Size filter
        if (sizeFilter === '500kb' && img.size < 500 * 1024) return false;
        if (sizeFilter === '1mb' && img.size < 1024 * 1024) return false;
        if (sizeFilter === '5mb' && img.size < 5 * 1024 * 1024) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = img.name.toLowerCase().includes(q);
          const matchCluster = clusterInfo && `cluster #${clusterInfo.cluster.clusterNumber}`.toLowerCase().includes(q);
          const matchExt = img.name.toLowerCase().endsWith(q);
          if (!matchName && !matchCluster && !matchExt) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const cA = imageClusterMap.get(a.id);
        const cB = imageClusterMap.get(b.id);

        let diff = 0;
        if (sortBy === 'similarity') {
          const simA = cA ? cA.cluster.highestSimilarity : 0;
          const simB = cB ? cB.cluster.highestSimilarity : 0;
          diff = simB - simA;
        } else if (sortBy === 'size') {
          diff = b.size - a.size;
        } else if (sortBy === 'resolution') {
          diff = b.width * b.height - a.width * a.height;
        } else if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        }

        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [images, imageClusterMap, searchQuery, typeFilter, formatFilter, minSimilarity, sizeFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-3 shadow-lg">
        {/* Row 1: Search + Duplicate Type Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by filename, extension, or cluster #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Duplicate Classification Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'exact', 'near', 'similar', 'unique'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Granular Filters (Format, Similarity Slider, Size, Sort) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
          {/* Extension / Format filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Format:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden"
            >
              <option value="all">All Formats</option>
              {availableFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          {/* Similarity Range Slider */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-slate-500">Min Similarity:</span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-400 font-bold">{minSimilarity}%</span>
          </div>

          {/* Size Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">File Size:</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden"
            >
              <option value="all">All Sizes</option>
              <option value="500kb">&gt; 500 KB</option>
              <option value="1mb">&gt; 1 MB</option>
              <option value="5mb">&gt; 5 MB</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden"
            >
              <option value="similarity">Similarity Score</option>
              <option value="size">File Size</option>
              <option value="resolution">Resolution</option>
              <option value="name">Filename</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Toggle sort direction"
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {filteredImages.length} of {images.length} images</span>
      </div>

      {/* Responsive Image Grid Cards */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-16 px-4 space-y-3 max-w-sm mx-auto">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Matching Images</h4>
          <p className="text-xs text-slate-400">
            Try adjusting your search query, format, or similarity threshold filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => {
            const clusterInfo = imageClusterMap.get(img.id);
            const cluster = clusterInfo?.cluster;
            const isKeeper = clusterInfo?.isKeeper ?? false;
            const isSelected = clusterInfo?.isSelected ?? false;
            const dupType = cluster ? cluster.duplicateType : 'unique';
            const similarity = cluster ? cluster.highestSimilarity : 0;

            return (
              <div
                key={img.id}
                className={`group rounded-2xl border p-3.5 space-y-3 transition-all duration-200 relative flex flex-col justify-between ${
                  isKeeper
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/15 to-slate-900/40 shadow-md shadow-amber-500/5'
                    : isSelected
                    ? 'border-indigo-500/50 bg-indigo-950/20 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                {/* Card Top Row: Badges & Select Checkbox */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isKeeper ? (
                      <Badge type="keeper" size="sm" />
                    ) : (
                      <Badge type={dupType} size="sm" />
                    )}
                    {cluster && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        #{cluster.clusterNumber.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Selection Checkbox (for duplicates only, keepers are protected) */}
                  {cluster && !isKeeper && (
                    <button
                      onClick={() => onToggleSelection(cluster.id, img.id)}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      title={isSelected ? 'Remove from cleanup list' : 'Mark for cleanup'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  )}
                </div>

                {/* Thumbnail Preview Area with Hover Actions */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 h-40 flex items-center justify-center p-2 group">
                  {img.dataUrl ? (
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-600 text-xs">No preview</div>
                  )}

                  {/* Floating Similarity Badge if part of duplicate group */}
                  {cluster && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-bold text-emerald-400">
                      {similarity}% Match
                    </div>
                  )}

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => onViewDetails(img, cluster)}
                      className="p-2 rounded-xl bg-slate-800/90 text-white hover:bg-indigo-600 transition-colors shadow-md cursor-pointer"
                      title="View Forensic Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {cluster && cluster.images.length >= 2 && (
                      <button
                        onClick={() => {
                          const keeper = cluster.images.find((i) => i.id === cluster.recommendedKeepId) || cluster.images[0];
                          const other = img.id === keeper.id ? cluster.images.find((i) => i.id !== keeper.id)! : img;
                          onCompare(keeper, other);
                        }}
                        className="p-2 rounded-xl bg-slate-800/90 text-white hover:bg-indigo-600 transition-colors shadow-md cursor-pointer"
                        title="Compare Side-by-Side"
                      >
                        <SplitSquareVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Specs and Details */}
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-white truncate text-[11px]" title={img.name}>
                    {img.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{img.width}×{img.height} px</span>
                    <span className="font-medium text-slate-300">{formatBytes(img.size)}</span>
                  </div>
                </div>

                {/* Bottom Card Action Bar */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => onViewDetails(img, cluster)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    View Details
                  </button>

                  {cluster && (
                    <span className="text-slate-500 font-mono text-[10px]">
                      {isKeeper ? '⭐ Keep' : `${formatBytes(img.size)} savings`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
