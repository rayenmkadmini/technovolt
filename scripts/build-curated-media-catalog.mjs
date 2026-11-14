import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const INVENTORY_SRC = "D:\\technophoto\\media_inventory.json";
const TARGET_IMG_DIR = path.resolve("public/media/images");
const TARGET_VID_DIR = path.resolve("public/media/videos");
const TARGET_THUMB_DIR = path.resolve("public/media/thumbnails");

[TARGET_IMG_DIR, TARGET_VID_DIR, TARGET_THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load original inventory
const rawInventory = JSON.parse(fs.readFileSync(INVENTORY_SRC, "utf8"));
const uniqueAssets = rawInventory.uniqueAssets;

console.log(`Loaded ${uniqueAssets.length} unique assets for categorization & curation.`);

// Helper to determine image characteristics
async function analyzeImage(asset) {
  try {
    const img = sharp(asset.fullPath);
    const meta = await img.metadata();
    const stats = await img.stats();

    const r = stats.channels[0].mean;
    const g = stats.channels[1].mean;
    const b = stats.channels[2].mean;
    const brightness = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));

    // Standard deviation as a proxy for contrast/detail
    const stdev = (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3;

    return {
      width: meta.width || asset.width,
      height: meta.height || asset.height,
      brightness,
      maxDiff,
      stdev,
      r, g, b,
      isLandscape: (meta.width || asset.width) > (meta.height || asset.height),
    };
  } catch (err) {
    return {
      width: asset.width,
      height: asset.height,
      brightness: 128,
      maxDiff: 10,
      stdev: 40,
      r: 128, g: 128, b: 128,
      isLandscape: asset.orientation === "landscape",
      error: err.message,
    };
  }
}

async function run() {
  const categorized = {
    plans: [],
    chantiers: [],
    eclairage: [],
    climatisation: [],
    tableaux: [],
    videos: [],
  };

  for (const asset of uniqueAssets) {
    if (asset.mediaType === "video") {
      categorized.videos.push(asset);
      continue;
    }

    const metrics = await analyzeImage(asset);
    asset.metrics = metrics;

    const { brightness, maxDiff, stdev, r, g, b } = metrics;
    const match = asset.originalFilename.match(/(\d{2}\.\d{2}\.\d{2})/);
    const timeStr = match ? match[1] : "";

    // Classification heuristics based on visual metrics + batch correlation
    if (brightness > 165 && maxDiff < 26 && stdev < 55) {
      // Paper / Architectural blueprint
      categorized.plans.push(asset);
    } else if (r > g + 22 && r > b + 28) {
      // Orange red brick / masonry / saignées
      categorized.chantiers.push(asset);
    } else if (brightness < 110 && stdev > 50) {
      // High contrast dark ambient with LED lighting
      categorized.eclairage.push(asset);
    } else if (timeStr === "12.32.10" || timeStr === "12.31.30" || (r > 130 && g > 130 && b < 115 && stdev < 50)) {
      // Climatisation / HVAC
      categorized.climatisation.push(asset);
    } else if (timeStr.startsWith("12.37.4") && brightness > 155) {
      // Technical drawings & engineering studies from archive 2
      categorized.plans.push(asset);
    } else if (b > r && b > g - 10) {
      // Blue electrical wiring / Hager components
      categorized.tableaux.push(asset);
    } else {
      // Default distribution based on batch and stdev
      if (asset.sourceArchive === "1.zip") {
        if (stdev > 52) categorized.tableaux.push(asset);
        else categorized.eclairage.push(asset);
      } else {
        if (stdev > 50) categorized.chantiers.push(asset);
        else categorized.tableaux.push(asset);
      }
    }
  }

  console.log("\nClassification results across all 172 assets:");
  console.log(`- Tableaux & Armoires: ${categorized.tableaux.length}`);
  console.log(`- Éclairage LED: ${categorized.eclairage.length}`);
  console.log(`- Climatisation & Froid: ${categorized.climatisation.length}`);
  console.log(`- Chantiers & Saignées: ${categorized.chantiers.length}`);
  console.log(`- Bureau d'études & Plans: ${categorized.plans.length}`);
  console.log(`- Vidéos: ${categorized.videos.length}`);

  // Curation: select top assets with highest sharpness/contrast (stdev)
  const sortByQuality = (list) => list.sort((a, b) => (b.metrics?.stdev || 0) - (a.metrics?.stdev || 0));

  const curatedTableaux = sortByQuality(categorized.tableaux).slice(0, 8);
  const curatedEclairage = sortByQuality(categorized.eclairage).slice(0, 8);
  const curatedClimatisation = sortByQuality(categorized.climatisation).slice(0, 6);
  const curatedChantiers = sortByQuality(categorized.chantiers).slice(0, 8);
  const curatedPlans = sortByQuality(categorized.plans).slice(0, 6);

  // Curate Videos: 1 landscape + top 3 portrait
  const landscapeVideo = categorized.videos.find((v) => v.orientation === "landscape") || categorized.videos[0];
  const portraitVideos = categorized.videos.filter((v) => v.id !== landscapeVideo.id).slice(0, 3);
  const curatedVideos = [landscapeVideo, ...portraitVideos];

  console.log("\nCurated selection:");
  console.log(`- Tableaux: ${curatedTableaux.length}`);
  console.log(`- Éclairage: ${curatedEclairage.length}`);
  console.log(`- Climatisation: ${curatedClimatisation.length}`);
  console.log(`- Chantiers: ${curatedChantiers.length}`);
  console.log(`- Plans: ${curatedPlans.length}`);
  console.log(`- Vidéos: ${curatedVideos.length}`);
  console.log(`Total Curated Photos: ${curatedTableaux.length + curatedEclairage.length + curatedClimatisation.length + curatedChantiers.length + curatedPlans.length}`);
  console.log(`Total Curated Videos: ${curatedVideos.length}`);

  const processedCatalog = [];

  // Metadata mapping helper
  const categoryMeta = {
    tableaux: {
      seoPrefix: "technovolt-tableau-electrique",
      catFr: "Tableaux & Armoires",
      catAr: "لوحات وأجهزة توزيع كهربائي",
      catEn: "Electrical Panels & Distribution",
      titlePrefixFr: "Tableau électrique modulaire",
      titlePrefixAr: "لوحة توزيع كهربائية معيارية",
      titlePrefixEn: "Modular electrical distribution panel",
      descFr: "Installation soignée d'armoire électrique avec disjoncteurs différentiels, voltmètre numérique et repérage normatif.",
      descAr: "تركيب متقن للوحة كهربائية مجهزة بقواطع تفاضلية ومقياس جهد رقمي وترقيم فني وفق المواصفات القياسية.",
      descEn: "Clean installation of electrical panel with RCD breakers, digital voltmeter, and standard cable ferrules.",
      websiteSections: ["homepage", "services_electricity", "projects"],
    },
    eclairage: {
      seoPrefix: "technovolt-eclairage-led",
      catFr: "Éclairage LED",
      catAr: "إنارة معمارية وليد",
      catEn: "Architectural LED Lighting",
      titlePrefixFr: "Profilé LED encastré faux-plafond",
      titlePrefixAr: "إنارة شريط ليد مدمج بالجبس",
      titlePrefixEn: "Recessed architectural LED profile",
      descFr: "Éclairage architectural linéaire en faux-plafond, rubans LED haute densité et spots intégrés.",
      descAr: "إنارة معمارية خطية مدمجة بالأسقف المعلقة، أشرطة ليد عالية الكثافة وإضاءة سبوت موجهة.",
      descEn: "Linear architectural lighting in false ceilings with high-density LED strips and recessed spotlights.",
      websiteSections: ["homepage", "services_lighting", "projects"],
    },
    climatisation: {
      seoPrefix: "technovolt-climatisation",
      catFr: "Climatisation",
      catAr: "تكييف وتبريد",
      catEn: "Air Conditioning & HVAC",
      titlePrefixFr: "Installation et tirage au vide climatiseur",
      titlePrefixAr: "تركيب وحدة تكييف وتفريغ الهواء بالفاكيوم",
      titlePrefixEn: "Air conditioning install and vacuum evacuation",
      descFr: "Raccordement frigorifique, tirage au vide à la pompe manométrique et mise en service conforme.",
      descAr: "توصيل أنابيب النحاس، تفريغ دارة التبريد بمضخة الفاكيوم، وتشغيل الجهاز طبقا لأعلى معايير الكفاءة.",
      descEn: "Refrigerant line connection, vacuum evacuation using precision manifold pump, and optimal commissioning.",
      websiteSections: ["services_hvac", "projects"],
    },
    chantiers: {
      seoPrefix: "technovolt-chantier-cablage",
      catFr: "Câblage & Gaines",
      catAr: "تمديدات وكابلات الحفر",
      catEn: "Wiring & Conduits",
      titlePrefixFr: "Passage de gaines ICTA et saignées",
      titlePrefixAr: "تمديد أنابيب كهربائية مع حفر الجدران",
      titlePrefixEn: "ICTA conduits routing and wall chasing",
      descFr: "Saignées de précision dans la brique, pose de gaines annelées ignifugées et boîtes de dérivation encastrées.",
      descAr: "حفر دقيق في الجدران وتمديد خراطيم العزل المقاومة للحرارة مع علب تجميع وتوزيع مدمجة.",
      descEn: "Precision masonry chasing, fire-retardant corrugated conduit laying, and recessed junction boxes.",
      websiteSections: ["projects"],
    },
    plans: {
      seoPrefix: "technovolt-bureau-etudes-plan",
      catFr: "Bureau d'Études",
      catAr: "مخططات هندسية ودراسات",
      catEn: "Engineering & Blueprints",
      titlePrefixFr: "Schéma technique et plan unifilaire",
      titlePrefixAr: "مخطط كهربائي هندسي أحادي الخط",
      titlePrefixEn: "Technical blueprint and electrical layout",
      descFr: "Étude technique préalable, dimensionnement des charges et plans d'implantation électrique avant exécution.",
      descAr: "دراسة هندسية مسبقة، حساب الأحمال الكهربائية، وتصميم خرائط التوزيع قبل بدء أعمال التركيب.",
      descEn: "Preliminary engineering study, electrical load balancing, and layout drafting prior to worksite execution.",
      websiteSections: ["about", "projects"],
    },
  };

  // Process Images
  const groups = [
    { catKey: "tableaux", items: curatedTableaux },
    { catKey: "eclairage", items: curatedEclairage },
    { catKey: "climatisation", items: curatedClimatisation },
    { catKey: "chantiers", items: curatedChantiers },
    { catKey: "plans", items: curatedPlans },
  ];

  for (const { catKey, items } of groups) {
    const meta = categoryMeta[catKey];
    for (let i = 0; i < items.length; i++) {
      const asset = items[i];
      const indexStr = (i + 1).toString().padStart(2, "0");
      const baseName = `${meta.seoPrefix}-${indexStr}`;
      const jpgFileName = `${baseName}.jpg`;
      const webpFileName = `${baseName}.webp`;
      const thumbFileName = `${baseName}-thumb.webp`;

      const targetJpgPath = path.join(TARGET_IMG_DIR, jpgFileName);
      const targetWebpPath = path.join(TARGET_IMG_DIR, webpFileName);
      const targetThumbPath = path.join(TARGET_THUMB_DIR, thumbFileName);

      // Generate optimized JPG
      await sharp(asset.fullPath)
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(targetJpgPath);

      // Generate optimized WebP
      await sharp(asset.fullPath)
        .webp({ quality: 82, effort: 4 })
        .toFile(targetWebpPath);

      // Generate responsive WebP Thumbnail (480px wide)
      await sharp(asset.fullPath)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(targetThumbPath);

      const targetWebpStat = fs.statSync(targetWebpPath);
      const targetJpgStat = fs.statSync(targetJpgPath);

      processedCatalog.push({
        id: `media-${catKey}-${indexStr}`,
        type: "image",
        category: catKey,
        categoryLabel: {
          fr: meta.catFr,
          ar: meta.catAr,
          en: meta.catEn,
        },
        title: `${meta.titlePrefixFr} #${indexStr}`,
        titleByLocale: {
          fr: `${meta.titlePrefixFr} #${indexStr}`,
          ar: `${meta.titlePrefixAr} رقم ${indexStr}`,
          en: `${meta.titlePrefixEn} #${indexStr}`,
        },
        description: {
          fr: meta.descFr,
          ar: meta.descAr,
          en: meta.descEn,
        },
        originalFilename: asset.originalFilename,
        sourceArchive: asset.sourceArchive,
        src: `/media/images/${jpgFileName}`,
        srcWebp: `/media/images/${webpFileName}`,
        thumbnailSrc: `/media/thumbnails/${thumbFileName}`,
        width: asset.metrics.width,
        height: asset.metrics.height,
        orientation: asset.metrics.isLandscape ? "landscape" : "portrait",
        sizeBytesWebp: targetWebpStat.size,
        sizeBytesJpg: targetJpgStat.size,
        websiteSections: meta.websiteSections,
      });
    }
  }

  // Process Videos
  const videoMeta = [
    {
      seoPrefix: "technovolt-showcase-installations-panoramique",
      titleFr: "Présentation panoramique des installations TECHNOVOLT",
      titleAr: "جولة شاملة في مشاريع وتجهيزات تكنوفولت",
      titleEn: "Panoramic showcase of TECHNOVOLT installations",
      descFr: "Aperçu vidéo complet des travaux électriques et d'éclairage réalisés sur chantier à Tataouine.",
      descAr: "استعراض فيديو شامل للأشغال الكهربائية وتجهيزات الإضاءة الميدانية المنفذة في ولاية تطاوين.",
      descEn: "Comprehensive video overview of electrical and lighting works carried out on site in Tataouine.",
      sections: ["homepage", "projects"],
    },
    {
      seoPrefix: "technovolt-demonstration-eclairage-led",
      titleFr: "Démonstration dynamique d'éclairage LED architectural",
      titleAr: "استعراض إضاءة الليد المعمارية وتشغيل الخطوط الضوئية",
      titleEn: "Dynamic demonstration of architectural LED lighting",
      descFr: "Allumage et mise en valeur des corniches lumineuses et bandeaux LED intégrés.",
      descAr: "تشغيل الإضاءة المخفية في الكورنيش وأشرطة الليد المدمجة في الديكور الحديث.",
      descEn: "Lighting up architectural coves and recessed LED strips in modern decor.",
      sections: ["services_lighting", "projects"],
    },
    {
      seoPrefix: "technovolt-tableau-electrique-fonctionnement",
      titleFr: "Mise sous tension et contrôle de tableau électrique",
      titleAr: "فحص وتشغيل لوحة التوزيع الكهربائية وقياس الجهد",
      titleEn: "Electrical panel live commissioning and voltmeter check",
      descFr: "Vérification des tensions de phase et fonctionnement des disjoncteurs modulaires.",
      descAr: "مراقبة استقرار جهد التغذية (230V) وعمل القواطع الكهربائية المعيارية.",
      descEn: "Verification of line voltages and seamless operation of modular circuit breakers.",
      sections: ["services_electricity", "projects"],
    },
    {
      seoPrefix: "technovolt-climatisation-manometre-vide",
      titleFr: "Tirage au vide frigorifique et contrôle manométrique",
      titleAr: "عملية تفريغ الهواء بالفاكيوم ومراقبة ضغط التبريد",
      titleEn: "HVAC vacuum pulling and manifold gauge monitoring",
      descFr: "Procédure rigoureuse de tirage au vide garantissant l'étanchéité et la longévité du compresseur.",
      descAr: "إجراء احترافي لتفريغ شبكة النحاس لضمان عدم وجود رطوبة وحماية ضاغط المكيف.",
      descEn: "Rigorous vacuum pump evacuation ensuring zero moisture and optimal compressor lifespan.",
      sections: ["services_hvac", "projects"],
    },
  ];

  for (let i = 0; i < curatedVideos.length; i++) {
    const vAsset = curatedVideos[i];
    const meta = videoMeta[i] || videoMeta[0];
    const indexStr = (i + 1).toString().padStart(2, "0");
    const mp4FileName = `${meta.seoPrefix}-${indexStr}.mp4`;
    const posterWebp = `${meta.seoPrefix}-${indexStr}-poster.webp`;
    const posterJpg = `${meta.seoPrefix}-${indexStr}-poster.jpg`;

    const targetMp4Path = path.join(TARGET_VID_DIR, mp4FileName);
    const targetPosterWebp = path.join(TARGET_THUMB_DIR, posterWebp);
    const targetPosterJpg = path.join(TARGET_THUMB_DIR, posterJpg);

    // Optimize video with ffmpeg: h264 + aac + faststart (for instant streaming)
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", vAsset.fullPath,
      "-c:v", "libx264",
      "-crf", "23",
      "-preset", "medium",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      targetMp4Path,
    ]);

    // Extract sharp poster frame at 1s or 0s
    const tempPosterFrame = path.join(TARGET_THUMB_DIR, `temp_${indexStr}.jpg`);
    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-ss", "00:00:01",
        "-i", vAsset.fullPath,
        "-vframes", "1",
        tempPosterFrame,
      ]);
    } catch {
      await execFileAsync("ffmpeg", [
        "-y",
        "-ss", "00:00:00",
        "-i", vAsset.fullPath,
        "-vframes", "1",
        tempPosterFrame,
      ]);
    }

    if (fs.existsSync(tempPosterFrame)) {
      await sharp(tempPosterFrame)
        .jpeg({ quality: 85 })
        .toFile(targetPosterJpg);

      await sharp(tempPosterFrame)
        .webp({ quality: 82 })
        .toFile(targetPosterWebp);

      fs.unlinkSync(tempPosterFrame);
    }

    const vidStat = fs.statSync(targetMp4Path);

    processedCatalog.push({
      id: `media-video-${indexStr}`,
      type: "video",
      category: "videos",
      categoryLabel: {
        fr: "Vidéos de Réalisations",
        ar: "فيديوهات المشاريع",
        en: "Project Videos",
      },
      title: meta.titleFr,
      titleByLocale: {
        fr: meta.titleFr,
        ar: meta.titleAr,
        en: meta.titleEn,
      },
      description: {
        fr: meta.descFr,
        ar: meta.descAr,
        en: meta.descEn,
      },
      originalFilename: vAsset.originalFilename,
      sourceArchive: vAsset.sourceArchive,
      src: `/media/videos/${mp4FileName}`,
      posterSrc: `/media/thumbnails/${posterJpg}`,
      posterWebpSrc: `/media/thumbnails/${posterWebp}`,
      width: vAsset.width,
      height: vAsset.height,
      duration: vAsset.duration,
      orientation: vAsset.orientation,
      sizeBytes: vidStat.size,
      sizeFormatted: (vidStat.size / (1024 * 1024)).toFixed(2) + " MB",
      websiteSections: meta.sections,
    });
  }

  // Save the master media inventory file
  const inventoryOut = path.resolve("public/media/inventory.json");
  fs.writeFileSync(inventoryOut, JSON.stringify(processedCatalog, null, 2));

  // Also write TypeScript data structure for direct type-safe import
  const tsCatalogOut = path.resolve("src/lib/data/curatedMediaCatalog.ts");
  const tsContent = `// Auto-generated curated media catalog from authentic TECHNOVOLT worksites
export interface CuratedMediaItem {
  id: string;
  type: "image" | "video";
  category: "tableaux" | "eclairage" | "climatisation" | "chantiers" | "plans" | "videos";
  categoryLabel: {
    fr: string;
    ar: string;
    en: string;
  };
  title: string;
  titleByLocale: {
    fr: string;
    ar: string;
    en: string;
  };
  description: {
    fr: string;
    ar: string;
    en: string;
  };
  originalFilename: string;
  sourceArchive: string;
  src: string;
  srcWebp?: string;
  thumbnailSrc?: string;
  posterSrc?: string;
  posterWebpSrc?: string;
  width: number | null;
  height: number | null;
  duration?: number | null;
  orientation: "landscape" | "portrait" | "square" | "unknown";
  sizeBytes?: number;
  sizeBytesWebp?: number;
  sizeBytesJpg?: number;
  sizeFormatted?: string;
  websiteSections: string[];
}

export const CURATED_MEDIA_CATALOG: CuratedMediaItem[] = ${JSON.stringify(processedCatalog, null, 2)};
`;

  fs.writeFileSync(tsCatalogOut, tsContent);

  console.log(`\nSuccessfully processed and created:`);
  console.log(`- ${processedCatalog.filter((i) => i.type === "image").length} Optimized WebP + JPG Images in public/media/images/`);
  console.log(`- ${processedCatalog.filter((i) => i.type === "video").length} Faststart H.264 MP4 Videos in public/media/videos/`);
  console.log(`- Responsive WebP & JPG Thumbnails/Posters in public/media/thumbnails/`);
  console.log(`- JSON Catalog saved to: ${inventoryOut}`);
  console.log(`- TypeScript Catalog saved to: ${tsCatalogOut}`);
}

run().catch((err) => {
  console.error("Fatal error during media processing:", err);
  process.exit(1);
});
