import React from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  HardDrive, 
  CheckCircle2, 
  Eye, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { StorageReport } from '../types/report';
import { DuplicateCluster } from '../types/cluster';
import { formatBytes, exportReportAsCSV, exportReportAsJSON, downloadAuditReportHTML } from '../services/storageCalculator';
import { Badge } from './common/Badge';

interface ReportsViewProps {
  report: StorageReport | null;
  onReviewCluster: (cluster: DuplicateCluster) => void;
  onStartNewScan: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  report,
  onReviewCluster,
  onStartNewScan,
}) => {
  if (!report) {
    return (
      <div className="text-center py-20 px-4 space-y-4 max-w-md mx-auto">
        <div className="w-18 h-18 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
          <FileText className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-white">No Report Generated Yet</h3>
        <p className="text-xs text-slate-400">
          Run an image scan to compile a comprehensive Storage Optimization Report.
        </p>
        <button
          onClick={onStartNewScan}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
        >
          <span>Start Scan</span>
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const uniqueStorageBytes = Math.max(0, report.totalStorageBytes - report.duplicateStorageBytes);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Report Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Optimization Audit</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Storage Optimization Report
          </h2>
          <p className="text-xs text-slate-400">
            Generated on {report.scanDate} • Processing duration: {report.processingTimeSeconds}s
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadAuditReportHTML(report)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => exportReportAsCSV(report)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportReportAsJSON(report)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Images Analyzed</span>
          <p className="text-xl font-bold text-white">{report.totalImages.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500">{report.uniqueImages} unique</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Duplicate Groups</span>
          <p className="text-xl font-bold text-indigo-400">{report.duplicateGroups}</p>
          <span className="text-[10px] text-slate-500">{report.exactDuplicateGroups} exact / {report.nearDuplicateGroups} near</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Original Storage</span>
          <p className="text-xl font-bold text-white">{formatBytes(report.totalStorageBytes)}</p>
          <span className="text-[10px] text-slate-500">{formatBytes(report.duplicateStorageBytes)} duplicated</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-950/10 space-y-1">
          <span className="text-[11px] text-emerald-400 uppercase font-semibold">Recoverable Space</span>
          <p className="text-xl font-bold text-emerald-400">{formatBytes(report.recoverableStorageBytes)}</p>
          <span className="text-[10px] text-emerald-300/70">{report.savingsPercentage}% reduction</span>
        </div>
      </div>

      {/* Visual Chart: Unique Storage vs Duplicate Storage vs Recoverable Storage (Section 26) */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            Storage Allocation: Unique vs. Duplicate vs. Recoverable
          </h3>
          <span className="text-xs text-slate-400">{formatBytes(report.totalStorageBytes)} total</span>
        </div>

        <div className="h-6 w-full bg-slate-900 rounded-xl overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${Math.max(3, ((uniqueStorageBytes / (report.totalStorageBytes || 1)) * 100))}%` }}
            className="bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white"
            title={`Unique Storage: ${formatBytes(uniqueStorageBytes)}`}
          >
            Unique
          </div>
          <div
            style={{ width: `${Math.max(3, (((report.duplicateStorageBytes - report.recoverableStorageBytes) / (report.totalStorageBytes || 1)) * 100))}%` }}
            className="bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white"
            title={`Duplicate Keepers: ${formatBytes(report.duplicateStorageBytes - report.recoverableStorageBytes)}`}
          >
            Keepers
          </div>
          <div
            style={{ width: `${Math.max(3, ((report.recoverableStorageBytes / (report.totalStorageBytes || 1)) * 100))}%` }}
            className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950"
            title={`Recoverable Storage: ${formatBytes(report.recoverableStorageBytes)}`}
          >
            Recoverable
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Unique Storage</span>
              <span className="font-bold text-white">{formatBytes(uniqueStorageBytes)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Retained Keepers</span>
              <span className="font-bold text-white">{formatBytes(report.duplicateStorageBytes - report.recoverableStorageBytes)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Recoverable Waste</span>
              <span className="font-bold text-emerald-400">{formatBytes(report.recoverableStorageBytes)}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Format Breakdown Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" />
          Image Format Distribution
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(report.formatBreakdown).map(([fmt, data]) => (
            <div key={fmt} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-indigo-300 uppercase">{fmt}</span>
              <p className="text-base font-bold text-white">{formatBytes(data.bytes)}</p>
              <p className="text-[11px] text-slate-400">{data.count} images</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Duplicate Clusters Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Top Redundant Duplicate Clusters
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Cluster</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Copies</th>
                <th className="p-3">Type</th>
                <th className="p-3">Similarity</th>
                <th className="p-3">Storage</th>
                <th className="p-3">Potential Savings</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {report.clusters.slice(0, 10).map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-white">Cluster #{c.clusterNumber}</td>
                  <td className="p-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                      {c.images[0]?.dataUrl ? (
                        <img src={c.images[0].dataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{c.images.length} images</td>
                  <td className="p-3">
                    <Badge type={c.duplicateType} size="sm" />
                  </td>
                  <td className="p-3 font-mono font-semibold text-indigo-400">
                    {c.averageSimilarity}%
                  </td>
                  <td className="p-3">{formatBytes(c.totalSize)}</td>
                  <td className="p-3 font-bold text-emerald-400">
                    {formatBytes(c.recoverableSize)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onReviewCluster(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all cursor-pointer"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
