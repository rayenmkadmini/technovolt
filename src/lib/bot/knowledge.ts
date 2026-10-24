/**
 * TechnoVolt Domain Knowledge & Pricing Engine
 * Specialized in residential electricity, electrical components, domotics, and IoT for Tunisia (Tataouine & national market).
 */

export interface ElectricalProduct {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  category: "breakers" | "protection" | "cables" | "switches" | "smart_home" | "panels" | "lighting";
  brand: string;
  specs: string;
  typicalPriceTND: number; // In Tunisian Dinars (TND)
  priceRangeTND: { min: number; max: number };
  unit: string;
  lastVerifiedDate: string;
  status: "indicative_estimate" | "verified_reference";
  notesFr: string;
  notesAr: string;
}

export const TUNISIAN_ELECTRICAL_CATALOGUE: ElectricalProduct[] = [
  {
    id: "disj-10a-16a",
    name: "Disjoncteur divisionnaire 10A / 16A Uni+Neutre Courbe C",
    nameAr: "قاطع تيار فرعي 10A / 16A أحادي القطب والحيادي",
    nameEn: "Miniature Circuit Breaker (MCB) 10A / 16A 1P+N Curve C",
    category: "breakers",
    brand: "Hager / Schneider Electric / Chint",
    specs: "Courbe C, Pouvoir de coupure 4.5kA / 6kA, 230V~",
    typicalPriceTND: 14.500,
    priceRangeTND: { min: 8.500, max: 22.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Chint ~8-12 TND, Hager ~14-18 TND, Schneider ~16-22 TND selon quincaillerie.",
    notesAr: "شينت من 8 إلى 12 د.ت، هاجر من 14 إلى 18 د.ت، شنايدر من 16 إلى 22 د.ت حسب نقطة البيع.",
  },
  {
    id: "disj-20a-32a",
    name: "Disjoncteur divisionnaire 20A / 32A Courbe C",
    nameAr: "قاطع تيار فرعي 20A / 32A للأجهزة الكبرى",
    nameEn: "Miniature Circuit Breaker (MCB) 20A / 32A Curve C",
    category: "breakers",
    brand: "Hager / Schneider / Legrand",
    specs: "Pour prises spécialisées, climatiseurs (20A) ou plaques de cuisson/chauffe-eau (32A)",
    typicalPriceTND: 18.000,
    priceRangeTND: { min: 11.000, max: 26.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Utiliser une section de câble adaptée : 2.5mm² pour 20A, 6mm² pour 32A.",
    notesAr: "يتطلب سلك قياس 2.5 مم² لقوة 20A وسلك 6 مم² لقوة 32A.",
  },
  {
    id: "diff-30ma-40a",
    name: "Interrupteur Différentiel 30mA 40A Type AC / Type A",
    nameAr: "قاطع تفاضلي 30 ميلي أمبير 40 أمبير لحماية الأشخاص",
    nameEn: "Residual Current Device (RCD/RCCB) 30mA 40A Type AC / Type A",
    category: "protection",
    brand: "Schneider Electric / Hager / Legrand",
    specs: "Protection contre les chocs électriques (fuites de courant), 2P 230V~",
    typicalPriceTND: 95.000,
    priceRangeTND: { min: 65.000, max: 145.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Obligatoire pour la sécurité des personnes selon la norme. Type A recommandé pour lave-linge et électronique.",
    notesAr: "إجباري قانونيًا لحماية الأشخاص من الصعق الكهربائي. نوع A منصوح به للأجهزة الإلكترونية.",
  },
  {
    id: "cable-1-5",
    name: "Fil électrique rigide H07V-U 1.5mm² (Rouleau 100m)",
    nameAr: "سلك كهربائي صلب 1.5 مم² (لفة 100 متر) للإنارة",
    nameEn: "Single Core Solid Wire H07V-U 1.5mm² (100m roll)",
    category: "cables",
    brand: "Chakira Cables / Tunisie Câbles (Fabrication tunisienne)",
    specs: "Cuivre pur électrolytique certifié, pour circuits d'éclairage",
    typicalPriceTND: 72.000,
    priceRangeTND: { min: 65.000, max: 85.000 },
    unit: "rouleau 100m",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Exigez toujours des câbles certifiés normes tunisiennes (ex. Chakira) pour éviter les risques d'échauffement.",
    notesAr: "تأكد دائمًا من شراء كابلات مطابقة للمواصفات التونسية (مثل شكيرة) لتفادي احتراق الأسلاك.",
  },
  {
    id: "cable-2-5",
    name: "Fil électrique rigide H07V-U 2.5mm² (Rouleau 100m)",
    nameAr: "سلك كهربائي صلب 2.5 مم² (لفة 100 متر) للمآخذ",
    nameEn: "Single Core Solid Wire H07V-U 2.5mm² (100m roll)",
    category: "cables",
    brand: "Chakira Cables / Tunisie Câbles",
    specs: "Pour circuits de prises de courant standard 16A/20A",
    typicalPriceTND: 115.000,
    priceRangeTND: { min: 105.000, max: 135.000 },
    unit: "rouleau 100m",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Le prix varie selon le cours mondial du cuivre.",
    notesAr: "يتغير السعر حسب بورصة النحاس العالمية.",
  },
  {
    id: "tableau-18-24",
    name: "Tableau de distribution modulaire encastré 18 à 24 modules",
    nameAr: "لوحة توزيع كهربائية غاطسة 18 إلى 24 قاطع",
    nameEn: "Flush Modular Electrical Distribution Board (18-24 modules)",
    category: "panels",
    brand: "Hager / Legrand / Vimar",
    specs: "Porte transparente ou blanche fumée, rail DIN intégré",
    typicalPriceTND: 48.000,
    priceRangeTND: { min: 35.000, max: 75.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Prévoir toujours 20% d'emplacements libres pour les extensions futures.",
    notesAr: "يُنصح بترك 20% من الأماكن شاغرة للتوسعات المستقبلية.",
  },
  {
    id: "sonoff-mini-zigbee",
    name: "Module micromodule interrupteur connecté Sonoff ZBMINI / WiFi",
    nameAr: "وحدة مفتاح ذكي مدمج Sonoff Zigbee / Wi-Fi",
    nameEn: "Smart Switch Relay Module Sonoff ZBMINI / Wi-Fi",
    category: "smart_home",
    brand: "Sonoff / eWeLink / Tuya",
    specs: "10A/16A, s'installe derrière l'interrupteur existant, compatible Home Assistant / Alexa",
    typicalPriceTND: 45.000,
    priceRangeTND: { min: 38.000, max: 58.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Permet de rendre un éclairage classique intelligent sans changer les appareillages existants.",
    notesAr: "يحوّل المفتاح التقليدي إلى مفتاح ذكي يتم التحكم فيه بالهاتف دون تغيير الشكل الخارجي.",
  },
  {
    id: "shelly-plus-1pm",
    name: "Micromodule connecté Shelly Plus 1PM avec mesure de consommation",
    nameAr: "مفتاح ذكي Shelly Plus 1PM مع قياس استهلاك الطاقة",
    nameEn: "Shelly Plus 1PM Smart Relay with Power Metering",
    category: "smart_home",
    brand: "Shelly",
    specs: "16A, Wi-Fi + Bluetooth, mesure précise des watts (W) et kWh, protection surchauffe",
    typicalPriceTND: 82.000,
    priceRangeTND: { min: 68.000, max: 98.000 },
    unit: "pièce",
    lastVerifiedDate: "2026-03-01",
    status: "indicative_estimate",
    notesFr: "Idéal pour surveiller et automatiser un chauffe-eau ou climatiseur.",
    notesAr: "ممتاز لمراقبة استهلاك سخان الماء أو المكيف والتحكم فيهما أوتوماتيكياً.",
  },
];

/**
 * Standard Safety & Technical Rules
 */
export const ELECTRICAL_SAFETY_GUIDELINES = {
  emergencyNumbers: {
    tunisiaCivilDefense: "198", // Protection Civile
    stegFaultEmergency: "71 341 400 / 80 100 444", // STEG Urgences
    technovoltPhone: "+216 26 250 027",
  },
  wireSizes: [
    { section: "1.5 mm²", maxAmps: "10A ou 16A", circuit: "Éclairage, VMC (max 8 points lumineux par circuit)" },
    { section: "2.5 mm²", maxAmps: "16A ou 20A", circuit: "Prises de courant ordinaires, lave-linge, lave-vaisselle, four" },
    { section: "4.0 mm²", maxAmps: "25A", circuit: "Chauffe-eau grande capacité, gros climatiseurs" },
    { section: "6.0 mm²", maxAmps: "32A", circuit: "Plaque de cuisson vitrocéramique/induction, sous-tableaux" },
    { section: "10.0 à 16.0 mm²", maxAmps: "40A à 63A", circuit: "Liaison compteur/disjoncteur de branchement vers tableau principal" },
  ],
  goldenSafetyRules: [
    "Toujours couper le disjoncteur général et vérifier l'absence réelle de tension (VAT) avant toute manipulation.",
    "Ne jamais surcalibrer un disjoncteur pour masquer un déclenchement : si un disjoncteur saute, il y a surcharge ou court-circuit.",
    "La terre est votre assurance-vie : toute masse métallique doit être reliée à la prise de terre (< 100 Ohms) associée à un différentiel 30mA.",
    "Ne jamais intervenir les mains mouillées ou les pieds nus sur une installation électrique.",
  ],
};

/**
 * Search the electrical catalogue by keyword
 */
export function searchCatalogue(query: string): ElectricalProduct[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // 1. Direct exact or substring match
  const directMatches = TUNISIAN_ELECTRICAL_CATALOGUE.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.specs.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });
  if (directMatches.length > 0) return directMatches;

  // 2. Tokenized search: check if query contains key product concepts (supports French, English, Arabic, and Arabizi)
  const stopWords = new Set([
    "combien", "coûte", "coute", "prix", "tunisie", "tataouine", "quelle", "quel", "avec", "pour", "dans",
    "9addech", "9adeh", "soum", "mta3", "mte3", "fel", "dar", "eddar", "chnowa", "chneya", "kifech", "3lech", "najem", "n7eb",
    "قداش", "سوم", "متاع", "في", "الدار", "شنوة", "شنيّة", "علاش", "نحب", "نجم"
  ]);

  // Synonyms mapping for Derja / Arabizi / abbreviations
  const synonyms: Record<string, string[]> = {
    disjoncteur: ["disjoncteur", "disj", "ديسجونكتور", "قاطع"],
    differentiel: ["differentiel", "différentiel", "diff", "ديفيرانسيال", "ديفيرونسيال", "تفاضلي", "30ma"],
    cables: ["cable", "câble", "kabel", "fil", "5ayt", "khayt", "5yot", "سلك", "خيط", "كابل", "chakira", "شكيرة"],
    tableau: ["tableau", "tablo", "لوحة", "coffret"],
    smart_home: ["domotique", "smart", "connecte", "connecté", "shelly", "sonoff", "zigbee", "دوموتيك", "ذكي"],
  };

  const tokens = q.split(/[\s,?.!'"()]+/).filter((t) => t.length >= 2 && !stopWords.has(t));

  return TUNISIAN_ELECTRICAL_CATALOGUE.filter((p) => {
    return tokens.some((tok) => {
      if (
        p.name.toLowerCase().includes(tok) ||
        p.nameAr.includes(tok) ||
        p.nameEn.toLowerCase().includes(tok) ||
        p.brand.toLowerCase().includes(tok) ||
        p.category.toLowerCase().includes(tok)
      ) {
        return true;
      }

      // Check synonyms
      for (const [cat, synList] of Object.entries(synonyms)) {
        if (synList.some((s) => tok.includes(s) || s.includes(tok))) {
          if (p.category === cat || p.id.includes(cat) || p.name.toLowerCase().includes(cat)) {
            return true;
          }
        }
      }

      return false;
    });
  });
}
