"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ALL_CHANTIER_PHOTOS } from "@/lib/data/galleryPhotos";
import { Button } from "@/components/ui/Button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MapPin,
  Layers,
} from "lucide-react";

interface ProjectsGalleryProps {
  locale: string;
}

export function ProjectsGallery({ locale }: ProjectsGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  const categories = [
    {
      id: "all",
      label:
        locale === "ar"
          ? "جميع الصور (74)"
          : locale === "en"
          ? "All Photos (74)"
          : "Toutes les réalisations (74)",
    },
    {
      id: "tableaux",
      label:
        locale === "ar"
          ? "لوحات كهربائية"
          : locale === "en"
          ? "Electrical Panels"
          : "Tableaux & Armoires",
    },
    {
      id: "cablage",
      label:
        locale === "ar"
          ? "كابلات وتمديدات"
          : locale === "en"
          ? "Wiring & Conduits"
          : "Câblage & Gaines",
    },
    {
      id: "eclairage",
      label:
        locale === "ar"
          ? "إضاءة ليد"
          : locale === "en"
          ? "LED Lighting"
          : "Éclairage LED",
    },
    {
      id: "climatisation",
      label:
        locale === "ar"
          ? "تكييف وتبريد"
          : locale === "en"
          ? "Air Conditioning"
          : "Climatisation",
    },
    {
      id: "villas",
      label:
        locale === "ar"
          ? "فلل ومشاريع"
          : locale === "en"
          ? "Villas & Buildings"
          : "Villas & Chantiers",
    },
  ];

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "all") return ALL_CHANTIER_PHOTOS;
    return ALL_CHANTIER_PHOTOS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  const activePhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => ((prev! + 1) % filteredPhotos.length));
  };

  const handlePrev = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <div className="space-y-8">
      {/* Gallery Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0B69FF] uppercase tracking-wider mb-2">
            <Layers className="h-4 w-4 text-[#F5A623]" />
            <span>
              {locale === "ar"
                ? "معرض صور الأشغال الميدانية"
                : locale === "en"
                ? "On-Site Works Gallery"
                : "Galerie Photos des Chantiers Réels"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {locale === "ar"
              ? "74 صورة توثق جودة ودقة عملنا الميداني"
              : locale === "en"
              ? "74 Photos Showcasing Our Workmanship"
              : "74 Photographies de nos Interventions Réelles"}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {locale === "ar"
              ? "استكشف صوراً حقيقية لأعمال التركيب والتسليك والخزانات الكهربائية والتكييف المنجزة في تطاوين."
              : locale === "en"
              ? "Explore authentic photos of electrical wiring, panels, lighting and AC installations in Tataouine."
              : "Explorez nos réalisations concrètes : raccordements, armoires modulaires, passages de câbles et climatisation à Tataouine."}
          </p>
        </div>

        {/* Categories selector */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setVisibleCount(24);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#0B69FF] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayedPhotos.map((photo, idx) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhotoIndex(idx)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer border border-slate-200 hover:border-[#0B69FF] shadow-xs hover:shadow-lg transition-all duration-300"
          >
            <Image
              src={photo.src}
              alt={photo.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <div className="flex justify-end">
                <span className="p-1 rounded bg-black/60 text-white backdrop-blur-xs">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F5A623] text-slate-900 mb-1">
                  {photo.categoryLabel[locale as "fr" | "ar" | "en"] || photo.categoryLabel.fr}
                </span>
                <p className="text-[11px] font-semibold text-white truncate">
                  {photo.titleByLocale?.[locale as "fr" | "ar" | "en"] || photo.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredPhotos.length && (
        <div className="text-center pt-4">
          <Button
            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredPhotos.length))}
            variant="outline"
            className="font-semibold text-xs border-slate-300 hover:bg-slate-100"
          >
            {locale === "ar"
              ? `عرض المزيد من الصور (${filteredPhotos.length - visibleCount} متبقية)`
              : locale === "en"
              ? `Load More Photos (${filteredPhotos.length - visibleCount} remaining)`
              : `Afficher plus de photos (${filteredPhotos.length - visibleCount} restantes)`}
          </Button>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && selectedPhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white max-w-6xl mx-auto w-full z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0B69FF] text-white">
                {activePhoto.categoryLabel[locale as "fr" | "ar" | "en"] || activePhoto.categoryLabel.fr}
              </span>
              <span className="text-xs text-slate-300">
                {selectedPhotoIndex + 1} / {filteredPhotos.length}
              </span>
            </div>

            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center Image with Previous / Next */}
          <div className="relative flex-1 flex items-center justify-center my-4 max-w-5xl mx-auto w-full">
            <button
              onClick={handlePrev}
              className="absolute start-2 sm:start-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="relative w-full h-[70vh] max-h-[750px]">
              <Image
                src={activePhoto.src}
                alt={activePhoto.title}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            <button
              onClick={handleNext}
              className="absolute end-2 sm:end-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
              aria-label="Suivant"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Caption & Location */}
          <div className="max-w-6xl mx-auto w-full bg-white/10 backdrop-blur-md rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {activePhoto.titleByLocale?.[locale as "fr" | "ar" | "en"] || activePhoto.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {activePhoto.description[locale as "fr" | "ar" | "en"] || activePhoto.description.fr}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#F5A623] shrink-0 font-medium">
              <MapPin className="h-4 w-4" />
              <span>{activePhoto.location}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
