"use client";

import { useState, useMemo } from "react";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { ALL_CHANTIER_PHOTOS } from "@/lib/data/galleryPhotos";
import { Button } from "@/components/ui/Button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MapPin,
  Layers,
  Play,
  Video,
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
          ? `جميع الأعمال (${ALL_CHANTIER_PHOTOS.length})`
          : locale === "en"
          ? `All Works (${ALL_CHANTIER_PHOTOS.length})`
          : `Toutes les réalisations (${ALL_CHANTIER_PHOTOS.length})`,
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
      id: "cablage",
      label:
        locale === "ar"
          ? "كابلات وتمديدات"
          : locale === "en"
          ? "Wiring & Conduits"
          : "Câblage & Gaines",
    },
    {
      id: "plans",
      label:
        locale === "ar"
          ? "مخططات ودراسات"
          : locale === "en"
          ? "Blueprints & Engineering"
          : "Bureau d'Études",
    },
    {
      id: "videos",
      label:
        locale === "ar"
          ? "فيديوهات المشاريع"
          : locale === "en"
          ? "Project Videos"
          : "Vidéos Chantiers",
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
                ? "معرض صور وفيديوهات الأشغال الميدانية"
                : locale === "en"
                ? "On-Site Works & Videos Gallery"
                : "Galerie Photos & Vidéos des Chantiers Réels"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {locale === "ar"
              ? "توثيق ميداني حي لأعمال وإنجازات تكنوفولت"
              : locale === "en"
              ? "Authentic Field Documentation of TECHNOVOLT Works"
              : "Documentation Réelle des Travaux TECHNOVOLT sur le Terrain"}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {locale === "ar"
              ? "استكشف صوراً وفيديوهات حقيقية لأعمال التركيب والتسليك والخزانات الكهربائية والتكييف والإنارة المعمارية المنجزة في تطاوين."
              : locale === "en"
              ? "Explore authentic photos and video demonstrations of electrical wiring, panels, architectural lighting, and AC systems in Tataouine."
              : "Explorez nos réalisations concrètes en images et vidéos : raccordements, armoires modulaires, éclairage architectural et climatisation à Tataouine."}
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

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayedPhotos.map((photo, idx) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhotoIndex(idx)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer border border-slate-200 hover:border-[#0B69FF] shadow-xs hover:shadow-lg transition-all duration-300"
          >
            {photo.type === "video" ? (
              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                {photo.posterSrc ? (
                  <OptimizedImage
                    src={photo.thumbnailSrc || photo.posterSrc}
                    variant="thumbnail"
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-white ms-0.5" />
                  </div>
                </div>
                {photo.duration && (
                  <div className="absolute top-2 end-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">
                    {Math.round(photo.duration)}s
                  </div>
                )}
              </div>
            ) : (
              <OptimizedImage
                src={photo.thumbnailSrc || photo.src}
                variant="thumbnail"
                alt={photo.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-none">
              <div className="flex justify-end">
                <span className="p-1 rounded bg-black/60 text-white backdrop-blur-xs">
                  {photo.type === "video" ? (
                    <Video className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
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
              ? `عرض المزيد من الأعمال (${filteredPhotos.length - visibleCount} متبقية)`
              : locale === "en"
              ? `Load More Works (${filteredPhotos.length - visibleCount} remaining)`
              : `Afficher plus de réalisations (${filteredPhotos.length - visibleCount} restantes)`}
          </Button>
        </div>
      )}

      {/* Lightbox / Video Modal */}
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

          {/* Center Image or Video with Previous / Next */}
          <div className="relative flex-1 flex items-center justify-center my-4 max-w-5xl mx-auto w-full">
            <button
              onClick={handlePrev}
              className="absolute start-2 sm:start-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="relative w-full h-[70vh] max-h-[750px] flex items-center justify-center">
              {activePhoto.type === "video" ? (
                <video
                  src={activePhoto.src}
                  poster={activePhoto.posterSrc}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl bg-black border border-white/10"
                />
              ) : (
                <OptimizedImage
                  src={activePhoto.src}
                  variant="large"
                  alt={activePhoto.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-contain"
                  priority
                />
              )}
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
