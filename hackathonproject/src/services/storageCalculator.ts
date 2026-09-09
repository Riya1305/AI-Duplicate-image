import { ImageMetadata } from '../types/image';
import { DuplicateCluster } from '../types/cluster';
import { StorageReport } from '../types/report';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateStorageReport(
  images: ImageMetadata[],
  clusters: DuplicateCluster[],
  processingTimeSeconds: number
): StorageReport {
  const totalImages = images.length;
  const totalStorageBytes = images.reduce((acc, img) => acc + img.size, 0);

  // Images present in clusters are duplicate candidates
  const clusterImageIds = new Set<string>();
  clusters.forEach(c => c.images.forEach(img => clusterImageIds.add(img.id)));

  const duplicateImages = clusterImageIds.size;
  const uniqueImages = Math.max(0, totalImages - duplicateImages);
  const duplicateGroups = clusters.length;

  const exactDuplicateGroups = clusters.filter(c => c.duplicateType === 'exact').length;
  const nearDuplicateGroups = clusters.filter(c => c.duplicateType === 'near').length;
  const similarGroups = clusters.filter(c => c.duplicateType === 'similar').length;

  const duplicateStorageBytes = clusters.reduce((acc, c) => acc + c.totalSize, 0);
  const recoverableStorageBytes = clusters.reduce((acc, c) => acc + c.recoverableSize, 0);

  const savingsPercentage = totalStorageBytes > 0
    ? Math.round((recoverableStorageBytes / totalStorageBytes) * 1000) / 10
    : 0;

  const avgSimilarity = clusters.length > 0
    ? Math.round(clusters.reduce((acc, c) => acc + c.averageSimilarity, 0) / clusters.length * 10) / 10
    : 0;

  // Format breakdown
  const formatBreakdown: Record<string, { count: number; bytes: number }> = {};
  for (const img of images) {
    const ext = (img.name.split('.').pop() || 'unknown').toUpperCase();
    if (!formatBreakdown[ext]) {
      formatBreakdown[ext] = { count: 0, bytes: 0 };
    }
    formatBreakdown[ext].count++;
    formatBreakdown[ext].bytes += img.size;
  }

  return {
    totalImages,
    duplicateImages,
    uniqueImages,
    duplicateGroups,
    exactDuplicateGroups,
    nearDuplicateGroups,
    similarGroups,
    totalStorageBytes,
    duplicateStorageBytes,
    recoverableStorageBytes,
    savingsPercentage,
    averageSimilarity: avgSimilarity,
    processingTimeSeconds: Math.max(0.1, Math.round(processingTimeSeconds * 10) / 10),
    scanDate: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    clusters,
    formatBreakdown,
  };
}

export function exportReportAsCSV(report: StorageReport): void {
  const headers = [
    'Duplicate Group',
    'Duplicate Type',
    'Filename',
    'Relative Path',
    'File Size',
    'File Size (Bytes)',
    'Dimensions',
    'Format',
    'Similarity Score',
    'Recommended Action',
    'Potential Savings'
  ];

  const rows: string[] = [headers.join(',')];

  report.clusters.forEach((c) => {
    c.images.forEach((img) => {
      const isKeep = img.id === c.recommendedKeepId;
      const potentialSavings = isKeep ? '0 B' : formatBytes(img.size);
      const action = isKeep ? 'Keep (Recommended)' : 'Clean / Remove';

      rows.push([
        `"Cluster #${c.clusterNumber}"`,
        `"${c.duplicateType}"`,
        `"${img.name.replace(/"/g, '""')}"`,
        `"${(img.relativePath || img.name).replace(/"/g, '""')}"`,
        `"${formatBytes(img.size)}"`,
        img.size.toString(),
        `"${img.width}x${img.height}"`,
        `"${img.name.split('.').pop() || img.type}"`,
        `"${c.averageSimilarity}%"`,
        `"${action}"`,
        `"${potentialSavings}"`
      ].join(','));
    });
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `AI-Duplicate-Images-Audit-${Date.now()}.csv`);
}

export function exportReportAsJSON(report: StorageReport): void {
  const jsonString = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `AI-Duplicate-Images-Audit-${Date.now()}.json`);
}

export function downloadAuditReportHTML(report: StorageReport): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Storage Optimization Report — AI Duplicate Image Finder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; margin: 0; padding: 40px 20px; }
    .container { max-width: 900px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #334155; padding: 32px; }
    h1 { color: #ffffff; margin-top: 0; font-size: 28px; }
    .tagline { color: #818cf8; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
    .card-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
    .card-val { font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 4px; }
    .recoverable { color: #34d399; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
    th { background: #1e293b; text-align: left; padding: 10px; color: #94a3b8; border-bottom: 1px solid #334155; }
    td { padding: 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
    .keep { color: #fbbf24; font-weight: 600; }
    .clean { color: #f87171; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #312e81; color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Duplicate Image Finder — Optimization Audit</h1>
    <div class="tagline">Find duplicates. Clean smarter. Save storage. • Generated on ${report.scanDate}</div>
    
    <div class="metrics">
      <div class="card">
        <div class="card-title">Images Scanned</div>
        <div class="card-val">${report.totalImages.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-title">Duplicate Groups</div>
        <div class="card-val">${report.duplicateGroups}</div>
      </div>
      <div class="card">
        <div class="card-title">Duplicate Storage</div>
        <div class="card-val">${formatBytes(report.duplicateStorageBytes)}</div>
      </div>
      <div class="card">
        <div class="card-title">Recoverable Space</div>
        <div class="card-val recoverable">${formatBytes(report.recoverableStorageBytes)}</div>
      </div>
    </div>

    <h3>Duplicate Clusters Inventory</h3>
    <table>
      <thead>
        <tr>
          <th>Cluster</th>
          <th>Type</th>
          <th>Images</th>
          <th>Avg Similarity</th>
          <th>Total Size</th>
          <th>Recoverable</th>
          <th>Recommended Keeper</th>
        </tr>
      </thead>
      <tbody>
        ${report.clusters.map(c => `
          <tr>
            <td><strong>Cluster #${c.clusterNumber}</strong></td>
            <td><span class="badge">${c.duplicateType}</span></td>
            <td>${c.images.length} files</td>
            <td><strong>${c.averageSimilarity}%</strong></td>
            <td>${formatBytes(c.totalSize)}</td>
            <td class="recoverable"><strong>${formatBytes(c.recoverableSize)}</strong></td>
            <td class="keep">${c.images.find(img => img.id === c.recommendedKeepId)?.name || 'First file'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `AI-Duplicate-Images-Audit-${Date.now()}.html`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

