import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  Cpu, 
  Hash, 
  Layers, 
  Star, 
  SplitSquareVertical, 
  Activity
} from 'lucide-react';
import { ImageMetadata } from '../types/image';
import { DuplicateCluster } from '../types/cluster';
import { formatBytes } from '../services/storageCalculator';
import { Badge } from './common/Badge';

interface ImageDetailsModalProps {
  image: ImageMetadata;
  cluster?: DuplicateCluster;
  onClose: () => void;
  onCompareWithKeeper?: (image: ImageMetadata) => void;
}

export const ImageDetailsModal: React.FC<ImageDetailsModalProps> = ({
  image,
  cluster,
  onClose,
  onCompareWithKeeper,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isKeeper = cluster && cluster.recommendedKeepId === image.id;
  const duplicateType = cluster ? cluster.duplicateType : 'unique';
  const extension = (image.name.split('.').pop() || image.type || 'img').toUpperCase();

  // Convert binary hash string to formatted hex representation
  const binaryToHex = (bin?: string): string => {
    if (!bin || bin.length !== 64) return '—';
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = bin.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }
    return hex.toUpperCase();
  };

  const pHashHex = binaryToHex(image.pHash);
  const dHashHex = binaryToHex(image.dHash);
  const aHashHex = binaryToHex(image.aHash);

  // Calculate potential savings for this image if it's a redundant duplicate
  const potentialSavings = isKeeper ? 0 : image.size;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-3xl w-full rounded-3xl glass-panel border border-slate-700 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white truncate max-w-md" title={image.name}>
                {image.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Detailed Forensic Image Diagnostics</span>
                <span>•</span>
                <span className="text-slate-300 uppercase font-semibold">{extension}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Row: Preview & Core Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col items-center justify-center space-y-2 relative">
              <div className="max-h-56 w-full flex items-center justify-center overflow-hidden rounded-xl">
                {image.dataUrl ? (
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="max-h-52 max-w-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="h-44 w-full flex items-center justify-center text-slate-600">
                    No preview available
                  </div>
                )}
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {isKeeper && <Badge type="keeper" size="sm" />}
                <Badge type={duplicateType} size="sm" />
                {cluster && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                    Cluster #{cluster.clusterNumber.toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Core Specifications */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block">
                File & Dimension Profile
              </span>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/60">
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="font-semibold text-white">
                    {image.width} × {image.height} px
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Total Pixel Count:</span>
                  <span className="font-mono text-slate-200">
                    {(image.width * image.height).toLocaleString()} pixels
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Aspect Ratio:</span>
                  <span className="font-semibold text-indigo-300">
                    {image.aspectRatio}:1
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-semibold text-white">
                    {formatBytes(image.size)} ({image.size.toLocaleString()} bytes)
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">MIME Format:</span>
                  <span className="font-mono text-slate-200 uppercase">
                    {image.type || 'image/' + extension.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Cleanup Storage Impact:</span>
                  <span className={`font-bold ${isKeeper ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isKeeper ? '0 B (Protected Keeper)' : `${formatBytes(potentialSavings)} recoverable`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash (SHA-256) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                Cryptographic Signature (Exact SHA-256)
              </span>
              {image.sha256 && (
                <button
                  onClick={() => copyToClipboard(image.sha256!, 'sha256')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'sha256' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy SHA-256</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 break-all select-all">
              {image.sha256 || 'Pending or not calculated'}
            </div>
            <p className="text-[11px] text-slate-500">
              Web Crypto SHA-256 checksum provides bit-level verification for exact file duplicates.
            </p>
          </div>

          {/* Perceptual Hash Signatures (pHash, dHash, aHash) */}
          <div className="space-y-3">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Perceptual Fingerprints (64-Bit Resilient Hashes)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* pHash */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-300 text-xs">pHash (DCT 2D)</span>
                  <button
                    onClick={() => copyToClipboard(pHashHex, 'phash')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy hex"
                  >
                    {copiedField === 'phash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-200">0x{pHashHex}</p>
                <div className="p-1.5 rounded-lg bg-slate-950 font-mono text-[9px] text-slate-400 break-all leading-tight">
                  {image.pHash || '—'}
                </div>
                <span className="text-[10px] text-slate-500 block">Frequency spectrum low-band</span>
              </div>

              {/* dHash */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-300 text-xs">dHash (Gradient)</span>
                  <button
                    onClick={() => copyToClipboard(dHashHex, 'dhash')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy hex"
                  >
                    {copiedField === 'dhash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-200">0x{dHashHex}</p>
                <div className="p-1.5 rounded-lg bg-slate-950 font-mono text-[9px] text-slate-400 break-all leading-tight">
                  {image.dHash || '—'}
                </div>
                <span className="text-[10px] text-slate-500 block">Horizontal gradient differences</span>
              </div>

              {/* aHash */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-300 text-xs">aHash (Average)</span>
                  <button
                    onClick={() => copyToClipboard(aHashHex, 'ahash')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy hex"
                  >
                    {copiedField === 'ahash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-200">0x{aHashHex}</p>
                <div className="p-1.5 rounded-lg bg-slate-950 font-mono text-[9px] text-slate-400 break-all leading-tight">
                  {image.aHash || '—'}
                </div>
                <span className="text-[10px] text-slate-500 block">Mean intensity threshold</span>
              </div>
            </div>
          </div>

          {/* Visual Embedding & Color Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 64-D Visual Feature Vector */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Spatial Gradient Embedding Status
              </span>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Embedding Dimensions:</span>
                  <span className="font-mono text-white">64 features (16 regions × 4 channels)</span>
                </div>
                <div className="flex justify-between">
                  <span>Feature Extraction Filter:</span>
                  <span className="text-slate-200">Sobel (Dx, Dy) + Variance Pooling</span>
                </div>
                <div className="flex justify-between">
                  <span>Normalization:</span>
                  <span className="text-emerald-400 font-mono">Unit L2-Norm (Euclidean)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-semibold">
                    {image.embedding ? 'Calculated & Cached' : 'Not generated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Color Profile Distribution */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Color Profile Signature
              </span>
              <p className="text-[11px] text-slate-400">
                Normalized 64-bin RGB color distribution vector used for chromatic similarity.
              </p>
              {image.colorHistogram && image.colorHistogram.length > 0 ? (
                <div className="h-7 w-full bg-slate-950 rounded-lg p-1 flex items-end gap-0.5 overflow-hidden border border-slate-800">
                  {image.colorHistogram.slice(0, 32).map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.min(100, Math.max(10, val * 100))}%` }}
                      className="flex-1 bg-gradient-to-t from-indigo-600 to-purple-400 rounded-xs opacity-80"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">Color profile pending</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
          <div className="text-[11px] text-slate-400">
            {cluster ? (
              <span>Part of Cluster #{cluster.clusterNumber} ({cluster.images.length} images)</span>
            ) : (
              <span>Unique standalone image</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {cluster && cluster.images.length >= 2 && onCompareWithKeeper && (
              <button
                onClick={() => {
                  onClose();
                  onCompareWithKeeper(image);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Compare Side-by-Side</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
