import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  ShieldAlert, 
  Zap, 
  X, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadWorkspace } from './components/UploadWorkspace';
import { AnalysisPipeline } from './components/AnalysisPipeline';
import { ClustersView } from './components/ClustersView';
import { ClusterDetailModal } from './components/ClusterDetailModal';
import { ImageDetailsModal } from './components/ImageDetailsModal';
import { ComparisonViewer } from './components/ComparisonViewer';
import { StorageSavings } from './components/StorageSavings';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { useImageAnalysis } from './hooks/useImageAnalysis';
import { generateDemoDataset } from './services/demoDataService';
import { DuplicateCluster } from './types/cluster';
import { ImageMetadata } from './types/image';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedClusterForReview, setSelectedClusterForReview] = useState<DuplicateCluster | null>(null);
  const [selectedImageForDetails, setSelectedImageForDetails] = useState<{
    image: ImageMetadata;
    cluster?: DuplicateCluster;
  } | null>(null);
  const [comparisonPair, setComparisonPair] = useState<{
    imageA: ImageMetadata;
    imageB: ImageMetadata;
    recommendedKeepId?: string;
  } | null>(null);

  const [isDemoDatasetActive, setIsDemoDatasetActive] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = window.localStorage.getItem('duplicate-finder-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  const {
    config,
    setConfig,
    stage,
    progress,
    images,
    clusters,
    report,
    isScanning,
    startScan,
    cancelScan,
    resetScan,
    toggleCleanupSelection,
    applyCleanup,
  } = useImageAnalysis();

  // Navigate to duplicate clusters automatically upon scan completion if duplicates found
  useEffect(() => {
    if (stage === 'complete') {
      if (clusters.length > 0) {
        setActiveTab('clusters');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [stage, clusters.length]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('duplicate-finder-theme', theme);
  }, [theme]);

  const handleStartScan = (files: File[], fileHandles?: Map<string, FileSystemFileHandle>) => {
    setIsDemoDatasetActive(false);
    setActiveTab('analyze');
    startScan(files, fileHandles);
  };

  const handleTryDemo = async () => {
    setIsDemoDatasetActive(true);
    setActiveTab('analyze');
    try {
      const demoFiles = await generateDemoDataset();
      startScan(demoFiles);
    } catch (err) {
      console.error('Failed to generate demo dataset:', err);
    }
  };

  const handleReviewCluster = (cluster: DuplicateCluster) => {
    setSelectedClusterForReview(cluster);
  };

  const handleCompareCluster = (cluster: DuplicateCluster) => {
    if (cluster.images.length < 2) return;
    const keeper = cluster.images.find((img) => img.id === cluster.recommendedKeepId) || cluster.images[0];
    const other = cluster.images.find((img) => img.id !== keeper.id) || cluster.images[1];
    setComparisonPair({
      imageA: keeper,
      imageB: other,
      recommendedKeepId: cluster.recommendedKeepId,
    });
  };

  const handleCompareTwo = (imgA: ImageMetadata, imgB: ImageMetadata) => {
    setComparisonPair({
      imageA: imgA,
      imageB: imgB,
      recommendedKeepId: selectedClusterForReview?.recommendedKeepId,
    });
  };

  const handleClearAnalysisData = () => {
    resetScan();
    setIsDemoDatasetActive(false);
    setSelectedClusterForReview(null);
    setSelectedImageForDetails(null);
    setComparisonPair(null);
    setShowClearConfirmModal(false);
    setActiveTab('dashboard');
  };

  const activeSelectedCluster = selectedClusterForReview
    ? clusters.find((cluster) => cluster.id === selectedClusterForReview.id) || null
    : null;

  return (
    <div className={`min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white theme-${theme}`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clusterCount={clusters.length}
        hasData={images.length > 0}
        onClearData={() => setShowClearConfirmModal(true)}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        onNewScan={() => {
          setIsDemoDatasetActive(false);
          resetScan();
          setActiveTab('analyze');
        }}
      />

      {/* Demo Benchmark Dataset Banner (when demo data is loaded) */}
      {isDemoDatasetActive && !isScanning && images.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-indigo-950/40 to-slate-900 border-b border-amber-500/25 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Demo Benchmark Dataset Active</strong>: Procedurally generated in-browser canvas images
                demonstrating exact bit-copies, heavy JPEG compression (97.4% match), cropping, color filters, and unique scenes.
              </span>
            </div>
            <button
              onClick={() => {
                setIsDemoDatasetActive(false);
                resetScan();
                setActiveTab('analyze');
              }}
              className="font-bold underline text-amber-300 hover:text-white shrink-0 cursor-pointer"
            >
              Upload Your Own Files →
            </button>
          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* If scan is actively in progress, display the live Pipeline stage monitor */}
        {isScanning ? (
          <AnalysisPipeline progress={progress} onCancel={cancelScan} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                report={report}
                clusters={clusters}
                onStartScan={() => setActiveTab('analyze')}
                onTryDemo={handleTryDemo}
                onReviewCluster={handleReviewCluster}
                onOpenReports={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'analyze' && (
              <UploadWorkspace
                onStartScan={handleStartScan}
                onTryDemo={handleTryDemo}
                isScanning={isScanning}
              />
            )}

            {activeTab === 'clusters' && (
              <ClustersView
                images={images}
                clusters={clusters}
                hasScanned={report !== null}
                onReviewCluster={handleReviewCluster}
                onCompareCluster={handleCompareCluster}
                onCompareTwo={handleCompareTwo}
                onViewDetails={(img, cluster) => setSelectedImageForDetails({ image: img, cluster })}
                onToggleSelection={toggleCleanupSelection}
                onApplyCleanup={() => applyCleanup()}
                onStartNewScan={() => {
                  setIsDemoDatasetActive(false);
                  resetScan();
                  setActiveTab('analyze');
                }}
              />
            )}

            {activeTab === 'reports' && (
              <div className="space-y-12">
                <StorageSavings
                  report={report}
                  clusters={clusters}
                  onApplyCleanup={applyCleanup}
                  onReviewCluster={handleReviewCluster}
                />
                <ReportsView
                  report={report}
                  onReviewCluster={handleReviewCluster}
                  onStartNewScan={() => {
                    setIsDemoDatasetActive(false);
                    resetScan();
                    setActiveTab('analyze');
                  }}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryView
                onStartNewScan={() => {
                  setIsDemoDatasetActive(false);
                  resetScan();
                  setActiveTab('analyze');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView config={config} onUpdateConfig={setConfig} />
            )}

          </>
        )}
      </main>

      {/* Modals */}
      {activeSelectedCluster && (
        <ClusterDetailModal
          cluster={activeSelectedCluster}
          onClose={() => setSelectedClusterForReview(null)}
          onCompareTwo={handleCompareTwo}
          onToggleSelection={toggleCleanupSelection}
          onApplyCleanup={applyCleanup}
          onViewDetails={(img, cluster) => setSelectedImageForDetails({ image: img, cluster })}
        />
      )}

      {selectedImageForDetails && (
        <ImageDetailsModal
          image={selectedImageForDetails.image}
          cluster={selectedImageForDetails.cluster}
          onClose={() => setSelectedImageForDetails(null)}
          onCompareWithKeeper={(img) => {
            if (selectedImageForDetails.cluster) {
              const keeper =
                selectedImageForDetails.cluster.images.find(
                  (i) => i.id === selectedImageForDetails.cluster?.recommendedKeepId
                ) || selectedImageForDetails.cluster.images[0];
              setComparisonPair({
                imageA: keeper,
                imageB: img,
                recommendedKeepId: selectedImageForDetails.cluster.recommendedKeepId,
              });
            }
          }}
        />
      )}

      {comparisonPair && (
        <ComparisonViewer
          imageA={comparisonPair.imageA}
          imageB={comparisonPair.imageB}
          recommendedKeepId={comparisonPair.recommendedKeepId}
          onClose={() => setComparisonPair(null)}
        />
      )}

      {/* Clear Analysis Data Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl glass-panel border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear Analysis Data?</h3>
                <p className="text-xs text-slate-400">Session Reset & Memory Cleanup</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will release all decoded image bitmaps, perceptual signatures, and temporary duplicate clusters
              from memory. Your local computer files will remain untouched on your hard drive.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleClearAnalysisData}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            AI Duplicate Image Finder • Client-Side Computer Vision Engine (pHash DCT • dHash • aHash • Cosine Embeddings)
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Zero Server Uploads • 100% In-Browser Privacy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
