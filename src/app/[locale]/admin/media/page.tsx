"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Image as ImageIcon,
  Upload,
  X,
  Trash2,
  Folder,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  folder: string;
  altTextFr: string;
  altTextAr: string;
  uploadedAt: string;
}

const initialMedia: MediaItem[] = [
  {
    id: "med-01",
    name: "logo-technovolt.jpg",
    url: "/logo.jpg",
    size: "184 KB",
    folder: "Branding",
    altTextFr: "Logo officiel TECHNOVOLT Électricité Générale et Domotique",
    altTextAr: "شعار تكنوفولت للكهرباء العامة والتحكم الذكي",
    uploadedAt: "2026-10-24",
  },
  {
    id: "med-02",
    name: "technovolt-chantier-01.jpg",
    url: "/images/projects/technovolt-chantier-01.jpg",
    size: "145 KB",
    folder: "Chantiers",
    altTextFr: "Tableau électrique modulaire triphasé installé dans une villa à Tataouine",
    altTextAr: "خزانة كهربائية ثلاثية الأطوار مثبتة في فيلا بتطاوين",
    uploadedAt: "2026-10-24",
  },
  {
    id: "med-03",
    name: "technovolt-chantier-03.jpg",
    url: "/images/projects/technovolt-chantier-03.jpg",
    size: "138 KB",
    folder: "Climatisation",
    altTextFr: "Installation soignée unité et liaisons climatiseur",
    altTextAr: "تركيب وحدة وتوصيلات مكيف هواء",
    uploadedAt: "2026-10-24",
  },
  {
    id: "med-04",
    name: "technovolt-chantier-04.jpg",
    url: "/images/projects/technovolt-chantier-04.jpg",
    size: "162 KB",
    folder: "Domotique",
    altTextFr: "Installation éclairage LED moderne et domotique",
    altTextAr: "تركيب إضاءة ليد عصرية وتحكم ذكي",
    uploadedAt: "2026-10-24",
  },
];

const STORAGE_KEY = "technovolt_admin_media";

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [formAltFr, setFormAltFr] = useState("");
  const [formFolder, setFormFolder] = useState("Chantiers");
  const [formSize, setFormSize] = useState("-");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = ["all", "Branding", "Chantiers", "Climatisation", "Domotique"];

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMediaList(parsed);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveMediaList = (next: MediaItem[]) => {
    setMediaList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const filteredMedia =
    selectedFolder === "all"
      ? mediaList
      : mediaList.filter((m) => m.folder === selectedFolder);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteMedia = (id: string) => {
    if (confirm("Supprimer ce fichier média ?")) {
      saveMediaList(mediaList.filter((m) => m.id !== id));
      setToastMessage("Fichier supprimé.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleProcessFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Format d'image non valide. Veuillez importer un fichier PNG, JPG, WebP ou SVG.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setErrorMsg("Le fichier est trop volumineux. La taille maximale autorisée est de 5 Mo.");
      return;
    }

    const kbSize = Math.round(file.size / 1024) + " KB";
    setFormSize(kbSize);
    if (!formName) {
      setFormName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setFormPreview(e.target.result);
        setFormUrl(e.target.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      setErrorMsg("Veuillez sélectionner un fichier ou indiquer une URL.");
      return;
    }
    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      name: formName.trim(),
      url: formUrl.trim(),
      size: formSize,
      folder: formFolder,
      altTextFr: formAltFr.trim() || formName.trim(),
      altTextAr: "",
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    saveMediaList([newItem, ...mediaList]);
    setToastMessage("Fichier ajouté avec succès !");
    setTimeout(() => setToastMessage(null), 3500);
    setIsModalOpen(false);
    setFormName("");
    setFormUrl("");
    setFormPreview(null);
    setFormAltFr("");
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-[#0B69FF]" />
            <span>Médiathèque & Fichiers (Media Assets)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion centralisée des photos de chantiers, logos et documents hébergés
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="gap-1.5 font-semibold text-xs"
          onClick={() => {
            setErrorMsg(null);
            setFormPreview(null);
            setIsModalOpen(true);
          }}
        >
          <Upload className="h-4 w-4" />
          <span>Téléverser un Fichier</span>
        </Button>
      </div>

      {/* Folders & Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <Folder className="h-4 w-4 text-slate-400 ms-2" />
        <span className="text-xs font-semibold text-slate-600 me-2">Dossiers :</span>
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFolder(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedFolder === f
                ? "bg-[#0B69FF] text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? "Tous les fichiers" : f}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
          >
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image
                src={item.url}
                alt={item.altTextFr}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover"
              />
              <div className="absolute top-2 start-2">
                <span className="inline-block px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold backdrop-blur-md">
                  {item.folder}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="font-bold text-slate-900 text-xs truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{item.size}</span>
                  <span>{item.uploadedAt}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 p-1.5 rounded">
                ALT: {item.altTextFr}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => copyUrl(item.url, item.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#0B69FF] hover:underline font-medium"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copier URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => deleteMedia(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredMedia.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            Aucun fichier média dans ce dossier.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#0B69FF]" />
                <span>Téléverser un Fichier Média</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sélectionner un fichier (depuis l'appareil ou glisser-déposer)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#0B69FF] bg-blue-50/50"
                      : "border-slate-300 hover:border-[#0B69FF] bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? "text-[#0B69FF]" : "text-slate-400"}`} />
                  <p className="text-xs font-semibold text-slate-700">
                    Glissez une image ici ou <span className="text-[#0B69FF] underline">parcourez vos fichiers</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WebP ou SVG (Max. 5 Mo)
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs font-semibold gap-1.5 h-8 bg-white"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#0B69FF]" />
                      <span>Importer depuis l'appareil</span>
                    </Button>
                  </div>
                </div>
              </div>

              {formPreview && (
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-20 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={formPreview}
                        alt="Aperçu"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">{formName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{formSize}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] h-7 px-2.5 bg-white"
                    >
                      Remplacer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormPreview(null);
                        setFormUrl("");
                        setFormSize("-");
                        setFormName("");
                      }}
                      className="text-[11px] h-7 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200 bg-white"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du fichier *</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: tableau-electrique-villa.jpg"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dossier de classement</label>
                <select
                  value={formFolder}
                  onChange={(e) => setFormFolder(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {["Branding", "Chantiers", "Climatisation", "Domotique"].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texte alternatif (SEO & Accessibilité)</label>
                <Input
                  value={formAltFr}
                  onChange={(e) => setFormAltFr(e.target.value)}
                  placeholder="Description détaillée de la photo"
                  className="h-10 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-medium"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
                >
                  Enregistrer l'image
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
