/**
 * Demo Data Generator:
 * Generates genuine procedural image files on HTML Canvas with realistic variations
 * (exact copy, resize, JPEG compression, cropping, color adjustment, and unique scenes).
 * All analysis results are computed dynamically from these real image pixels.
 */

// Helper to convert canvas to File
function canvasToFile(canvas: HTMLCanvasElement, filename: string, type = 'image/jpeg', quality = 0.92): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Blob creation failed');
      const file = new File([blob], filename, { type, lastModified: Date.now() });
      resolve(file);
    }, type, quality);
  });
}

// Scene 1: Sunset Mountain Vista
function renderSunsetLandscape(ctx: CanvasRenderingContext2D, width: number, height: number, colorShift = 0): void {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  if (colorShift === 0) {
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.4, '#c026d3');
    skyGrad.addColorStop(0.7, '#f97316');
    skyGrad.addColorStop(1, '#fde047');
  } else {
    // Warm filtered version
    skyGrad.addColorStop(0, '#31102b');
    skyGrad.addColorStop(0.4, '#d946ef');
    skyGrad.addColorStop(0.7, '#ea580c');
    skyGrad.addColorStop(1, '#facc15');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Glowing Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(width * 0.45, height * 0.52, height * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountain range
  ctx.fillStyle = '#47143d';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.lineTo(width * 0.25, height * 0.45);
  ctx.lineTo(width * 0.5, height * 0.6);
  ctx.lineTo(width * 0.75, height * 0.4);
  ctx.lineTo(width, height * 0.7);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Foreground dark mountain ridges
  ctx.fillStyle = '#1c0a1f';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.75);
  ctx.lineTo(width * 0.35, height * 0.58);
  ctx.lineTo(width * 0.7, height * 0.78);
  ctx.lineTo(width, height * 0.62);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Lake reflection
  const lakeGrad = ctx.createLinearGradient(0, height * 0.8, 0, height);
  lakeGrad.addColorStop(0, '#7c2d12');
  lakeGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, height * 0.82, width, height * 0.18);
}

// Scene 2: Cyber City Skyline
function renderCyberCity(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#030712');
  sky.addColorStop(0.6, '#0f172a');
  sky.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Neon Moon
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.25, height * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Grid horizon lines
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  for (let y = height * 0.75; y < height; y += 15) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Skyscrapers
  const buildings = [
    { x: 0.05, w: 0.12, h: 0.55, c: '#0284c7' },
    { x: 0.2, w: 0.15, h: 0.7, c: '#4f46e5' },
    { x: 0.38, w: 0.1, h: 0.45, c: '#06b6d4' },
    { x: 0.52, w: 0.16, h: 0.65, c: '#9333ea' },
    { x: 0.72, w: 0.14, h: 0.5, c: '#2563eb' },
  ];

  buildings.forEach((b) => {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(width * b.x, height * (1 - b.h), width * b.w, height * b.h);
    ctx.strokeStyle = b.c;
    ctx.lineWidth = 2;
    ctx.strokeRect(width * b.x, height * (1 - b.h), width * b.w, height * b.h);

    // Windows
    ctx.fillStyle = b.c;
    for (let wy = height * (1 - b.h) + 10; wy < height * 0.85; wy += 20) {
      for (let wx = width * b.x + 8; wx < width * (b.x + b.w) - 8; wx += 14) {
        if (Math.random() > 0.4) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
  });
}

// Scene 3: Minimalist Modern Workspace
function renderWorkspace(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Wall
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, height);

  // Wooden desk
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, height * 0.65, width, height * 0.35);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, height * 0.65, width, 12);

  // Laptop
  ctx.fillStyle = '#64748b';
  ctx.fillRect(width * 0.32, height * 0.42, width * 0.36, height * 0.24);
  // Screen
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width * 0.34, height * 0.44, width * 0.32, height * 0.2);
  // Screen artwork
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.54, 25, 0, Math.PI * 2);
  ctx.fill();

  // Coffee Mug
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(width * 0.76, height * 0.72, 28, 0, Math.PI * 2);
  ctx.fill();
}

// Scene 4: Ocean Aurora (Unique)
function renderOceanAurora(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Dark emerald sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#022c22');
  sky.addColorStop(0.5, '#064e3b');
  sky.addColorStop(1, '#042f2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Aurora curtains
  ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.2);
  ctx.bezierCurveTo(width * 0.3, height * 0.05, width * 0.6, height * 0.35, width, height * 0.15);
  ctx.lineTo(width, height * 0.45);
  ctx.bezierCurveTo(width * 0.6, height * 0.6, width * 0.3, height * 0.3, 0, height * 0.4);
  ctx.closePath();
  ctx.fill();

  // Calm deep ocean
  ctx.fillStyle = '#021e1a';
  ctx.fillRect(0, height * 0.68, width, height * 0.32);
}

// Scene 5: Geometric Bauhaus Abstract Art (Unique)
function renderGeometricAbstract(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Off-white canvas backdrop
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Big terracotta circle
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.arc(width * 0.35, height * 0.45, width * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Midnight blue semicircle
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(width * 0.65, height * 0.55, width * 0.18, 0, Math.PI);
  ctx.fill();

  // Mustard yellow vertical pillar
  ctx.fillStyle = '#eab308';
  ctx.fillRect(width * 0.48, height * 0.15, width * 0.08, height * 0.7);

  // Black diagonal accent line
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.85);
  ctx.lineTo(width * 0.9, height * 0.2);
  ctx.stroke();
}

/**
 * Generates the complete, high-fidelity real demonstration dataset.
 */
export async function generateDemoDataset(): Promise<File[]> {
  const files: File[] = [];

  // Group 1: Sunset Mountain (1 High-Res original, 1 exact copy, 1 resized+compressed, 1 cropped)
  const canvas1 = document.createElement('canvas');
  canvas1.width = 1600;
  canvas1.height = 900;
  const ctx1 = canvas1.getContext('2d')!;
  renderSunsetLandscape(ctx1, 1600, 900);

  // 1a: High-Res Original
  const file1a = await canvasToFile(canvas1, 'alps_sunset_original_raw.jpg', 'image/jpeg', 0.95);
  files.push(file1a);

  // 1b: Exact Byte Copy (Created from identical blob)
  const exactBlob = new Blob([await file1a.arrayBuffer()], { type: 'image/jpeg' });
  const file1b = new File([exactBlob], 'alps_sunset_backup_copy.jpg', { type: 'image/jpeg' });
  files.push(file1b);

  // 1c: Resized & Heavily Compressed JPEG (Resizing + Compression robustness)
  const canvas1c = document.createElement('canvas');
  canvas1c.width = 640;
  canvas1c.height = 360;
  const ctx1c = canvas1c.getContext('2d')!;
  ctx1c.drawImage(canvas1, 0, 0, 640, 360);
  const file1c = await canvasToFile(canvas1c, 'alps_sunset_resized_compressed.jpg', 'image/jpeg', 0.35);
  files.push(file1c);

  // 1d: Cropped version (Cropping robustness)
  const canvas1d = document.createElement('canvas');
  canvas1d.width = 720;
  canvas1d.height = 720;
  const ctx1d = canvas1d.getContext('2d')!;
  // Draw center portion
  ctx1d.drawImage(canvas1, 300, 100, 1000, 700, 0, 0, 720, 720);
  const file1d = await canvasToFile(canvas1d, 'alps_sunset_cropped_square.jpg', 'image/jpeg', 0.85);
  files.push(file1d);

  // Group 2: Cyber City (1 Original PNG, 1 Slight warm filter)
  const canvas2 = document.createElement('canvas');
  canvas2.width = 1280;
  canvas2.height = 720;
  const ctx2 = canvas2.getContext('2d')!;
  renderCyberCity(ctx2, 1280, 720);
  const file2a = await canvasToFile(canvas2, 'neo_tokyo_night_hq.png', 'image/png');
  files.push(file2a);

  const canvas2b = document.createElement('canvas');
  canvas2b.width = 1024;
  canvas2b.height = 576;
  const ctx2b = canvas2b.getContext('2d')!;
  ctx2b.drawImage(canvas2, 0, 0, 1024, 576);
  // Add subtle color wash
  ctx2b.fillStyle = 'rgba(234, 88, 12, 0.12)';
  ctx2b.fillRect(0, 0, 1024, 576);
  const file2b = await canvasToFile(canvas2b, 'neo_tokyo_warm_filter.jpg', 'image/jpeg', 0.8);
  files.push(file2b);

  // Group 3: Workspace (1 Original PNG, 1 Compressed Copy)
  const canvas3 = document.createElement('canvas');
  canvas3.width = 1000;
  canvas3.height = 700;
  const ctx3 = canvas3.getContext('2d')!;
  renderWorkspace(ctx3, 1000, 700);
  const file3a = await canvasToFile(canvas3, 'minimal_desk_setup_raw.png', 'image/png');
  files.push(file3a);

  const canvas3b = document.createElement('canvas');
  canvas3b.width = 750;
  canvas3b.height = 525;
  const ctx3b = canvas3b.getContext('2d')!;
  ctx3b.drawImage(canvas3, 0, 0, 750, 525);
  const file3b = await canvasToFile(canvas3b, 'minimal_desk_setup_copy.jpg', 'image/jpeg', 0.6);
  files.push(file3b);

  // Unique Scene 1: Ocean Aurora (Detected as Unique!)
  const canvas4 = document.createElement('canvas');
  canvas4.width = 1200;
  canvas4.height = 800;
  const ctx4 = canvas4.getContext('2d')!;
  renderOceanAurora(ctx4, 1200, 800);
  const file4 = await canvasToFile(canvas4, 'emerald_aurora_ocean_unique.jpg', 'image/jpeg', 0.9);
  files.push(file4);

  // Unique Scene 2: Geometric Bauhaus Abstract (Detected as Unique!)
  const canvas5 = document.createElement('canvas');
  canvas5.width = 900;
  canvas5.height = 900;
  const ctx5 = canvas5.getContext('2d')!;
  renderGeometricAbstract(ctx5, 900, 900);
  const file5 = await canvasToFile(canvas5, 'geometric_bauhaus_art_unique.png', 'image/png');
  files.push(file5);

  return files;
}

