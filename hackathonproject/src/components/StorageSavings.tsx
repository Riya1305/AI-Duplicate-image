import React, { useState } from 'react';
import { 
  HardDrive, 
  Trash2, 
  Download, 
  FileCheck2, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DuplicateCluster } from '../types/cluster';
import { StorageReport } from '../types/report';
import { formatBytes, exportReportAsCSV, exportReportAsJSON, downloadAuditReportHTML } from '../services/storageCalculator';

interface StorageSavingsProps {
  report: StorageReport | null;
  clusters: DuplicateCluster[];
  onApplyCleanup: (clusterId?: string) => void;
  onReviewCluster: (cluster: DuplicateCluster) => void;
}

export const StorageSavings: React.FC<StorageSavingsProps> = ({
  report,
  clusters,
  onApplyCleanup,
  onReviewCluster,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cleanupFinished, setCleanupFinished] = useState(false);

  if (!report || clusters.length === 0) {
    return (
      <div className="text-center py-20 px-4 space-y-4 max-w-md mx-auto">
        <div className="w-18 h-18 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
          <HardDrive className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-white">No Storage Optimization Data</h3>
        <p className="text-xs text-slate-400">
          Run an image scan first to calculate recoverable disk space and duplicate redundancies.
        </p>
      </div>
    );
  }

  // Calculate totals from current cluster selections
  let totalSelectedFiles = 0;
  let totalSelectedRecoverableBytes = 0;

  clusters.forEach((c) => {
    totalSelectedFiles += c.selectedForCleanup.length;
    c.images.forEach((img) => {
      if (c.selectedForCleanup.includes(img.id)) {
        totalSelectedRecoverableBytes += img.size;
      }
    });
  });

  const handleConfirmCleanup = () => {
    onApplyCleanup(); // clears all selected duplicates across all clusters
    setShowConfirmModal(false);
    setCleanupFinished(true);

    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#a855f7'],
    });

    setTimeout(() => {
      setCleanupFinished(false);
    }, 4000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Large Visual Savings Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-indigo-950/40 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Storage Optimization Potential
            </span>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                You could save{' '}
                <span className="text-emerald-400">
                  {formatBytes(report.recoverableStorageBytes)}
                </span>
              </h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                By keeping the highest quality original in each duplicate cluster and removing
                redundant copies, you reclaim{' '}
                <strong className="text-white">{report.savingsPercentage}%</strong> of your total analyzed storage.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={totalSelectedFiles === 0}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Review & Execute Cleanup</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Safe workflow • No automatic forced deletions
            </span>
          </div>
        </div>
      </div>

      {/* Storage Breakdown Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Storage</span>
          <p className="text-2xl font-bold text-white">{formatBytes(report.totalStorageBytes)}</p>
          <span className="text-[11px] text-slate-500">{report.totalImages.toLocaleString()} images scanned</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duplicate Storage</span>
          <p className="text-2xl font-bold text-indigo-400">{formatBytes(report.duplicateStorageBytes)}</p>
          <span className="text-[11px] text-slate-500">{report.duplicateImages} duplicate copies</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 bg-emerald-950/10 space-y-1">
          <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Recoverable Storage</span>
          <p className="text-2xl font-bold text-emerald-400">{formatBytes(report.recoverableStorageBytes)}</p>
          <span className="text-[11px] text-emerald-300/70">{report.duplicateGroups} duplicate clusters</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Wasted Percentage</span>
          <p className="text-2xl font-bold text-amber-400">{report.savingsPercentage}%</p>
          <span className="text-[11px] text-slate-500">Of total disk consumption</span>
        </div>
      </div>

      {/* Storage Proportions Visual Stacked Bar */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            Storage Proportions Breakdown
          </h3>
          <span className="text-xs text-slate-400">
            {formatBytes(report.totalStorageBytes)} total
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="h-6 w-full bg-slate-900 rounded-xl overflow-hidden flex border border-slate-800">
          {/* Unique & Keeper storage */}
          <div
            style={{ width: `${Math.max(2, 100 - report.savingsPercentage)}%` }}
            className="bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white"
            title={`Retained Storage: ${100 - report.savingsPercentage}%`}
          >
            {100 - report.savingsPercentage > 15 && `Retained (${100 - report.savingsPercentage}%)`}
          </div>

          {/* Recoverable space */}
          <div
            style={{ width: `${Math.max(2, report.savingsPercentage)}%` }}
            className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950"
            title={`Recoverable Space: ${report.savingsPercentage}%`}
          >
            {report.savingsPercentage > 10 && `Recoverable (${report.savingsPercentage}%)`}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
            <span>Retained Images ({formatBytes(report.totalStorageBytes - report.recoverableStorageBytes)})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Recoverable Duplicates ({formatBytes(report.recoverableStorageBytes)})</span>
          </div>
        </div>
      </div>

      {/* Export Reports Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Optimization Reports</h4>
          <p className="text-xs text-slate-400">Download complete duplicate clusters inventory for audit or backup</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadAuditReportHTML(report)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => exportReportAsCSV(report)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportReportAsJSON(report)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl glass-panel border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Clean-up Execution</h3>
                <p className="text-xs text-slate-400">Safe duplicate space optimization</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Files to clean:</span>
                <span className="font-bold text-white">{totalSelectedFiles} duplicate copies</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage to reclaim:</span>
                <span className="font-bold text-emerald-400">{formatBytes(totalSelectedRecoverableBytes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Files retained:</span>
                <span className="font-bold text-white">All recommended keepers preserved</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This action safely clears redundant duplicates from your current analysis session and
              updates your storage calculations. Local disk files are protected and not permanently
              erased without explicit OS permissions.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmCleanup}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirm & Clean
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {cleanupFinished && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Cleanup completed successfully! Duplicate groups updated.</span>
        </div>
      )}
    </div>
  );
};
