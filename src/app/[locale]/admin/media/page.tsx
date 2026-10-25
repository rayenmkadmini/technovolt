"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Image as ImageIcon,
  Upload,
  X,
  Trash2,
  Folder,
  Eye,
  Copy,
  Check,
  Search,
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

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAltFr, setFormAltFr] = useState("");
  const [formFolder, setFormFolder] = useState("Chantiers");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const folders = ["all", "Branding", "Chantiers", "Climatisation", "Domotique"];

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
      setMediaList(mediaList.filter((m) => m.id !== id));
    }
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

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
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
      </div>

    {isModalOpen && (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#0B69FF]" />
              <span>Téléverser un Fichier</span>
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formName.trim() || !formUrl.trim()) {
                alert("Veuillez saisir le nom et l'URL du fichier.");
                return;
              }
              const newItem: MediaItem = {
                id: `med-${Date.now()}`,
                name: formName.trim(),
                url: formUrl.trim(),
                size: "-",
                folder: formFolder,
                altTextFr: formAltFr.trim(),
                altTextAr: "",
                uploadedAt: new Date().toISOString().slice(0, 10),
              };
              setMediaList([newItem, ...mediaList]);
              setToastMessage("Fichier ajouté avec succès !");
              setTimeout(() => setToastMessage(null), 3500);
              setIsModalOpen(false);
              setFormName("");
              setFormUrl("");
              setFormAltFr("");
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du fichier *</label>
              <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ex: photo-chantier.jpg" className="h-10 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL / chemin du fichier *</label>
              <Input required value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="/images/projects/..." className="h-10 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dossier</label>
              <select value={formFolder} onChange={(e) => setFormFolder(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                {["Branding", "Chantiers", "Climatisation", "Domotique"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Texte alternatif (FR)</label>
              <Input value={formAltFr} onChange={(e) => setFormAltFr(e.target.value)} placeholder="Description de l'image" className="h-10 text-sm" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
              <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Ajouter</Button>
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
