"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Globe,
  Save,
  CheckCircle2,
  Search,
  ExternalLink,
} from "lucide-react";

interface SeoPageConfig {
  path: string;
  name: string;
  titleFr: string;
  titleAr: string;
  descFr: string;
  descAr: string;
  indexable: boolean;
}

const initialSeoPages: SeoPageConfig[] = [
  {
    path: "/",
    name: "Page d'Accueil",
    titleFr: "TECHNOVOLT — Électricité générale & Domotique à Tataouine, Tunisie",
    titleAr: "تكنوفولت — كهرباء عامة وأنظمة تحكم ذكي بتطاوين، تونس",
    descFr: "Installation électrique certifiée, dépannage rapide, climatisation et domotique à Tataouine et environs. Devis gratuit sous 24h.",
    descAr: "تركيب وصيانة كهربائية، كشف الأعطال، مكيفات هواء وأنظمة ذكية في تطاوين وضواحيها. خدمات موثوقة وفريق فني محترف.",
    indexable: true,
  },
  {
    path: "/services",
    name: "Catalogue Services",
    titleFr: "Nos Services Électriques & Climatisation | TECHNOVOLT Tataouine",
    titleAr: "خدماتنا الكهربائية والتكييف | تكنوفولت تطاوين",
    descFr: "Découvrez nos prestations en électricité générale, climatisation, pose de chauffe-eau et domotique dans tout le gouvernorat de Tataouine.",
    descAr: "تعرف على خدماتنا المتنوعة في الكهرباء العامة، التكييف، السخانات، والتحكم الذكي بولاية تطاوين.",
    indexable: true,
  },
  {
    path: "/quote",
    name: "Demande de Devis",
    titleFr: "Demande de Devis Gratuit Électricité | TECHNOVOLT",
    titleAr: "طلب عرض سعر مجاني للكهرباء | تكنوفولت",
    descFr: "Obtenez un devis précis et sans engagement pour vos travaux d'électricité ou de climatisation à Tataouine.",
    descAr: "احصل على عرض سعر دقيق ومجاني لأعمال الكهرباء أو التكييف في تطاوين.",
    indexable: true,
  },
];

export default function AdminSeoPage() {
  const [pages, setPages] = useState<SeoPageConfig[]>(initialSeoPages);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const updatePage = (idx: number, field: keyof SeoPageConfig, val: any) => {
    const updated = [...pages];
    updated[idx] = { ...updated[idx], [field]: val };
    setPages(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-[#0B69FF]" />
            <span>Référencement Naturel & SEO Local (Tataouine)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Optimisation des balises méta, titres Google et aperçus réseaux sociaux
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>Balises SEO mises à jour !</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {pages.map((p, idx) => (
          <div
            key={p.path}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{p.name}</span>
                <span className="font-mono text-xs text-slate-400">({p.path})</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.indexable}
                  onChange={(e) => updatePage(idx, "indexable", e.target.checked)}
                  className="rounded text-[#0B69FF]"
                />
                <span>Indexable par Google (index, follow)</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Balise Titre Google (Français)
                </label>
                <Input
                  value={p.titleFr}
                  onChange={(e) => updatePage(idx, "titleFr", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 text-end">
                  Balise Titre Google (العربية)
                </label>
                <Input
                  dir="rtl"
                  value={p.titleAr}
                  onChange={(e) => updatePage(idx, "titleAr", e.target.value)}
                  className="text-xs text-end"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Méta Description (Français - 160 caractères max)
                </label>
                <Textarea
                  rows={2}
                  value={p.descFr}
                  onChange={(e) => updatePage(idx, "descFr", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 text-end">
                  Méta Description (العربية)
                </label>
                <Textarea
                  dir="rtl"
                  rows={2}
                  value={p.descAr}
                  onChange={(e) => updatePage(idx, "descAr", e.target.value)}
                  className="text-xs text-end"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="submit" variant="default" size="lg" className="gap-2 font-bold">
            <Save className="h-5 w-5" />
            <span>Enregistrer les Métadonnées SEO</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
