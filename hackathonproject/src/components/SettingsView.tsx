import React from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Sliders, 
  Cpu, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ScanConfig, DEFAULT_SCAN_CONFIG } from '../types/analysis';

interface SettingsViewProps {
  config: ScanConfig;
  onUpdateConfig: (config: ScanConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdateConfig }) => {
  const handleReset = () => {
    onUpdateConfig(DEFAULT_SCAN_CONFIG);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            Detection & Algorithm Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune computer-vision thresholds, perceptual sensitivities, and signal weightings
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Threshold Sliders */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Classification Cutoffs & Sensitivity
        </h3>

        <div className="space-y-5 text-xs">
          {/* Near Duplicate Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300">Near Duplicate Threshold</span>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {config.nearDuplicateThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="75"
              max="98"
              value={config.nearDuplicateThreshold}
              onChange={(e) =>
                onUpdateConfig({ ...config, nearDuplicateThreshold: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Pairs with similarity at or above this score are grouped as near duplicates. Recommended: 88%–92%.
            </p>
          </div>

          {/* Similar Image Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300">Similar Content Threshold</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {config.similarThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              value={config.similarThreshold}
              onChange={(e) =>
                onUpdateConfig({ ...config, similarThreshold: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Images with visual similarity in this range are flagged as similar content. Recommended: 68%–72%.
            </p>
          </div>

          {/* Hamming Distance Cutoff */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300">pHash Max Bit Distance</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ≤ {config.pHashMaxDistance} bits
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={config.pHashMaxDistance}
              onChange={(e) =>
                onUpdateConfig({ ...config, pHashMaxDistance: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              0–5 bits: Very likely duplicate • 6–10 bits: Highly similar • 11–18 bits: Possibly similar.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Weights */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Hybrid Similarity Signal Weights
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300">pHash (DCT 2D) Weight:</span>
              <span className="font-mono font-bold text-indigo-400">{Math.round(config.pHashWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={config.pHashWeight}
              onChange={(e) => onUpdateConfig({ ...config, pHashWeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300">dHash (Gradient) Weight:</span>
              <span className="font-mono font-bold text-indigo-400">{Math.round(config.dHashWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={config.dHashWeight}
              onChange={(e) => onUpdateConfig({ ...config, dHashWeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300">Color Histogram Weight:</span>
              <span className="font-mono font-bold text-emerald-400">{Math.round(config.colorWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={config.colorWeight}
              onChange={(e) => onUpdateConfig({ ...config, colorWeight: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300">Aspect Ratio Weight:</span>
              <span className="font-mono font-bold text-purple-400">{Math.round(config.aspectRatioWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={config.aspectRatioWeight}
              onChange={(e) => onUpdateConfig({ ...config, aspectRatioWeight: Number(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          Engine Feature Toggles
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-white block">Exact Cryptographic Matching (SHA-256)</span>
              <span className="text-[11px] text-slate-400">Instantly groups 100% byte-for-byte identical images</span>
            </div>
            <input
              type="checkbox"
              checked={config.exactSha256Enabled}
              onChange={(e) => onUpdateConfig({ ...config, exactSha256Enabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-white block">Visual Embeddings & Spatial Gradients</span>
              <span className="text-[11px] text-slate-400">Multi-scale spatial Sobel gradient pooling for cropped image robustness</span>
            </div>
            <input
              type="checkbox"
              checked={config.cnnEmbeddingsEnabled}
              onChange={(e) => onUpdateConfig({ ...config, cnnEmbeddingsEnabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
