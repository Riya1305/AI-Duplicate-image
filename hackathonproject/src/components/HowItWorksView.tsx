import React from 'react';
import { 
  UploadCloud, 
  Fingerprint, 
  Cpu, 
  Layers, 
  SplitSquareVertical, 
  HardDrive, 
  CheckCircle2, 
  Sparkles, 
  Code, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const HowItWorksView: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload & Ingest',
      desc: 'Add images via drag-and-drop, individual files, whole folders, or ZIP archives. Unpacking and validation happen in-memory.',
      icon: <UploadCloud className="w-5 h-5 text-indigo-400" />,
    },
    {
      num: '02',
      title: 'Dual Fingerprint',
      desc: 'Computes cryptographic SHA-256 for exact bit-level matches alongside 64-bit perceptual hashes (pHash, dHash, aHash).',
      icon: <Fingerprint className="w-5 h-5 text-purple-400" />,
    },
    {
      num: '03',
      title: 'Visual Feature Embedding',
      desc: 'Applies 2D Discrete Cosine Transforms (DCT) and multi-scale Sobel spatial gradients to extract rotation- and crop-resilient embeddings.',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    },
    {
      num: '04',
      title: 'Hybrid Clustering',
      desc: 'Evaluates pairwise Hamming distances and Cosine similarities through a Disjoint-Set (Union-Find) algorithm to form structured duplicate clusters.',
      icon: <Layers className="w-5 h-5 text-amber-400" />,
    },
    {
      num: '05',
      title: 'Visual Difference Studio',
      desc: 'Inspect duplicate candidates using Side-by-Side zoom, Alpha-Overlay slider, Neon Pixel-Difference canvas, and Flicker mode.',
      icon: <SplitSquareVertical className="w-5 h-5 text-indigo-400" />,
    },
    {
      num: '06',
      title: 'Storage Optimization',
      desc: 'The AI Keep Advisor identifies the highest resolution master file and computes exact recoverable storage before safe export or cleanup.',
      icon: <HardDrive className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-12">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Computer Vision Methodology</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How AI Duplicate Image Finder Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          A multi-tiered perceptual computer vision pipeline executing entirely client-side for zero-latency, private duplicate detection.
        </p>
      </div>

      {/* 6-Step Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((step) => (
          <div key={step.num} className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3 relative group">
            <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-900/60 transition-colors font-mono absolute top-4 right-5 pointer-events-none">
              {step.num}
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
              {step.icon}
            </div>
            <h3 className="font-bold text-white text-base">{step.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Deep Dive Computer Vision Algorithms */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <div className="flex items-center gap-2.5">
          <Code className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Mathematical Fingerprinting Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-indigo-300 text-sm">1. Discrete Cosine Transform (pHash)</h4>
            <p className="text-slate-400 leading-relaxed">
              Images are downsampled to a normalized 32×32 grayscale matrix. A 2D-DCT decomposes the pixel intensities into spatial frequency coefficients:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-indigo-300 overflow-x-auto">
              D(u, v) = α(u)α(v) ∑ ∑ M(x,y) cos((2x+1)uπ / 2N) cos((2y+1)vπ / 2N)
            </div>
            <p className="text-slate-400 leading-relaxed">
              The top-left 8×8 lowest frequencies (which carry the visual structure and contrast) are extracted. Each coefficient is thresholded against the median to yield a 64-bit signature invariant to resizing and JPEG compression.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-purple-300 text-sm">2. Difference Gradient (dHash) & aHash</h4>
            <p className="text-slate-400 leading-relaxed">
              dHash resizes the image to 9×8 grayscale and tracks horizontal gradient changes across adjacent pixels:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-purple-300 overflow-x-auto">
              bit(x, y) = 1 if Pixel(x, y) &gt; Pixel(x + 1, y) else 0
            </div>
            <p className="text-slate-400 leading-relaxed">
              This measures relative luminosity gradients rather than absolute values, providing exceptional resilience to brightness shifts, gamma shifts, and contrast filters.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-emerald-300 text-sm">3. Hamming Distance Metric</h4>
            <p className="text-slate-400 leading-relaxed">
              Between any two 64-bit signatures (A and B), the Hamming distance counts bit positions where A and B disagree:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto">
              Hamming(A, B) = popcount(A ⊕ B)
            </div>
            <p className="text-slate-400 leading-relaxed">
              A distance of 0–5 indicates near-certain identity; 6–10 indicates severe resizing or compression; 19+ confirms distinct scenes.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-amber-300 text-sm">4. Spatial Feature Embeddings & Cosine Sim</h4>
            <p className="text-slate-400 leading-relaxed">
              Images are partitioned into 16 spatial cells. Local texture energy and Sobel edge derivatives (Dx, Dy) are gathered into a 64-D unit vector:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-amber-300 overflow-x-auto">
              CosineSim(u, v) = (u · v) / (||u|| ||v||)
            </div>
            <p className="text-slate-400 leading-relaxed">
              This detects cropped frames, aspect ratio modifications, and subtle regional edits that simple downsampling might obscure.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Architecture Flow Diagram */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-400" />
          Technical System Architecture
        </h3>

        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto font-mono text-xs text-slate-300">
          <div className="min-w-[650px] space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-indigo-300 font-bold text-center">
              React 19 + TypeScript Presentation Layer (Dashboard, Workspace, Difference Studio)
            </div>
            <div className="text-center text-slate-600">↓</div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-emerald-300 font-bold text-center">
              File Ingestion & Normalization Layer (JSZip, Canvas API, Thumbnail Cache)
            </div>
            <div className="text-center text-slate-600">↓</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center text-[11px]">
                Exact SHA-256 Engine
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center text-[11px]">
                Perceptual pHash / dHash / aHash
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center text-[11px]">
                64-D Visual Embedding Engine
              </div>
            </div>
            <div className="text-center text-slate-600">↓</div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-purple-300 font-bold text-center">
              Hybrid Weighted Similarity & Union-Find Clustering Engine
            </div>
            <div className="text-center text-slate-600">↓</div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-amber-300 font-bold text-center">
              Storage Savings Calculator, Smart Keep Advisor, CSV/JSON Exporter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
