import JSZip from 'jszip';

const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

export interface ExtractedImageFile {
  file: File;
  relativePath: string;
}

export async function extractImagesFromZip(
  zipFile: File,
  onProgress?: (percent: number, currentFileName: string) => void
): Promise<{ images: ExtractedImageFile[]; ignoredCount: number }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  
  const entries = Object.values(loadedZip.files);
  const images: ExtractedImageFile[] = [];
  let ignoredCount = 0;
  let processed = 0;

  for (const entry of entries) {
    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / entries.length) * 100), entry.name);
    }

    if (entry.dir) continue;
    
    // Ignore hidden system files like __MACOSX or .DS_Store
    const basename = entry.name.split('/').pop() || '';
    if (basename.startsWith('.') || entry.name.includes('__MACOSX')) {
      ignoredCount++;
      continue;
    }

    const extension = (basename.split('.').pop() || '').toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      ignoredCount++;
      continue;
    }

    const blob = await entry.async('blob');
    const mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
    const file = new File([blob], basename, { type: mimeType });

    images.push({
      file,
      relativePath: entry.name,
    });
  }

  return { images, ignoredCount };
}
