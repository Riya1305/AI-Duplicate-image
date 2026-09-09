import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FolderPlus, 
  FileArchive, 
  Files, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Trash2, 
  ArrowRight,
  X,
  FileImage,
  Info
} from 'lucide-react';
import { extractImagesFromZip } from '../services/zipService';
import { formatBytes } from '../services/storageCalculator';
import { FileValidationError } from '../types/image';

interface UploadWorkspaceProps {
  onStartScan: (files: File[], fileHandles?: Map<string, FileSystemFileHandle>) => void;
  onTryDemo: () => void;
  isScanning: boolean;
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  onStartScan,
  onTryDemo,
  isScanning,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileHandles, setFileHandles] = useState<Map<string, FileSystemFileHandle>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  const collectFolderImages = async (
    directoryHandle: FileSystemDirectoryHandle
  ): Promise<{ files: File[]; handles: Map<string, FileSystemFileHandle> }> => {
    const files: File[] = [];
    const handles = new Map<string, FileSystemFileHandle>();
    const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

    const visit = async (directory: FileSystemDirectoryHandle) => {
      for await (const [, entry] of directory.entries()) {
        if (entry.kind === 'directory') {
          await visit(entry as FileSystemDirectoryHandle);
          continue;
        }

        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const extension = (file.name.split('.').pop() || '').toLowerCase();
        if (file.type.startsWith('image/') || imageExtensions.has(extension)) {
          files.push(file);
          handles.set(fileKey(file), fileHandle);
        }
      }
    };

    await visit(directoryHandle);
    return { files, handles };
  };

  const validateAndAddFiles = (incomingFiles: File[], incomingHandles = new Map<string, FileSystemFileHandle>()) => {
    const valid: File[] = [];
    const errors: FileValidationError[] = [];
    const acceptedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

    for (const f of incomingFiles) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!acceptedExtensions.has(ext) && !f.type.startsWith('image/')) {
        errors.push({ file: f, reason: `Unsupported format (.${ext || 'unknown'})` });
        continue;
      }
      if (f.size === 0) {
        errors.push({ file: f, reason: 'Empty file (0 bytes)' });
        continue;
      }
      valid.push(f);
    }

    setSelectedFiles((prev) => {
      // Deduplicate by name and size in memory
      const existingKeys = new Set(prev.map((item) => `${item.name}-${item.size}`));
      const filteredNew = valid.filter((item) => !existingKeys.has(`${item.name}-${item.size}`));
      return [...prev, ...filteredNew];
    });

    setFileHandles((prev) => {
      const next = new Map(prev);
      incomingHandles.forEach((handle, key) => next.set(key, handle));
      return next;
    });

    if (errors.length > 0) {
      setValidationErrors((prev) => [...prev, ...errors]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = Array.from(e.dataTransfer.files);
    
    // Check if any file is a ZIP
    const zipFiles = items.filter((f) => f.name.endsWith('.zip'));
    const regularFiles = items.filter((f) => !f.name.endsWith('.zip'));

    if (regularFiles.length > 0) {
      validateAndAddFiles(regularFiles);
    }

    for (const zf of zipFiles) {
      await handleZipFile(zf);
    }
  };

  const handleZipFile = async (zipFile: File) => {
    setIsExtractingZip(true);
    setZipProgress(0);
    try {
      const { images, ignoredCount } = await extractImagesFromZip(zipFile, (pct) => {
        setZipProgress(pct);
      });

      const extractedFiles = images.map((img) => img.file);
      validateAndAddFiles(extractedFiles);

      if (ignoredCount > 0) {
        setValidationErrors((prev) => [
          ...prev,
          {
            file: { name: zipFile.name, size: zipFile.size, type: 'zip' },
            reason: `${ignoredCount} non-image or system files inside ZIP were safely ignored.`,
          },
        ]);
      }
    } catch (err) {
      console.error('ZIP extraction error:', err);
      setValidationErrors((prev) => [
        ...prev,
        {
          file: zipFile,
          reason: `Failed to unpack ZIP: ${err instanceof Error ? err.message : 'Corrupt or unreadable archive'}`,
        },
      ]);
    } finally {
      setIsExtractingZip(false);
    }
  };

  const handleZipInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleZipFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleChooseFiles = async () => {
    const picker = (window as Window & {
      showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: { description: string; accept: Record<string, string[]> }[];
      }) => Promise<FileSystemFileHandle[]>;
    }).showOpenFilePicker;

    if (!picker) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const handles = await picker({
        multiple: true,
        types: [{ description: 'Images', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'] } }],
      });
      const files = await Promise.all(handles.map((handle) => handle.getFile()));
      validateAndAddFiles(files, new Map(files.map((file, index) => [fileKey(file), handles[index]])));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('File picker error:', error);
    }
  };

  const handleChooseFolder = async () => {
    const picker = (window as Window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker;

    if (!picker) {
      folderInputRef.current?.click();
      return;
    }

    try {
      const directoryHandle = await picker();
      const { files, handles } = await collectFolderImages(directoryHandle);
      validateAndAddFiles(files, handles);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Folder picker error:', error);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onClick={(e) => { e.currentTarget.value = ''; }}
        onChange={handleImageInputChange}
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onClick={(e) => { e.currentTarget.value = ''; }}
        onChange={handleImageInputChange}
        // @ts-expect-error webkitdirectory is standard in all modern browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={zipInputRef}
        onChange={handleZipInputChange}
        accept=".zip,application/zip"
        className="hidden"
      />

      {/* Main Drag-and-Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-950/40 shadow-2xl shadow-indigo-500/20 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80'
        }`}
      >
        <div className="max-w-xl mx-auto space-y-5">
          <div className="w-18 h-18 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <UploadCloud className="w-9 h-9 text-indigo-400 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Add Your Image Collection
            </h2>
            <p className="text-sm text-slate-400">
              Drop images, folders, or ZIP files here
            </p>
            <p className="text-xs text-slate-500">
              Supported formats: <span className="text-slate-400 font-medium">JPG, JPEG, PNG, WEBP, GIF, BMP</span>
            </p>
          </div>

          {/* Upload action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleChooseFiles}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Files className="w-4 h-4" />
              <span>Choose Files</span>
            </button>

            <button
              onClick={handleChooseFolder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Choose Folder</span>
            </button>

            <button
              onClick={() => zipInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              <FileArchive className="w-4 h-4 text-purple-400" />
              <span>Upload ZIP</span>
            </button>
          </div>

          {/* Demo shortcut */}
          <div className="pt-2">
            <button
              onClick={onTryDemo}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Don't have sample files? Try Demo Dataset with 1 click</span>
            </button>
          </div>
        </div>

        {/* ZIP extraction overlay */}
        {isExtractingZip && (
          <div className="absolute inset-0 rounded-3xl bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-20">
            <FileArchive className="w-10 h-10 text-indigo-400 animate-pulse" />
            <p className="text-sm font-semibold text-white">Unpacking ZIP Archive ({zipProgress}%)...</p>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${zipProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Validation warning banner if any invalid files occurred */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-300">
              ⚠ {validationErrors.length} {validationErrors.length === 1 ? 'file' : 'files'} could not be analyzed.
            </span>
          </div>
          <button
            onClick={() => setShowErrorModal(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
          >
            View Details
          </button>
        </div>
      )}

      {/* Selected files summary bar */}
      {selectedFiles.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {selectedFiles.length.toLocaleString()} images selected
              </p>
              <p className="text-xs text-slate-400">
                {formatBytes(totalBytes)} total storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedFiles([]);
                setValidationErrors([]);
                setFileHandles(new Map());
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={() => onStartScan(selectedFiles, fileHandles)}
              disabled={isScanning}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>Start Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Files Preview Sample */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Ready for Analysis ({selectedFiles.length} items)
          </span>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2 space-y-1">
            {selectedFiles.slice(0, 30).map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 text-slate-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileImage className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-slate-500 shrink-0 ml-3">{formatBytes(file.size)}</span>
              </div>
            ))}
            {selectedFiles.length > 30 && (
              <p className="text-center text-xs text-slate-500 py-1">
                + {selectedFiles.length - 30} more files
              </p>
            )}
          </div>
        </div>
      )}

      {/* File Validation Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl glass-panel border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Unsupported or Invalid Files</h3>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The following files could not be ingested for computer-vision analysis.
              Supported formats are standard raster images (JPG, PNG, WEBP, GIF, BMP).
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {validationErrors.map((err, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-white font-medium">
                    <span className="truncate">{err.file.name}</span>
                    <span className="text-slate-500 shrink-0">{formatBytes(err.file.size)}</span>
                  </div>
                  <p className="text-amber-400/90 text-[11px]">{err.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
