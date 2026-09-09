import React from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Zap, 
  Layers, 
  XCircle, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { AnalysisProgress } from '../types/analysis';

interface AnalysisPipelineProps {
  progress: AnalysisProgress;
  onCancel: () => void;
}

export const AnalysisPipeline: React.FC<AnalysisPipelineProps> = ({ progress, onCancel }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-3xl glass-panel border border-indigo-500/20 shadow-2xl">
      {/* Title & Status */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span>Local Client-Side Processing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analyzing Your Image Collection
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {progress.currentOperation}
        </p>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300">Overall Progress</span>
          <span className="text-indigo-400 text-sm font-extrabold">
            {progress.overallProgress}%
          </span>
        </div>
        <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 shadow-md shadow-indigo-500/50"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Metrics Row: Speed, ETA, Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
            Images Analyzed
          </span>
          <span className="text-base font-bold text-white mt-0.5 block">
            {progress.itemsProcessed.toLocaleString()} / {progress.totalItems.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Processing Speed
          </span>
          <span className="text-base font-bold text-white mt-0.5 block">
            {progress.processingSpeed > 0 ? `${progress.processingSpeed} images/sec` : 'Calculating...'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            Estimated Remaining
          </span>
          <span className="text-base font-bold text-white mt-0.5 block">
            {progress.estimatedRemainingSeconds > 0 ? `${progress.estimatedRemainingSeconds} seconds` : 'Finalizing...'}
          </span>
        </div>
      </div>

      {/* Stage Checklist */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Pipeline Stages
        </span>
        <div className="space-y-2 rounded-2xl bg-slate-950/50 p-4 border border-slate-800/80">
          {progress.stages.map((stg) => (
            <div
              key={stg.stage}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                stg.active
                  ? 'bg-indigo-950/40 border border-indigo-500/30 text-white font-medium'
                  : stg.completed
                  ? 'text-slate-300 bg-slate-900/30'
                  : 'text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {stg.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : stg.active ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span>{stg.label}</span>
              </div>

              {stg.active && (
                <span className="text-indigo-400 font-bold text-[11px]">
                  {stg.progress}%
                </span>
              )}
              {stg.completed && (
                <span className="text-emerald-400 text-[11px] font-semibold">
                  Done
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Button & Privacy Note */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>No image data leaves your computer</span>
        </div>

        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          Cancel Scan
        </button>
      </div>
    </div>
  );
};
