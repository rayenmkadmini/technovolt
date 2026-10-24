/**
 * Provider-Agnostic AI Engine for TechnoVolt Bot
 * Supports Groq, OpenAI, Gemini, OpenAI-compatible APIs, and a comprehensive
 * built-in domain knowledge engine with native Tunisian Derja & Arabizi intelligence.
 */

import {
  SYSTEM_PROMPT,
  OUT_OF_SCOPE_RESPONSES,
  EMERGENCY_ALERT,
  analyzeUserQuery,
} from "./prompt.ts";
import {
  TUNISIAN_ELECTRICAL_CATALOGUE,
  ELECTRICAL_SAFETY_GUIDELINES,
  searchCatalogue,
  type ElectricalProduct,
} from "./knowledge.ts";

export type BotLocale = "fr" | "ar" | "en" | "derja" | "arabizi";

export interface BotChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BotResponsePayload {
  reply: string;
  provider: "groq" | "openai" | "gemini" | "openrouter" | "openai-compatible" | "technovolt_knowledge_base";
  isSafetyAlert?: boolean;
  isPriceEstimate?: boolean;
  priceDisclaimer?: string;
  quoteCta?: boolean;
  suggestedFollowUps?: string[];
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // 20 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (clientData.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  clientData.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - clientData.count };
}

/**
 * Detect language and writing style:
 * - 'derja': Tunisian Arabic written in Arabic script
 * - 'arabizi': Tunisian dialect written in Latin with numbers (3, 7, 9, 5) or Tounsi words
 * - 'ar': Modern Standard Arabic
 * - 'en': English
 * - 'fr': French or French-Tunisian mixed
 */
export function detectLocale(text: string): BotLocale {
  const lower = text.toLowerCase();

  // 1. Check for Arabic script
  const arRegex = /[\u0600-\u06FF]/;
  if (arRegex.test(text)) {
    const derjaKeywords = [
      "قداش", "علاش", "شنوة", "شنيّة", "شكون", "نحب", "نجم", "ثمة", "فما", "فماش", "مافماش",
      "متاع", "في الدار", "الدار", "الضو", "يطفى", "يطيح", "يضرب", "سوم", "يكلف", "كليم",
      "شوفو", "برشا", "باش", "ديسجونكتور", "ديفيرانسيال", "ديفيرونسيال", "يعيشك", "كان", "خيط", "خيوط"
    ];
    const isDerja = derjaKeywords.some((w) => text.includes(w));
    return isDerja ? "derja" : "ar";
  }

  // 2. Check for Arabizi markers
  const arabiziDigitPatterns = [
    /\b(9ad+e+ch|9ad+e+h|9adeh|9addech|far9|ta9a)\b/i,
    /\b(3lech|3lesh|3andi|m3a|ta3mel|na3ref|3la|3amel)\b/i,
    /\b(n7eb|n7ebo|wa7dou|a7sen|7ri9|sa77a|7aja)\b/i,
    /\b(5ir|5adam|5ayt|5yot)\b/i,
  ];

  const arabiziVocab = [
    "chnowa", "chneya", "chniya", "kifech", "kifeh", "fama", "famech", "mafamach", "mta3", "mte3",
    "fel dar", "feddar", "el dhaw", "edhaw", "adhaw", "yodhrob", "yetfa", "soum", "ykallef", "barcha", "behi",
    "yech3el", "triti", "chofow", "choffeau", "klim", "clima", "chbik", "a3tini", "chkoun", "chkoune"
  ];

  const hasArabiziDigits = arabiziDigitPatterns.some((pattern) => pattern.test(lower));
  const hasArabiziVocab = arabiziVocab.some((w) => lower.includes(w));

  if (hasArabiziDigits || hasArabiziVocab) {
    return "arabizi";
  }

  // 3. Check for English
  const enKeywords = ["what", "how", "why", "price", "breaker", "wire", "switch", "home", "electric", "cost", "difference", "between"];
  const isEn = enKeywords.some((w) => lower.split(/[\s,?.!'"()]+/).includes(w));
  if (isEn) return "en";

  // Default to French
  return "fr";
}

/**
 * Built-in Domain Knowledge Generator with Tunisian Derja & Arabizi Intelligence
 */
function generateDomainKnowledgeAnswer(
  query: string,
  locale: BotLocale
): BotResponsePayload {
  const q = query.toLowerCase();

  // Price inquiries (French, Arabic, English, Derja, Arabizi)
  const isPriceQuery =
    q.includes("prix") || q.includes("coûte") || q.includes("combien") ||
    q.includes("tarif") || q.includes("سعر") || q.includes("سوم") ||
    q.includes("قداش") || q.includes("تكلفة") || q.includes("price") || q.includes("cost") ||
    q.includes("9addech") || q.includes("9adeh") || q.includes("ykallef");

  // Catalogue search
  const matchedProducts = searchCatalogue(query);

  if (isPriceQuery && matchedProducts.length > 0) {
    const prod = matchedProducts[0];

    // Tunisian Derja (Arabic script or Arabizi)
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### سوم الماتريال التقريبي في تونس (${prod.nameAr})\n\n` +
          `- **السوم المتوسط في الكنكايري والمحلات :** **${prod.typicalPriceTND.toFixed(3)} د.ت** (${prod.unit})\n` +
          `- **نطاق الأسعار المتداول :** بين **${prod.priceRangeTND.min.toFixed(3)} د.ت** و **${prod.priceRangeTND.max.toFixed(3)} د.ت**\n` +
          `- **الماركات المتوفرة :** ${prod.brand}\n` +
          `- **المواصفات الفنية :** ${prod.specs}\n\n` +
          `💡 **ملاحظة فنية :** ${prod.notesAr}\n\n` +
          `> *تنبيه : هذا سوم تقريبي للماتريال وحدو في السوق التونسية، ما يدخلش فيه حق اليد العاملة والتركيب. كان تحب دوفيس (Devis) كامل ومضبوط لدارك في تطاوين، فريق تكنوفولت حاضر يعاونك.*`,
        provider: "technovolt_knowledge_base",
        isPriceEstimate: true,
        priceDisclaimer: "سوم تقديري للماتريال حسب محلات المواد الكهربائية - من غير حق اليد العاملة",
        quoteCta: true,
        suggestedFollowUps: [
          "شنوة الفرق بين الديسجونكتور والديفيرانسيال؟",
          "قداش قياس الخيط المناسب للمكيف وسخان الماء؟",
          "طلب عرض سعر مجاني من تكنوفولت",
        ],
      };
    }

    if (locale === "ar") {
      return {
        reply: `### تقدير أسعار السوق في تونس (${prod.nameAr})\n\n` +
          `- **السعر التقريبي المتوسط:** **${prod.typicalPriceTND.toFixed(3)} د.ت** (${prod.unit})\n` +
          `- **نطاق الأسعار المتداول:** بين **${prod.priceRangeTND.min.toFixed(3)} د.ت** و **${prod.priceRangeTND.max.toFixed(3)} د.ت**\n` +
          `- **العلامات التجارية الشائعة:** ${prod.brand}\n` +
          `- **المواصفات الفنية:** ${prod.specs}\n\n` +
          `📌 **ملاحظة هامة:** ${prod.notesAr}\n\n` +
          `> *هذه الأسعار تقديرية استنادًا للسوق التونسية ومحلات المواد الكهربائية. للحصول على عرض سعر دقيق وشامل لتركيب منزلك، يسعد فريق تكنوفولت بتوفير دراسة مجانية.*`,
        provider: "technovolt_knowledge_base",
        isPriceEstimate: true,
        priceDisclaimer: "سعر تقديري غير تعاقدي - يختلف حسب العلامة وتكلفة اليد العاملة",
        quoteCta: true,
        suggestedFollowUps: [
          "ما هو الفرق بين قاطع التيار والقاطع التفاضلي؟",
          "أي قياس سلك يناسب المكيف أو سخان الماء؟",
          "طلب عرض سعر رسمي من تكنوفولت",
        ],
      };
    }

    if (locale === "en") {
      return {
        reply: `### Indicative Market Price in Tunisia (${prod.nameEn})\n\n` +
          `- **Average Reference Price:** **${prod.typicalPriceTND.toFixed(3)} TND** (${prod.unit})\n` +
          `- **Observed Price Range:** Between **${prod.priceRangeTND.min.toFixed(3)} TND** and **${prod.priceRangeTND.max.toFixed(3)} TND**\n` +
          `- **Brands:** ${prod.brand}\n` +
          `- **Technical Specs:** ${prod.specs}\n\n` +
          `📌 **Technical Note:** ${prod.notesFr}\n\n` +
          `> *These values are indicative estimates based on Tunisian local market supplies. For an exact, turnkey quote including professional installation in Tataouine, TechnoVolt is at your service.*`,
        provider: "technovolt_knowledge_base",
        isPriceEstimate: true,
        priceDisclaimer: "Indicative market estimate - subject to brand and installation conditions",
        quoteCta: true,
        suggestedFollowUps: [
          "Difference between MCB and RCD?",
          "What wire size for air conditioners?",
          "Request a free TechnoVolt quotation",
        ],
      };
    }

    // Default French
    return {
      reply: `### Estimation de prix en Tunisie — ${prod.name}\n\n` +
        `- **Prix moyen indicatif :** **${prod.typicalPriceTND.toFixed(3)} TND** (${prod.unit})\n` +
        `- **Fourchette courante :** de **${prod.priceRangeTND.min.toFixed(3)} TND** à **${prod.priceRangeTND.max.toFixed(3)} TND**\n` +
        `- **Marques de référence :** ${prod.brand}\n` +
        `- **Spécifications :** ${prod.specs}\n\n` +
        `💡 **Précision technique :** ${prod.notesFr}\n\n` +
        `> *Attention : ce tarif est une estimation du matériel seul constatée en quincaillerie tunisienne. Il ne constitue pas un engagement contractuel. La main d'œuvre et la configuration de l'installation influent sur le devis final.*`,
      provider: "technovolt_knowledge_base",
      isPriceEstimate: true,
      priceDisclaimer: "Prix indicatif marché quincaillerie - hors pose professionnelle",
      quoteCta: true,
      suggestedFollowUps: [
        "Quelle différence entre disjoncteur et différentiel ?",
        "Quelle section de fil pour une climatisation ou chauffe-eau ?",
        "Demander un devis officiel TechnoVolt",
      ],
    };
  }

  // Topic: Disjoncteur vs Différentiel
  if (
    q.includes("différentiel") || q.includes("differentiel") || q.includes("difference") ||
    q.includes("différence") || q.includes("فرق") || q.includes("تفاضلي") || q.includes("rcd") ||
    q.includes("far9") || q.includes("el far9")
  ) {
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### الفرق البسيط بين الديسجونكتور (Disjoncteur) والديفيرانسيال (Différentiel):\n\n` +
          `1. **الديسجونكتور الفرعي (Disjoncteur Divisionnaire 10A / 16A / 20A / 32A) :**\n` +
          `   - **الدور متاعو :** يحمي **الخيوط والماتريال** من السرجارج (Surcharge) كي تخدم برشا ماكينات مع بعضهم، ومن الكور سيركوي (Court-circuit).\n` +
          `   - يمنع الخيوط باش ما تسخنش وما تشعلش فيها النار.\n\n` +
          `2. **القاطع التفاضلي (Interrupteur Différentiel 30mA) :**\n` +
          `   - **الدور متاعو :** يحمي **أرواح العباد** من الصعق والتكهرب.\n` +
          `   - يقيس التوازن بين الفاز والنوتر، أول ما يلقى تسريب متاع ضو (Fuite de courant) هارب للقاعة يفوت 30 ميلي أمبير (مثلاً ماس في الغسالة ولا سخان الماء)، يقص الضو في رمشة عين.\n\n` +
          `⚡ **الخلاصة :** الديسجونكتور يحمي دارك من الحريق، والديفيرانسيال 30mA يحمي حياتك وصغارك من الصعقة.`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "علاش الديفيرانسيال يطيح وحدو؟",
          "قداش سوم الديفيرانسيال 30mA في تونس؟",
        ],
      };
    }

    if (locale === "ar") {
      return {
        reply: `### الفرق الأساسي بين قاطع التيار (Disjoncteur) والقاطع التفاضلي (Différentiel):\n\n` +
          `1. **قاطع التيار الفرعي (Disjoncteur Divisionnaire) :**\n` +
          `   - **دوره :** حماية **الأسلاك والأجهزة** من الحمل الزائد (Surcharge) وقصر الدائرة (Court-circuit).\n` +
          `   - **عياره الشائع :** 10A أو 16A للإنارة، 20A للمآخذ، 32A للمواقد وسخانات المياه الكبيرة.\n\n` +
          `2. **القاطع التفاضلي (Interrupteur Différentiel 30mA) :**\n` +
          `   - **دوره :** حماية **حياة الإنسان** من الصعق الكهربائي عند حدوث تسريب في التيار (Fuite de courant).\n` +
          `   - يقيس الفرق بين التيار الداخل والخارج، ويفصل فورًا عند تسرب تيار أعلى من 30 ميلي أمبير نحو الأرض.\n\n` +
          `🔒 **القاعدة الذهبية :** كلاهما مكمل للآخر وإجباري في أي لوحة كهربائية مطابقة للمواصفات.`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "لماذا يفصل القاطع التفاضلي باستمرار؟",
          "كم يبلغ سعر القاطع التفاضلي 30mA في تونس؟",
        ],
      };
    }

    return {
      reply: `### La différence fondamentale entre un Disjoncteur et un Interrupteur Différentiel :\n\n` +
        `1. **Le Disjoncteur Divisionnaire (ex. 10A, 16A, 20A, 32A) :**\n` +
        `   - **Rôle :** Protège le **matériel et les câbles** contre les surcharges et les courts-circuits.\n` +
        `   - **Déclenchement :** Si vous branchez trop d'appareils sur la même ligne ou si la phase touche le neutre.\n\n` +
        `2. **L'Interrupteur Différentiel 30mA :**\n` +
        `   - **Rôle :** Protège **les personnes** contre l'électrisation et les chocs électriques mortels.\n` +
        `   - **Fonctionnement :** Il mesure la différence entre la phase et le neutre. Dès qu'un courant de fuite vers la terre dépasse 30 milliampères (ex. défaut d'isolement sur un lave-linge), il coupe instantanément le courant.\n\n` +
        `⚡ **En résumé :** Le disjoncteur protège vos câbles des incendies, le différentiel 30mA protège votre vie.`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "Pourquoi mon disjoncteur différentiel saute-t-il ?",
        "Combien coûte un différentiel 30mA 40A en Tunisie ?",
        "Quelle section de fil pour un tableau électrique ?",
      ],
    };
  }

  // Topic: Déclenchement / Pourquoi le disjoncteur saute / 3lech el dhaw yetfa
  if (
    q.includes("saute") || q.includes("déclenche") || q.includes("disjoncte") ||
    q.includes("يفصل") || q.includes("يطيح") || q.includes("يطفى") || q.includes("يضرب") ||
    q.includes("trips") || q.includes("yetfa") || q.includes("yodhrob") || q.includes("yti7")
  ) {
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### علاش الضو يطفى ولا الديسجونكتور يطيح وحدو؟ هاك كيفاش تثبت:\n\n` +
          `1. **شوف شنوة القطعة اللي طاحت بالضبط في اللوحة (Tableau) :**\n` +
          `   - كان طاح **الديفيرانسيال (Différentiel 30mA)** : فما **تسريب ضو (Fuite de courant)** في ماكينة تمس في الحديد ولا ماخذة نداوة (أكثر حاجة سخان الماء Chauffeau، الغسالة، ولا بريز البرة مسو الماء).\n` +
          `   - كان طاح **ديسجونكتور فرعي برك** : فما **سرجارج (Surcharge)** خاطر خدمت ماكينات قوية في نفس الخط، ولا **ماس (Court-circuit)**.\n\n` +
          `2. **طريقة الفحص من غير ما تعرض روحك للخطر :**\n` +
          `   1. هبط القواطع الفرعية الكل (Disjoncteurs).\n` +
          `   2. ارفع الديفيرانسيال الرئيسي (Différentiel).\n` +
          `   3. ابدا ارفع في القواطع واحد ورا واحد : القاطع اللي يطيح الديفيرانسيال فوراً هو اللي فيه المشكل.\n` +
          `   4. افصل الماكينات اللي راكبين في الخط هذاكا بش تعرف شكون الماكينة الفاسدة.\n\n` +
          `⚠️ *كان الديسجونكتور يطرشق ولا يعاود يطيح وما حبش يرجع، ما ترصيش عليه بالقوة، وقص الضو واطلب إلكتريسيان تكنوفولت.*`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "كيفاش نعرف قداش يستهلك المكيف بالدينار؟",
          "طلب تدخل تقني فوري في تطاوين",
        ],
      };
    }

    if (locale === "ar") {
      return {
        reply: `### خطوات تشخيص سبب فصل القاطع الكهربائي بأمان:\n\n` +
          `1. **تحديد القاطع الذي فصل :**\n` +
          `   - إذا كان **القاطع التفاضلي (30mA)** : هناك **تسريب كهربائي نحو الأرض** في أحد الأجهزة (غالبًا سخان ماء، ثلاجة، أو غسالة بها تماس).\n` +
          `   - إذا كان **قاطع فرعي (10A/16A/20A)** : هناك **حمل زائد** (تشغيل عدة أجهزة قوية معًا) أو **قصر دائرة** (تماس مباشر بين سلكين).\n\n` +
          `2. **طريقة الفحص الآمنة :**\n` +
          `   - أنزل جميع القواطع الفرعية.\n` +
          `   - ارفع القاطع التفاضلي.\n` +
          `   - ارفع القواطع الفرعية واحدًا تلو الآخر : القاطع الذي يعيد الفصل فور رفعه هو الدائرة التي تحتوي على العطب.\n` +
          `   - افصل أجهزة تلك الدائرة لمعرفة الجهاز المتسبب.\n\n` +
          `⚠️ إذا استمر العطل دون معرفة السبب، لا ترفع القاطع بالقوة واتصل بفني تكنوفولت المعتمد.`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "ما هي تكلفة فحص وإصلاح عطل كهربائي؟",
          "كيف أتأكد من جودة خط التأريض (la prise de terre)؟",
        ],
      };
    }

    return {
      reply: `### Diagnostic méthodique : Pourquoi votre disjoncteur déclenche-t-il ?\n\n` +
        `1. **Identifiez le composant qui a sauté :**\n` +
        `   - **L'Interrupteur Différentiel 30mA a sauté :** C'est un **défaut d'isolement (fuite de courant à la terre)**. Les coupables fréquents sont le chauffe-eau, le lave-linge, ou une prise extérieure ayant pris l'humidité.\n` +
        `   - **Un Disjoncteur divisionnaire précis a sauté :** C'est une **surcharge** (trop d'appareils allumés sur la même ligne) ou un **court-circuit franc** (câble endommagé ou appareil défectueux).\n\n` +
        `2. **Procédure de localisation simple et sans danger :**\n` +
        `   1. Abaissez tous les disjoncteurs divisionnaires situés sous le différentiel.\n` +
        `   2. Réenclenchez le différentiel 30mA.\n` +
        `   3. Relevez les disjoncteurs un à un. Dès que l'un d'eux fait retomber le différentiel, vous avez isolé la ligne défectueuse.\n` +
        `   4. Débranchez tous les appareils de cette ligne, puis rebranchez-les individuellement pour identifier l'appareil en défaut.\n\n` +
        `⚠️ *Si le disjoncteur saute avec une étincelle ou refuse de se réenclencher, ne forcez jamais la manette : coupez et sollicitez un diagnostic sur site.*`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "Prendre rendez-vous pour un dépannage rapide à Tataouine",
        "Quelle différence entre disjoncteur et différentiel ?",
      ],
    };
  }

  // Topic: Domotique / Smart home / Maison intelligente
  if (
    q.includes("domotique") || q.includes("smart") || q.includes("connecté") || q.includes("connecte") ||
    q.includes("دوموتيك") || q.includes("ذكي") || q.includes("zigbee") || q.includes("shelly") ||
    q.includes("sonoff") || q.includes("maison intelligente") || q.includes("home assistant")
  ) {
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### أسهل وأضمن حلول الدوموتيك (Smart Home) للدار في تونس:\n\n` +
          `1. **نظام Zigbee (الخيار الأقوى والأكثر استقرار في الفيلات) :**\n` +
          `   - يخدم بريزو Mesh خاص بيه وما يثقلش على مودام الـ Wi-Fi.\n` +
          `   - تركب معاه وحدات Sonoff ZBMINI (~45 د.ت) ورا المفاتيح العادية ومستشعرات الحركة والحرارة.\n\n` +
          `2. **نظام الـ Wi-Fi المباشر (مثل Shelly) :**\n` +
          `   - يركب ديركت ورا المفتاح، ومن أحسن ما تجرب لمراقبة استهلاك المكيف وسخان الماء بالكيلوواط (Shelly Plus 1PM ~82 د.ت).\n\n` +
          `3. **التحكم والذكاء :**\n` +
          `   - تنجم تتحكم بالـ Application، Google Home، ولا نظام Home Assistant الاحترافي محلياً.\n\n` +
          `💡 *فريق تكنوفولت يعملك دراسة وتركيب كامل للدوموتيك في تطاوين وسائر الجنوب التونسي.*`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "قداش يكلف تحويل إنارة بيت كامل لإنارة ذكية؟",
          "شنوة الفرق بين الواي فاي وزيغبي في الدوموتيك؟",
          "طلب استشارة دوموتيك من تكنوفولت",
        ],
      };
    }

    return {
      reply: `### Solutions Smart Home & Domotique pour votre logement :\n\n` +
        `1. **Protocole Zigbee (Recommandé pour une installation pérenne) :**\n` +
        `   - **Avantages :** Réseau maillé autonome (Mesh), très faible consommation, n'encombre pas la bande passante de votre box Wi-Fi.\n` +
        `   - **Matériel type :** Micromodules Sonoff ZBMINI (~45 TND), interrupteurs sans fil, capteurs de présence.\n\n` +
        `2. **Protocole Wi-Fi (ex. Shelly) :**\n` +
        `   - **Avantages :** Branchement direct sans passerelle supplémentaire requise.\n` +
        `   - **Matériel type :** Shelly Plus 1PM (~82 TND) avec suivi précis de la puissance consommée en temps réel (Watts).\n\n` +
        `3. **Supervision :**\n` +
        `   - Compatibilité totale avec **Home Assistant**, Google Home ou Apple HomeKit selon votre préférence.\n\n` +
        `🔧 *TechnoVolt conçoit et installe des architectures domotiques sur mesure adaptées aux villas et locaux professionnels à Tataouine.*`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "Comment mesurer la consommation de ma climatisation ?",
        "Combien coûte un module interrupteur connecté Sonoff ?",
        "Demander un diagnostic domotique à TechnoVolt",
      ],
    };
  }

  // Topic: Sections de fils / Wire sizes
  if (
    q.includes("section") || q.includes("câble") || q.includes("cable") || q.includes("fil") ||
    q.includes("5ayt") || q.includes("khayt") || q.includes("قياس") || q.includes("سلك") ||
    q.includes("gauge") || q.includes("wire")
  ) {
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### المقاييس الصحيحة للخيوط والقواطع في الدار (حسب النورم) :\n\n` +
          `- **1.5 مم² :** للإنارة والضو مع ديسجونكتور **10A ولا 16A** (أقصى حاجة 8 لمبات في الخط).\n` +
          `- **2.5 مم² :** للبريزات العادية والمطبخ مع ديسجونكتور **16A ولا 20A** (للغسالة، الفريجيدار، والماكينات العادية).\n` +
          `- **4.0 مم² :** للمكيفات الكبيرة ولا سخان ماء قوي مع ديسجونكتور **25A**.\n` +
          `- **6.0 مم² :** للبلاك شوفانت (Plaque de cuisson) مع ديسجونكتور **32A**.\n` +
          `- **10 إلى 16 مم² :** الخط الرئيسي اللي جاي من عداد الستاغ للوحة التوزيع.\n\n` +
          `⚠️ **رد بالك :** ما تركبش خيط جويد مع ديسجونكتور قوي، راهو الخيط يسخن ويتحرق والديسجونكتور ما يفيقش بيه.`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "قداش سوم رولو خيط 2.5 مم² شكيرة في تونس؟",
          "كيفاش نختار ديسجونكتور للمكيف؟",
        ],
      };
    }

    return {
      reply: `### Normes de section de câbles et disjoncteurs adaptés (Norme NFC 15-100) :\n\n` +
        `- **1.5 mm² :** Disjoncteur **10A ou 16A** → Éclairage (max 8 points lumineux par circuit), VMC.\n` +
        `- **2.5 mm² :** Disjoncteur **16A ou 20A** → Prises de courant classiques (chambres, séjour) et circuits spécialisés (lave-linge, lave-vaisselle, four encastré).\n` +
        `- **4.0 mm² :** Disjoncteur **25A** → Gros climatiseurs, chauffe-eau grande capacité.\n` +
        `- **6.0 mm² :** Disjoncteur **32A** → Plaques de cuisson vitrocéramique/induction, sous-tableaux divisionnaires.\n` +
        `- **10 à 16 mm² :** Câble d'alimentation générale entre compteur STEG et tableau de répartition.\n\n` +
        `⚠️ **Règle absolue :** Ne jamais surcalibrer un disjoncteur : le fil fondrait avant que le disjoncteur ne saute.`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "Quel est le prix d'un rouleau de fil 2.5mm² Chakira ?",
        "Comment dimensionner l'électricité pour une maison neuve ?",
      ],
    };
  }

  // Topic: Consommation / Energy monitoring
  if (
    q.includes("consomm") || q.includes("consomi") || q.includes("تستهلك") ||
    q.includes("استهلاك") || q.includes("kwh") || q.includes("watt") || q.includes("energy")
  ) {
    if (locale === "derja" || locale === "arabizi") {
      return {
        reply: `### كيفاش تحسب استهلاك أي ماكينة (كليم، شوفو) بالدينار التونسي:\n\n` +
          `1. **القاعدة الحسابية الساهلة :**\n` +
          `   - الاستهلاك اليومي بالكيلوواط/ساعة (kWh) = (القوة بالواط × سوايع الخدمة في النهار) ÷ 1000\n\n` +
          `2. **مثال تطبيقي على مكيف 12000 BTU (يستهلك تقريباً 1000 واط) :**\n` +
          `   - كان خدمتو **8 سوايع في النهار** = 8 kWh في النهار.\n` +
          `   - في الشهر = 240 kWh.\n` +
          `   - حسب تسعيرة الستاغ (STEG) المتوسطة (~0.220 إلى 0.350 د.ت للـ kWh حسب البالي) = يكلف تقريباً بين **55 د.ت و 80 د.ت في الشهر**.\n\n` +
          `💡 **نصيحة تكنوفولت :** تركيب مودول ذكي كيم Shelly Plus 1PM يخليك تراقب الاستهلاك لحظة بلحظة بالهاتف وتبرمج توقيف الماكينات أوتوماتيكياً.`,
        provider: "technovolt_knowledge_base",
        suggestedFollowUps: [
          "قداش سوم مودول قياس الاستهلاك Shelly؟",
          "كيفاش نقتصد في فاتورة الستاغ في الصيف؟",
        ],
      };
    }
  }

  // General Derja / Arabizi fallback
  if (locale === "derja" || locale === "arabizi") {
    return {
      reply: `يعيشك وأهلاً بيك! أنا المساعد الذكي لشركة **تكنوفولت (TechnoVolt)** في تطاوين والجنوب التونسي.\n\n` +
        `نجم نعاونك وننصحك في كل ما يخص الدار والماتريال الكهربائي:\n` +
        `- **الأسعار التقريبية في تونس :** ديسجونكتورات، كابلات شكيرة، ديفيرانسيال 30mA، ولوحات التوزيع.\n` +
        `- **الأعطاب والتصليح :** علاش الديسجونكتور يطيح، ماس كهربائي، ولا ضو يرجف.\n` +
        `- **الدوموتيك والتحكم الذكي :** كيفاش ترد الإنارة والمكيف يتحكمو بالهاتف مع Sonoff و Shelly.\n` +
        `- **حساب المقاييس :** قياس الخيوط المناسب للمكيف وسخان الماء.\n\n` +
        `شنوة السؤال ولا المشروع اللي تحب نسألو ونحكيو فيه؟`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "قداش سوم ديسجونكتور في تونس؟",
        "شنوة الفرق بين الديسجونكتور والديفيرانسيال؟",
        "علاش الضو يطفى وحدو؟",
      ],
    };
  }

  // General Standard Arabic fallback
  if (locale === "ar") {
    return {
      reply: `أهلاً بك! بصفتي المساعد الذكي لشركة **تكنوفولت** في تطاوين، يسعدني الإجابة عن كل ما يتعلق بالتمديدات الكهربائية، حماية اللوحات، الدوموتيك وتقديرات المواد بالدينار التونسي.\n\n` +
        `يمكنني إرشادك في:\n` +
        `- اختيار القواطع المناسبة والمقاييس السليمة للأسلاك.\n` +
        `- أسعار المكونات المتداولة في السوق التونسية (شنايدر، هاجر، شكيرة، سونوف).\n` +
        `- كيفية تأمين منزلك من الصعق الكهربائي والحرائق.\n` +
        `- حلول التحكم الذكي والإنارة الموفرة للطاقة.\n\n` +
        `ما هو الاستفسار أو المشروع الذي ترغب في مناقشته؟`,
      provider: "technovolt_knowledge_base",
      suggestedFollowUps: [
        "كم تكلفة تجديد لوحة كهربائية في تونس؟",
        "كيف أحسب استهلاك مكيف الهواء؟",
        "ما هو السلك المناسب لسخان الماء؟",
      ],
    };
  }

  // Default French fallback
  return {
    reply: `Bonjour ! En tant qu'assistant technique **TechnoVolt**, je suis à votre écoute pour toutes vos questions relatives aux installations électriques, à la sécurité, aux prix du matériel en Tunisie (TND) et à la domotique.\n\n` +
      `Je peux notamment vous aider à :\n` +
      `- **Dimensionner vos circuits :** sections de câbles (1.5mm², 2.5mm², 6mm²), calibres de disjoncteurs et protection 30mA.\n` +
      `- **Estimer vos budgets matériel :** prix indicatifs des disjoncteurs, câbles Chakira, modules connectés et tableaux.\n` +
      `- **Diagnostiquer des pannes courantes :** disjoncteur qui saute, échauffement, fuites de terre.\n` +
      `- **Concevoir votre domotique :** modules Zigbee/Wi-Fi, suivi de consommation d'énergie.\n\n` +
      `Quel est votre besoin ou le point technique que vous aimeriez éclaircir ?`,
    provider: "technovolt_knowledge_base",
    suggestedFollowUps: [
      "Combien coûte un disjoncteur en Tunisie ?",
      "Quelle différence entre disjoncteur et différentiel ?",
      "Comment choisir un interrupteur connecté ?",
    ],
  };
}

/**
 * Main AI Query Executor
 */
export async function executeBotQuery(
  messages: BotChatMessage[],
  clientLocale?: string
): Promise<BotResponsePayload> {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) {
    throw new Error("Message content cannot be empty.");
  }

  const queryText = lastMessage.content.trim();
  const inferredStyle = detectLocale(queryText);

  // If the query is specifically Derja or Arabizi, prioritize that dialect
  const effectiveLocale: BotLocale =
    inferredStyle === "derja" || inferredStyle === "arabizi"
      ? inferredStyle
      : ((clientLocale as BotLocale) || inferredStyle);

  // 1. Domain guardrail analysis
  const analysis = analyzeUserQuery(queryText);

  // Strict domain refusal for out-of-scope queries
  if (analysis.isOffScope) {
    return {
      reply: OUT_OF_SCOPE_RESPONSES[effectiveLocale] || OUT_OF_SCOPE_RESPONSES.derja || OUT_OF_SCOPE_RESPONSES.fr,
      provider: "technovolt_knowledge_base",
      isSafetyAlert: false,
      suggestedFollowUps: [
        effectiveLocale === "derja" || effectiveLocale === "arabizi"
          ? "قداش سوم ديسجونكتور في تونس؟"
          : effectiveLocale === "ar"
          ? "ما هي أسعار القواطع في تونس؟"
          : "Combien coûte un disjoncteur en Tunisie ?",
        effectiveLocale === "derja" || effectiveLocale === "arabizi"
          ? "علاش الضو يطفى وحدو في الدار؟"
          : effectiveLocale === "ar"
          ? "كيف أختار مقاس سلك المكيف؟"
          : "Quelle section de câble pour une climatisation ?",
      ],
    };
  }

  // Emergency safety prefix if severe hazard detected
  const emergencyPrefix = analysis.isEmergency
    ? `${EMERGENCY_ALERT[effectiveLocale] || EMERGENCY_ALERT.derja || EMERGENCY_ALERT.fr}\n\n---\n\n`
    : "";

  // 2. Check for configured AI Provider keys
  const openrouterApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_TECHNOVOLT;
  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const customAiKey = process.env.TECHNOVOLT_AI_API_KEY;
  const customAiBaseUrl = process.env.TECHNOVOLT_AI_BASE_URL;

  // Try OpenRouter if configured
  if (openrouterApiKey) {
    try {
      const liveReply = await callOpenRouterApi(openrouterApiKey, messages);
      return {
        reply: emergencyPrefix + liveReply,
        provider: "openrouter",
        isSafetyAlert: analysis.isEmergency,
        quoteCta: true,
      };
    } catch (err) {
      console.warn("OpenRouter provider call failed, falling back to TechnoVolt knowledge engine:", err);
    }
  }

  // Try live provider if configured
  if (groqApiKey) {
    try {
      const liveReply = await callGroqApi(groqApiKey, messages);
      return {
        reply: emergencyPrefix + liveReply,
        provider: "groq",
        isSafetyAlert: analysis.isEmergency,
        quoteCta: true,
      };
    } catch (err) {
      console.warn("Groq provider call failed, falling back to TechnoVolt knowledge engine:", err);
    }
  }

  if (openaiApiKey) {
    try {
      const liveReply = await callOpenAiApi(openaiApiKey, messages);
      return {
        reply: emergencyPrefix + liveReply,
        provider: "openai",
        isSafetyAlert: analysis.isEmergency,
        quoteCta: true,
      };
    } catch (err) {
      console.warn("OpenAI provider call failed, falling back to TechnoVolt knowledge engine:", err);
    }
  }

  if (geminiApiKey) {
    try {
      const liveReply = await callGeminiApi(geminiApiKey, messages);
      return {
        reply: emergencyPrefix + liveReply,
        provider: "gemini",
        isSafetyAlert: analysis.isEmergency,
        quoteCta: true,
      };
    } catch (err) {
      console.warn("Gemini provider call failed, falling back to TechnoVolt knowledge engine:", err);
    }
  }

  if (customAiKey && customAiBaseUrl) {
    try {
      const liveReply = await callOpenAiCompatibleApi(customAiBaseUrl, customAiKey, messages);
      return {
        reply: emergencyPrefix + liveReply,
        provider: "openai-compatible",
        isSafetyAlert: analysis.isEmergency,
        quoteCta: true,
      };
    } catch (err) {
      console.warn("Custom AI provider call failed, falling back to TechnoVolt knowledge engine:", err);
    }
  }

  // 3. Fallback to comprehensive built-in TechnoVolt Domain Knowledge Engine
  const baseResult = generateDomainKnowledgeAnswer(queryText, effectiveLocale);
  if (emergencyPrefix) {
    baseResult.reply = emergencyPrefix + baseResult.reply;
    baseResult.isSafetyAlert = true;
  }
  return baseResult;
}

/**
 * Call Groq (Llama 3.3 70B Versatile)
 */
async function callGroqApi(apiKey: string, messages: BotChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.TECHNOVOLT_AI_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-8)],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Groq HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call OpenAI (gpt-4o-mini)
 */
async function callOpenAiApi(apiKey: string, messages: BotChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.TECHNOVOLT_AI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-8)],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`OpenAI HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call Google Gemini
 */
async function callGeminiApi(apiKey: string, messages: BotChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const model = process.env.TECHNOVOLT_AI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const formattedContents = messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call generic OpenAI-compatible API
 */
async function callOpenAiCompatibleApi(
  baseUrl: string,
  apiKey: string,
  messages: BotChatMessage[]
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const endpoint = baseUrl.endsWith("/chat/completions")
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.TECHNOVOLT_AI_MODEL || "default",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-8)],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`OpenAI-compatible HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call OpenRouter API (meta-llama/llama-3.3-70b-instruct or configured model)
 */
async function callOpenRouterApi(apiKey: string, messages: BotChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const model = process.env.TECHNOVOLT_AI_MODEL || "meta-llama/llama-3.3-70b-instruct";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://technovolt.vercel.app",
        "X-Title": "TechnoVolt Bot",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-8)],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}
