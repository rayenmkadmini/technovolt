import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EXTRACTED_DIRS = [
  { sourceArchive: "1.zip", dir: "D:\\technophoto\\extracted_raw\\1" },
  { sourceArchive: "2.zip", dir: "D:\\technophoto\\extracted_raw\\2" },
];

const CONTACT_SHEET_DIR = "D:\\technophoto\\contact_sheet";
const THUMBNAILS_DIR = path.join(CONTACT_SHEET_DIR, "thumbnails");

if (!fs.existsSync(CONTACT_SHEET_DIR)) {
  fs.mkdirSync(CONTACT_SHEET_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

async function getMediaProbe(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "stream=width,height,codec_type,codec_name,duration:format=duration,size,format_name",
      "-of", "json",
      filePath
    ]);
    const data = JSON.parse(stdout);
    const videoStream = data.streams?.find(s => s.codec_type === "video");
    const audioStream = data.streams?.find(s => s.codec_type === "audio");

    let width = videoStream?.width || null;
    let height = videoStream?.height || null;
    let duration = null;

    if (data.format?.duration) {
      duration = parseFloat(data.format.duration);
    } else if (videoStream?.duration) {
      duration = parseFloat(videoStream.duration);
    }

    return {
      isValid: Boolean(videoStream || data.streams?.length > 0),
      width,
      height,
      duration: duration !== null && !isNaN(duration) ? Number(duration.toFixed(2)) : null,
      codec: videoStream?.codec_name || null,
      hasAudio: Boolean(audioStream),
      format: data.format?.format_name || null
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message,
      width: null,
      height: null,
      duration: null,
      codec: null,
      hasAudio: false,
      format: null
    };
  }
}

async function generateThumbnail(filePath, thumbPath, isVideo) {
  try {
    if (isVideo) {
      // Grab frame at 1s or start
      await execFileAsync("ffmpeg", [
        "-y",
        "-ss", "00:00:01",
        "-i", filePath,
        "-vframes", "1",
        "-vf", "scale=360:-1",
        thumbPath
      ]);
    } else {
      // Resize image for contact sheet
      await execFileAsync("ffmpeg", [
        "-y",
        "-i", filePath,
        "-vf", "scale=360:-1",
        thumbPath
      ]);
    }
    return true;
  } catch {
    // If 1s fails for short video, try at 0s
    if (isVideo) {
      try {
        await execFileAsync("ffmpeg", [
          "-y",
          "-ss", "00:00:00",
          "-i", filePath,
          "-vframes", "1",
          "-vf", "scale=360:-1",
          thumbPath
        ]);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

async function main() {
  console.log("=== TECHNOVOLT: Starting Deep Media Inspection ===");
  const allAssets = [];
  const hashToAssets = new Map();

  for (const { sourceArchive, dir } of EXTRACTED_DIRS) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      const buffer = fs.readFileSync(fullPath);
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      const ext = path.extname(file).toLowerCase();
      const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".webm";
      const isImage = ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";

      const probe = await getMediaProbe(fullPath);

      // Unique thumbnail filename based on hash
      const thumbFileName = `thumb_${sha256.slice(0, 16)}.jpg`;
      const thumbPath = path.join(THUMBNAILS_DIR, thumbFileName);

      let thumbGenerated = false;
      if (fs.existsSync(thumbPath)) {
        thumbGenerated = true;
      } else {
        thumbGenerated = await generateThumbnail(fullPath, thumbPath, isVideo);
      }

      const assetRecord = {
        id: sha256.slice(0, 12),
        sourceArchive,
        originalFilename: file,
        fullPath,
        sizeBytes: stat.size,
        sizeFormatted: (stat.size / (1024 * 1024)).toFixed(2) + " MB",
        ext,
        mediaType: isVideo ? "video" : isImage ? "image" : "other",
        sha256,
        isValid: probe.isValid,
        width: probe.width,
        height: probe.height,
        orientation: probe.width && probe.height ? (probe.width > probe.height ? "landscape" : probe.width < probe.height ? "portrait" : "square") : "unknown",
        duration: probe.duration,
        codec: probe.codec,
        hasAudio: probe.hasAudio,
        thumbFileName: thumbGenerated ? thumbFileName : null,
      };

      allAssets.push(assetRecord);

      if (!hashToAssets.has(sha256)) {
        hashToAssets.set(sha256, []);
      }
      hashToAssets.get(sha256).push(assetRecord);
    }
  }

  // Deduplication analysis
  const uniqueAssets = [];
  const duplicates = [];

  for (const [sha256, list] of hashToAssets.entries()) {
    uniqueAssets.push(list[0]);
    if (list.length > 1) {
      duplicates.push({
        sha256,
        master: list[0],
        copies: list.slice(1),
      });
    }
  }

  console.log(`\nInspection Summary:`);
  console.log(`- Total Files across archives: ${allAssets.length}`);
  console.log(`- Unique Files: ${uniqueAssets.length}`);
  console.log(`- Exact Duplicate Files: ${allAssets.length - uniqueAssets.length}`);
  console.log(`- Total Images: ${uniqueAssets.filter(a => a.mediaType === "image").length}`);
  console.log(`- Total Videos: ${uniqueAssets.filter(a => a.mediaType === "video").length}`);
  console.log(`- Corrupted / Invalid Files: ${uniqueAssets.filter(a => !a.isValid).length}`);

  // Write detailed JSON inventory
  const inventoryPath = "D:\\technophoto\\media_inventory.json";
  fs.writeFileSync(inventoryPath, JSON.stringify({
    inspectedAt: new Date().toISOString(),
    totalDiscovered: allAssets.length,
    totalUnique: uniqueAssets.length,
    duplicateCount: allAssets.length - uniqueAssets.length,
    duplicates,
    uniqueAssets,
    allAssets,
  }, null, 2));

  console.log(`Saved JSON inventory to: ${inventoryPath}`);

  // Generate HTML Visual Contact Sheet
  const htmlPath = path.join(CONTACT_SHEET_DIR, "index.html");
  const htmlContent = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>TECHNOVOLT — Planche Contact des Médias (Contact Sheet)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { background: #1e293b; padding: 12px 20px; border-radius: 8px; border: 1px solid #334155; }
    .stat-val { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
    .filter-bar { margin-bottom: 20px; display: flex; gap: 10px; }
    .filter-btn { background: #334155; color: #f8fafc; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .filter-btn.active { background: #0284c7; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 10px; overflow: hidden; border: 1px solid #334155; display: flex; flex-direction: column; transition: transform 0.15s ease; }
    .card:hover { transform: translateY(-3px); border-color: #38bdf8; }
    .card-media { position: relative; width: 100%; height: 200px; background: #000; display: flex; align-items: center; justify-content: center; }
    .card-media img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .badge { position: absolute; top: 8px; left: 8px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .badge-image { background: rgba(16, 185, 129, 0.9); color: white; }
    .badge-video { background: rgba(239, 68, 68, 0.9); color: white; }
    .badge-archive { position: absolute; top: 8px; right: 8px; background: rgba(30, 41, 59, 0.85); color: #cbd5e1; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
    .card-body { padding: 12px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .filename { font-weight: 600; color: #f1f5f9; word-break: break-all; font-size: 12px; }
    .meta-row { display: flex; justify-content: space-between; color: #94a3b8; font-size: 11px; }
    .tag { display: inline-block; background: #0f172a; border: 1px solid #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #38bdf8; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>TECHNOVOLT — Planche Contact des Médias</h1>
  <p style="color: #94a3b8; margin-top: 0;">Revue visuelle et inventaire des fichiers de <code>D:\\technophoto\\1.zip</code> et <code>2.zip</code></p>
  
  <div class="stats">
    <div class="stat-card"><div class="stat-val">${allAssets.length}</div><div class="stat-label">Total Fichiers</div></div>
    <div class="stat-card"><div class="stat-val">${uniqueAssets.length}</div><div class="stat-label">Fichiers Uniques</div></div>
    <div class="stat-card"><div class="stat-val">${duplicates.length}</div><div class="stat-label">Doublons Exacts</div></div>
    <div class="stat-card"><div class="stat-val">${uniqueAssets.filter(a => a.mediaType === "image").length}</div><div class="stat-label">Photos</div></div>
    <div class="stat-card"><div class="stat-val">${uniqueAssets.filter(a => a.mediaType === "video").length}</div><div class="stat-label">Vidéos</div></div>
  </div>

  <div class="grid">
    ${uniqueAssets.map((asset, idx) => `
      <div class="card" data-type="${asset.mediaType}">
        <div class="card-media">
          <span class="badge badge-${asset.mediaType}">${asset.mediaType}${asset.duration ? ` (${asset.duration}s)` : ''}</span>
          <span class="badge-archive">${asset.sourceArchive}</span>
          ${asset.thumbFileName ? `<img src="thumbnails/${asset.thumbFileName}" alt="${asset.originalFilename}" loading="lazy" />` : '<span style="color:#64748b;">Aperçu indisponible</span>'}
        </div>
        <div class="card-body">
          <div class="filename">#${idx + 1} — ${asset.originalFilename}</div>
          <div class="meta-row">
            <span>${asset.width && asset.height ? `${asset.width}x${asset.height} (${asset.orientation})` : 'Dimensions N/A'}</span>
            <span>${asset.sizeFormatted}</span>
          </div>
          <div class="meta-row">
            <span>Format: ${asset.ext.toUpperCase()}</span>
            <span>ID: <code>${asset.id}</code></span>
          </div>
        </div>
      </div>
    `).join("")}
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`Saved HTML visual contact sheet to: ${htmlPath}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
