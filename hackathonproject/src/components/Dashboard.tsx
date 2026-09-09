import React from 'react';
import { 
  ScanSearch, 
  Sparkles, 
  HardDrive, 
  Layers, 
  Gauge, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Cpu, 
  FileCheck2, 
  Eye, 
  Download,
  FolderOpen
} from 'lucide-react';
import { StatCard } from './common/StatCard';
import { StorageReport } from '../types/report';
import { DuplicateCluster } from '../types/cluster';
import { formatBytes } from '../services/storageCalculator';

interface DashboardProps {
  report: StorageReport | null;
  clusters: DuplicateCluster[];
  onStartScan: () => void;
  onTryDemo: () => void;
  onReviewCluster: (cluster: DuplicateCluster) => void;
  onOpenReports: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  report,
  clusters,
  onStartScan,
  onTryDemo,
  onReviewCluster,
  onOpenReports,
}) => {
  const isAnalyzed = report !== null;

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered • Privacy First • Local CV Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Find Duplicate Images <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
            AI-powered perceptual analysis detects exact and visually similar images—even after
            resizing, compression, cropping, or minor edits. 100% computed inside your browser.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartScan}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/25 active:scale-95 transition-all border border-indigo-400/30 cursor-pointer"
            >
              <ScanSearch className="w-5 h-5" />
              <span>Find Duplicate Images</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onTryDemo}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Try Demo Dataset</span>
            </button>

          </div>
        </div>
      </section>

      {/* Summary Metrics Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-400" />
            Scan Summary Metrics
          </h2>
          {isAnalyzed && (
            <span className="text-xs text-slate-400">
              Scanned on {report.scanDate} ({report.processingTimeSeconds}s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Images Scanned"
            value={isAnalyzed ? report.totalImages.toLocaleString() : '—'}
            subtitle={isAnalyzed ? `${formatBytes(report.totalStorageBytes)} total` : 'Not analyzed yet'}
            icon={<ScanSearch className="w-5 h-5" />}
            variant="default"
            isAnalyzed={isAnalyzed}
          />

          <StatCard
            title="Duplicate Groups"
            value={isAnalyzed ? report.duplicateGroups : '—'}
            subtitle={isAnalyzed ? `${report.exactDuplicateGroups} exact, ${report.nearDuplicateGroups} near` : 'Not analyzed yet'}
            icon={<Layers className="w-5 h-5" />}
            variant="indigo"
            isAnalyzed={isAnalyzed}
          />

          <StatCard
            title="Duplicate Images"
            value={isAnalyzed ? report.duplicateImages : '—'}
            subtitle={isAnalyzed ? `${report.uniqueImages} unique images` : 'Not analyzed yet'}
            icon={<FileCheck2 className="w-5 h-5" />}
            variant="purple"
            isAnalyzed={isAnalyzed}
          />

          <StatCard
            title="Storage Recoverable"
            value={isAnalyzed ? formatBytes(report.recoverableStorageBytes) : '—'}
            subtitle={isAnalyzed ? `${report.savingsPercentage}% space reclaimable` : 'Not analyzed yet'}
            icon={<HardDrive className="w-5 h-5" />}
            variant="emerald"
            isAnalyzed={isAnalyzed}
          />

          <StatCard
            title="Average Similarity"
            value={isAnalyzed ? `${report.averageSimilarity}%` : '—'}
            subtitle={isAnalyzed ? 'Across duplicate pairs' : 'Not analyzed yet'}
            icon={<Gauge className="w-5 h-5" />}
            variant="amber"
            isAnalyzed={isAnalyzed}
          />
        </div>
      </section>

      {/* If analyzed: Top Duplicate Cluster Preview */}
      {isAnalyzed && clusters.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Top Identified Duplicate Group
              </h2>
              <p className="text-xs text-slate-400">
                Highest recoverable storage priority in this collection
              </p>
            </div>
            <button
              onClick={onOpenReports}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View Full Report
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-2xl glass-panel-glow border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                {clusters[0].images[0]?.dataUrl ? (
                  <img
                    src={clusters[0].images[0].dataUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">
                    Cluster #{clusters[0].clusterNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {clusters[0].highestSimilarity}% Match
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 capitalize">
                    {clusters[0].duplicateType} Duplicate
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Contains <strong className="text-white">{clusters[0].images.length} copies</strong> consuming{' '}
                  <strong className="text-white">{formatBytes(clusters[0].totalSize)}</strong>.
                </p>
                <p className="text-xs text-emerald-400 font-medium">
                  Potential savings: {formatBytes(clusters[0].recoverableSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onReviewCluster(clusters[0])}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Eye className="w-4 h-4" />
                Review Group
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Feature Pillars / Architecture Highlights */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Multi-Stage Computer Vision Engine
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Cryptographic SHA-256</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects bit-for-bit exact clones with 100% precision via native Web Crypto API,
              regardless of renamed files or mismatched folder paths.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Triple Perceptual Hash (pHash/dHash/aHash)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates 2D Discrete Cosine Transforms (DCT) and horizontal gradients. Detects identical
              visuals despite extreme JPEG compression, resizing, and color adjustments.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Visual Embeddings & Diff Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              64-D spatial gradient vectors handle cropped compositions. Interactive side-by-side,
              overlay slider, and pixel-subtraction canvas highlight exact differences.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Your images stay on your device</h4>
            <p className="text-xs text-slate-400">
              Image analysis is performed locally in your browser. Your images are never sent to a remote server.
            </p>
          </div>
        </div>
        <button
          onClick={onStartScan}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all cursor-pointer"
        >
          Start Scanning
        </button>
      </section>
    </div>
  );
};
