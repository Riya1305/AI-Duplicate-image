import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sliders, 
  Layers, 
  Sparkles, 
  Flame, 
  Activity, 
  Info,
  Star
} from 'lucide-react';
import { ImageMetadata } from '../types/image';
import { calculateHammingDistance, hammingToSimilarity } from '../services/perceptualHash';
import { calculateColorSimilarity } from '../services/colorProfiler';
import { calculateCosineSimilarity } from '../services/embeddingService';
import { formatBytes } from '../services/storageCalculator';
import { SimilarityGauge } from './common/SimilarityGauge';

export type ComparisonMode = 'side-by-side' | 'overlay' | 'difference' | 'flicker';

interface ComparisonViewerProps {
  imageA: ImageMetadata;
  imageB: ImageMetadata;
  onClose: () => void;
  recommendedKeepId?: string;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  imageA: initialA,
  imageB: initialB,
  onClose,
  recommendedKeepId,
}) => {
  const [imageA, setImageA] = useState<ImageMetadata>(initialA);
  const [imageB, setImageB] = useState<ImageMetadata>(initialB);
  const [mode, setMode] = useState<ComparisonMode>('side-by-side');

  // Interactive controls
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(50); // 0 to 100
  const [flickerActiveImg, setFlickerActiveImg] = useState<'A' | 'B'>('A');
  const [flickerSpeed, setFlickerSpeed] = useState(300); // ms
  const [showMetadata, setShowMetadata] = useState(true);

  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  // Swap images
  const handleSwap = () => {
    const temp = imageA;
    setImageA(imageB);
    setImageB(temp);
  };

  // Flicker interval timer
  useEffect(() => {
    if (mode !== 'flicker') return;
    const interval = setInterval(() => {
      setFlickerActiveImg((prev) => (prev === 'A' ? 'B' : 'A'));
    }, flickerSpeed);
    return () => clearInterval(interval);
  }, [mode, flickerSpeed]);

  // Compute live metrics between Image A and Image B
  const pHashDist = imageA.pHash && imageB.pHash
    ? calculateHammingDistance(imageA.pHash, imageB.pHash)
    : 0;
  const pHashSim = hammingToSimilarity(pHashDist);

  const dHashDist = imageA.dHash && imageB.dHash
    ? calculateHammingDistance(imageA.dHash, imageB.dHash)
    : 0;

  const aHashDist = imageA.aHash && imageB.aHash
    ? calculateHammingDistance(imageA.aHash, imageB.aHash)
    : 0;

  const colorSim = calculateColorSimilarity(imageA.colorHistogram, imageB.colorHistogram);
  const embSim = calculateCosineSimilarity(imageA.embedding, imageB.embedding);

  const isExact = Boolean(imageA.sha256 && imageB.sha256 && imageA.sha256 === imageB.sha256);
  const overallSimilarity = isExact
    ? 100
    : Math.round((pHashSim * 0.45 + hammingToSimilarity(dHashDist) * 0.25 + colorSim * 0.15 + embSim * 0.15) * 10) / 10;

  // Render pixel difference onto canvas
  useEffect(() => {
    if (mode !== 'difference' || !diffCanvasRef.current) return;

    const canvas = diffCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgElA = new Image();
    const imgElB = new Image();
    imgElA.crossOrigin = 'anonymous';
    imgElB.crossOrigin = 'anonymous';

    let loaded = 0;
    const onImgLoad = () => {
      loaded++;
      if (loaded === 2) {
        const targetW = 600;
        const targetH = 400;
        canvas.width = targetW;
        canvas.height = targetH;

        // Draw image A to offscreen canvas
        const cA = document.createElement('canvas');
        cA.width = targetW;
        cA.height = targetH;
        const ctxA = cA.getContext('2d')!;
        ctxA.drawImage(imgElA, 0, 0, targetW, targetH);
        const dataA = ctxA.getImageData(0, 0, targetW, targetH).data;

        // Draw image B to offscreen canvas
        const cB = document.createElement('canvas');
        cB.width = targetW;
        cB.height = targetH;
        const ctxB = cB.getContext('2d')!;
        ctxB.drawImage(imgElB, 0, 0, targetW, targetH);
        const dataB = ctxB.getImageData(0, 0, targetW, targetH).data;

        // Compute amplified pixel delta
        const diffImgData = ctx.createImageData(targetW, targetH);
        const dData = diffImgData.data;

        for (let i = 0; i < dataA.length; i += 4) {
          const dr = Math.abs(dataA[i] - dataB[i]);
          const dg = Math.abs(dataA[i + 1] - dataB[i + 1]);
          const db = Math.abs(dataA[i + 2] - dataB[i + 2]);
          const delta = (dr + dg + db) / 3;

          if (delta < 8) {
            // Unchanged pixel: dim grayscale backdrop
            const gray = Math.round(0.299 * dataA[i] + 0.587 * dataA[i + 1] + 0.114 * dataA[i + 2]) * 0.25;
            dData[i] = gray;
            dData[i + 1] = gray;
            dData[i + 2] = gray;
            dData[i + 3] = 255;
          } else {
            // Amplified neon heat highlights for differences (cropping, color change, edits)
            dData[i] = Math.min(255, dr * 3 + 120); // vibrant red/orange
            dData[i + 1] = Math.min(255, dg * 2);
            dData[i + 2] = 20;
            dData[i + 3] = 255;
          }
        }

        ctx.putImageData(diffImgData, 0, 0);
      }
    };

    imgElA.onload = onImgLoad;
    imgElB.onload = onImgLoad;

    imgElA.src = imageA.dataUrl || (imageA.file ? URL.createObjectURL(imageA.file) : '');
    imgElB.src = imageB.dataUrl || (imageB.file ? URL.createObjectURL(imageB.file) : '');
  }, [mode, imageA, imageB]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070a12]/95 backdrop-blur-lg flex flex-col">
      {/* Top Navbar */}
      <div className="h-16 px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Visual Comparison & Difference Studio</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Examining visual anomalies, compression, and cropping differences
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'side-by-side' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>

          <button
            onClick={() => setMode('overlay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'overlay' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overlay
          </button>

          <button
            onClick={() => setMode('difference')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'difference' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pixel Difference
          </button>

          <button
            onClick={() => setMode('flicker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'flicker' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flicker
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Fit to screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSwap}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Swap Image A and Image B"
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Swap</span>
          </button>

          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-2 rounded-xl border transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
              showMetadata
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Metadata</span>
          </button>
        </div>
      </div>

      {/* Interactive Mode Toolbars */}
      {mode === 'overlay' && (
        <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-center gap-4 text-xs">
          <span className="text-slate-400 font-medium">Image A (0%)</span>
          <input
            type="range"
            min="0"
            max="100"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-64 accent-indigo-500 cursor-pointer"
          />
          <span className="text-slate-400 font-medium">Image B (100%)</span>
          <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            {overlayOpacity}% Opacity
          </span>
        </div>
      )}

      {mode === 'flicker' && (
        <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-center gap-4 text-xs">
          <span className="text-slate-400">Alternation Speed:</span>
          <input
            type="range"
            min="100"
            max="800"
            step="50"
            value={flickerSpeed}
            onChange={(e) => setFlickerSpeed(Number(e.target.value))}
            className="w-48 accent-indigo-500 cursor-pointer"
          />
          <span className="font-mono text-slate-300 font-semibold">{flickerSpeed} ms</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
            Showing Image {flickerActiveImg}
          </span>
        </div>
      )}

      {mode === 'difference' && (
        <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-300">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            Pixel Delta Amplification: <strong className="text-amber-400">Neon heat-map</strong> highlights cropped areas, compression artifacts, and edits. Dim areas are visually identical.
          </span>
        </div>
      )}

      {/* Main Workspace Canvas Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Visual Content Display */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#070a12] select-none">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 ease-out max-w-full"
          >
            {/* 1. Side-by-Side Mode */}
            {mode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl">
                {/* Image A */}
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-indigo-400 uppercase tracking-wider">Image A</span>
                    {imageA.id === recommendedKeepId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        <Star className="w-3 h-3 fill-amber-400" /> Recommended to Keep
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl max-h-[500px] flex items-center justify-center">
                    <img
                      src={imageA.dataUrl || (imageA.file ? URL.createObjectURL(imageA.file) : '')}
                      alt={imageA.name}
                      className="max-h-[460px] max-w-full object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{imageA.name}</p>
                </div>

                {/* Image B */}
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-purple-400 uppercase tracking-wider">Image B</span>
                    {imageB.id === recommendedKeepId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        <Star className="w-3 h-3 fill-amber-400" /> Recommended to Keep
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl max-h-[500px] flex items-center justify-center">
                    <img
                      src={imageB.dataUrl || (imageB.file ? URL.createObjectURL(imageB.file) : '')}
                      alt={imageB.name}
                      className="max-h-[460px] max-w-full object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{imageB.name}</p>
                </div>
              </div>
            )}

            {/* 2. Overlay Mode */}
            {mode === 'overlay' && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl max-w-2xl">
                {/* Base Image A */}
                <img
                  src={imageA.dataUrl || (imageA.file ? URL.createObjectURL(imageA.file) : '')}
                  alt={imageA.name}
                  className="max-h-[520px] max-w-full object-contain rounded-xl block"
                />
                {/* Top Image B with opacity */}
                <img
                  src={imageB.dataUrl || (imageB.file ? URL.createObjectURL(imageB.file) : '')}
                  alt={imageB.name}
                  style={{ opacity: overlayOpacity / 100 }}
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain rounded-xl transition-opacity duration-75 pointer-events-none"
                />
              </div>
            )}

            {/* 3. Difference View Mode */}
            {mode === 'difference' && (
              <div className="space-y-3 text-center">
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl inline-block">
                  <canvas ref={diffCanvasRef} className="max-h-[500px] max-w-full rounded-xl block" />
                </div>
                <p className="text-xs text-slate-400">
                  Amplified Pixel Delta (RGB difference amplified 3×). Highlights cropping borders and compression loss.
                </p>
              </div>
            )}

            {/* 4. Flicker Mode */}
            {mode === 'flicker' && (
              <div className="space-y-3 text-center">
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl max-w-2xl mx-auto">
                  <img
                    src={
                      flickerActiveImg === 'A'
                        ? imageA.dataUrl || (imageA.file ? URL.createObjectURL(imageA.file) : '')
                        : imageB.dataUrl || (imageB.file ? URL.createObjectURL(imageB.file) : '')
                    }
                    alt="Flicker display"
                    className="max-h-[520px] max-w-full object-contain rounded-xl block"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Alternating image {flickerActiveImg}: {flickerActiveImg === 'A' ? imageA.name : imageB.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Deep Metadata & Signature Diagnostics */}
        {showMetadata && (
          <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/90 p-5 overflow-y-auto space-y-6 shrink-0">
            {/* Overall Similarity Gauge */}
            <div className="text-center p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Visual Similarity Score
              </span>
              <div className="flex justify-center">
                <SimilarityGauge score={overallSimilarity} size={90} strokeWidth={8} />
              </div>
              <p className="text-xs text-slate-300">
                {isExact
                  ? 'Identical SHA-256 binary hash'
                  : overallSimilarity >= 90
                  ? 'Likely same image with resizing or compression'
                  : overallSimilarity >= 75
                  ? 'Visually related with crop or edits'
                  : 'Distinct images'}
              </p>
            </div>

            {/* Signal-by-Signal Breakdown */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Feature Breakdown
              </span>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">pHash (DCT 8×8):</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {pHashSim}% ({pHashDist} bits diff)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">dHash (Gradient):</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {hammingToSimilarity(dHashDist)}% ({dHashDist} bits diff)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">aHash (Average):</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {hammingToSimilarity(aHashDist)}% ({aHashDist} bits diff)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Color Histogram:</span>
                  <span className="font-mono font-bold text-emerald-400">{colorSim}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Spatial Embedding:</span>
                  <span className="font-mono font-bold text-purple-400">{embSim}%</span>
                </div>
              </div>
            </div>

            {/* Side-by-side spec comparison table */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Image Attributes Comparison
              </span>

              <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-slate-900/90 p-2 font-semibold text-slate-400 border-b border-slate-800 text-[11px]">
                  <span>Metric</span>
                  <span className="text-indigo-400 truncate">Image A</span>
                  <span className="text-purple-400 truncate">Image B</span>
                </div>

                <div className="grid grid-cols-3 p-2 border-b border-slate-800/60 text-slate-300">
                  <span className="text-slate-500">Dimensions</span>
                  <span>{imageA.width}×{imageA.height}</span>
                  <span>{imageB.width}×{imageB.height}</span>
                </div>

                <div className="grid grid-cols-3 p-2 border-b border-slate-800/60 text-slate-300">
                  <span className="text-slate-500">File Size</span>
                  <span>{formatBytes(imageA.size)}</span>
                  <span>{formatBytes(imageB.size)}</span>
                </div>

                <div className="grid grid-cols-3 p-2 border-b border-slate-800/60 text-slate-300">
                  <span className="text-slate-500">Aspect Ratio</span>
                  <span>{imageA.aspectRatio}:1</span>
                  <span>{imageB.aspectRatio}:1</span>
                </div>

                <div className="grid grid-cols-3 p-2 text-slate-300">
                  <span className="text-slate-500">Format</span>
                  <span className="uppercase">{imageA.name.split('.').pop() || imageA.type}</span>
                  <span className="uppercase">{imageB.name.split('.').pop() || imageB.type}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
