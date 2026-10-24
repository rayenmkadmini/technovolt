export interface GalleryPhoto {
  id: string;
  src: string;
  title: string;
  titleByLocale: {
    fr: string;
    ar: string;
    en: string;
  };
  category: "tableaux" | "cablage" | "eclairage" | "climatisation" | "villas";
  categoryLabel: {
    fr: string;
    ar: string;
    en: string;
  };
  location: string;
  description: {
    fr: string;
    ar: string;
    en: string;
  };
}

// Generate the 74 authentic worksite photos catalog
export const ALL_CHANTIER_PHOTOS: GalleryPhoto[] = Array.from({ length: 74 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  const id = `chantier-${num}`;
  const src = `/images/projects/technovolt-chantier-${num}.jpg`;

  // Categorize systematically across electrical installation domains
  let category: GalleryPhoto["category"] = "villas";
  let titleFr = `Chantier d'installation électrique N°${num}`;
  let titleAr = `مشروع تركيب كهربائي رقم ${num}`;
  let titleEn = `Electrical worksite installation #${num}`;

  if (i % 5 === 0) {
    category = "tableaux";
    titleFr = `Câblage armoire & tableau modulaire N°${num}`;
    titleAr = `تركيب وتوزيع خزانة كهربائية رقم ${num}`;
    titleEn = `Distribution board & modular panel #${num}`;
  } else if (i % 5 === 1) {
    category = "cablage";
    titleFr = `Passage gaines & filerie sous conduits N°${num}`;
    titleAr = `تمديد الكابلات والقنوات الكهربائية رقم ${num}`;
    titleEn = `Conduits, wiring & trunking #${num}`;
  } else if (i % 5 === 2) {
    category = "eclairage";
    titleFr = `Pose luminaires LED & spots intégrés N°${num}`;
    titleAr = `تركيب إضاءة ليد وسبوتات رقم ${num}`;
    titleEn = `LED architectural lighting #${num}`;
  } else if (i % 5 === 3) {
    category = "climatisation";
    titleFr = `Raccordement groupe climatisation & alimentation N°${num}`;
    titleAr = `توصيل وتركيب مكيفات الهواء رقم ${num}`;
    titleEn = `Air conditioning power & setup #${num}`;
  } else {
    category = "villas";
    titleFr = `Travaux d'électricité générale villa N°${num}`;
    titleAr = `أعمال كهرباء عامة فيلا سكنية رقم ${num}`;
    titleEn = `General electrical wiring villa #${num}`;
  }

  return {
    id,
    src,
    title: titleFr,
    titleByLocale: {
      fr: titleFr,
      ar: titleAr,
      en: titleEn,
    },
    category,
    categoryLabel: {
      fr:
        category === "tableaux"
          ? "Tableaux & Armoires"
          : category === "cablage"
          ? "Câblage & Gaines"
          : category === "eclairage"
          ? "Éclairage LED"
          : category === "climatisation"
          ? "Climatisation"
          : "Villas & Chantiers",
      ar:
        category === "tableaux"
          ? "لوحات وقواطع كهربائية"
          : category === "cablage"
          ? "كابلات وقنوات"
          : category === "eclairage"
          ? "إضاءة ليد"
          : category === "climatisation"
          ? "تكييف وتبريد"
          : "فلل ومشاريع",
      en:
        category === "tableaux"
          ? "Panels & Switchgear"
          : category === "cablage"
          ? "Wiring & Conduits"
          : category === "eclairage"
          ? "LED Lighting"
          : category === "climatisation"
          ? "Air Conditioning"
          : "Villas & Sites",
    },
    location: "Tataouine, Tunisie",
    description: {
      fr: "Intervention réalisée sur site selon les normes de sécurité en vigueur par l'équipe TECHNOVOLT.",
      ar: "تدخل تم تنفيذه في الموقع وفق معايير السلامة المهنية من قبل فريق تكنوفولت.",
      en: "On-site electrical intervention carried out according to safety standards by the TECHNOVOLT team.",
    },
  };
});
