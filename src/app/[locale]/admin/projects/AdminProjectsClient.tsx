"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ALL_CHANTIER_PHOTOS } from "@/lib/data/galleryPhotos";
import {
  Image as ImageIcon,
  Plus,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  location: string;
  completion_date?: string;
  description: string;
  cover_image: string;
  is_featured?: boolean;
}

interface AdminProjectsClientProps {
  initialProjects: ProjectItem[];
}

const STORAGE_KEY = "technovolt_admin_projects";

export function AdminProjectsClient({ initialProjects }: AdminProjectsClientProps) {
  // Always initialize with initialProjects for 100% server/client hydration consistency
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Load from localStorage safely after mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTimeout(() => {
            setProjects(parsed);
          }, 0);
        }
      }
    } catch {
      // Fallback to initial
    }
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Électricité Générale");
  const [formLocation, setFormLocation] = useState("Tataouine, Tunisie");
  const [formDate, setFormDate] = useState("2026-10");
  const [formDescription, setFormDescription] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("/images/projects/technovolt-chantier-01.jpg");
  const [formIsFeatured, setFormIsFeatured] = useState(true);

  // Photo Picker Drawer/Modal state
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save to LocalStorage whenever projects state changes
  const saveProjects = (newProjects: ProjectItem[]) => {
    setProjects(newProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to save projects to localStorage", e);
    }
  };

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormTitle("");
    setFormCategory("Électricité Générale");
    setFormLocation("Tataouine Ville, Tunisie");
    setFormDate(new Date().toISOString().slice(0, 7));
    setFormDescription("");
    setFormCoverImage("/images/projects/technovolt-chantier-01.jpg");
    setFormIsFeatured(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormTitle(proj.title);
    setFormCategory(proj.category);
    setFormLocation(proj.location);
    setFormDate(proj.completion_date || "");
    setFormDescription(proj.description);
    setFormCoverImage(proj.cover_image);
    setFormIsFeatured(proj.is_featured ?? true);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Veuillez saisir un titre de projet.");
      return;
    }

    if (editingProject) {
      // Edit existing
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              title: formTitle.trim(),
              category: formCategory,
              location: formLocation.trim(),
              completion_date: formDate,
              description: formDescription.trim(),
              cover_image: formCoverImage,
              is_featured: formIsFeatured,
            }
          : p
      );
      saveProjects(updated);
      showToast("Projet modifié avec succès !");
    } else {
      // Add new
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        location: formLocation.trim(),
        completion_date: formDate,
        description: formDescription.trim(),
        cover_image: formCoverImage,
        is_featured: formIsFeatured,
      };
      saveProjects([newProj, ...projects]);
      showToast("Nouveau projet ajouté avec succès !");
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
    setDeleteConfirmId(null);
    showToast("Projet supprimé.");
  };

  const handleResetDefaults = () => {
    if (confirm("Réinitialiser tous les projets avec les données d'origine ?")) {
      saveProjects(initialProjects);
      showToast("Projets réinitialisés avec succès.");
    }
  };

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "all", label: "Toutes les catégories" },
    { id: "électricité", label: "Électricité Générale" },
    { id: "armoire", label: "Armoires & Tableaux" },
    { id: "domotique", label: "Domotique" },
    { id: "climatisation", label: "Climatisation" },
    { id: "éclairage", label: "Éclairage LED" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-[#0B69FF]" />
            <span>Gestion des Projets & Portfolio (CRUD)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ajouter, modifier ou supprimer les chantiers et sélectionner parmi les 74 photos réelles de Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Par défaut</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenAdd}
            className="gap-1.5 font-bold text-xs bg-[#0B69FF] hover:bg-[#0848B8] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Projet</span>
          </Button>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, ville..."
            className="ps-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? "bg-[#0B69FF] text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => (
          <div
            key={proj.id}
            className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                <Image
                  src={proj.cover_image}
                  alt={proj.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 start-3">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#0B69FF]/90 text-white text-[11px] font-semibold backdrop-blur-md">
                    {proj.category}
                  </span>
                </div>
                {proj.is_featured && (
                  <div className="absolute top-3 end-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-900 text-[10px] font-bold shadow-xs">
                      <Sparkles className="h-3 w-3" />
                      <span>En vedette</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                    <span>{proj.location}</span>
                  </span>
                  {proj.completion_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{proj.completion_date}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0B69FF] transition-colors line-clamp-1">
                  {proj.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ID: {proj.id.slice(0, 10)}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(proj)}
                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-[#0B69FF] gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(proj.id)}
                  className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200 border-slate-200 gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Supprimer</span>
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700">Aucun projet trouvé</h4>
            <p className="text-xs text-slate-500 mt-1">
              Essayez une autre recherche ou ajoutez un nouveau projet.
            </p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingProject ? (
                  <>
                    <Edit className="h-5 w-5 text-[#0B69FF]" />
                    <span>Modifier le Projet</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-[#0B69FF]" />
                    <span>Ajouter un Nouveau Projet</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre du Projet *
                </label>
                <Input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Rénovation Électrique Villa Moderne"
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    <option value="Électricité Générale">Électricité Générale</option>
                    <option value="Tableaux & Armoires">Tableaux & Armoires</option>
                    <option value="Domotique & Contrôle">Domotique & Contrôle</option>
                    <option value="Climatisation">Climatisation</option>
                    <option value="Éclairage LED">Éclairage LED</option>
                    <option value="Dépannage & Maintenance">Dépannage & Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emplacement (Tataouine)
                  </label>
                  <Input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ex: Tataouine Ville, Ghomrassen..."
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date de Réalisation
                </label>
                <Input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="Ex: 2026-10 ou Octobre 2026"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description Détaillée
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Précisez les travaux réalisés, le type d'installation et les équipements installés..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B69FF]"
                />
              </div>

              {/* Photo Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Photo du Projet (74 photos disponibles)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(true)}
                    className="text-xs font-bold text-[#0B69FF] hover:underline flex items-center gap-1"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Choisir parmi les 74 chantiers</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                    <Image
                      src={formCoverImage}
                      alt="Prévisualisation"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Input
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    placeholder="/images/projects/technovolt-chantier-01.jpg"
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]"
                />
                <label htmlFor="featured-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Mettre en vedette sur la page d'accueil et le portfolio
                </label>
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
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#0848B8]"
                >
                  {editingProject ? "Enregistrer les modifications" : "Ajouter le projet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PICKER DRAWER / MODAL */}
      {isPhotoPickerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#0B69FF]" />
                  <span>Sélectionner une photo parmi les 74 chantiers réels</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliquez sur n'importe quelle photo pour l'assigner à ce projet
                </p>
              </div>
              <button
                onClick={() => setIsPhotoPickerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {ALL_CHANTIER_PHOTOS.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => {
                    setFormCoverImage(photo.src);
                    setIsPhotoPickerOpen(false);
                    showToast(`Photo ${photo.id} sélectionnée`);
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    formCoverImage === photo.src
                      ? "border-[#0B69FF] ring-2 ring-[#0B69FF]/30"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    sizes="120px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    Choisir
                  </div>
                  {formCoverImage === photo.src && (
                    <div className="absolute top-1 end-1 p-1 rounded-full bg-[#0B69FF] text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="absolute bottom-1 start-1 px-1 rounded bg-black/60 text-white text-[9px] font-mono">
                    {photo.id.replace("chantier-", "#")}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPhotoPickerOpen(false)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce projet ?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Cette action supprimera le projet de votre catalogue portfolio.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Oui, supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
