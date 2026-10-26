"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { createServiceAction, deleteServiceAction } from "@/app/actions/adminActions";
import {
  Layers,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Search,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  title: string;
  short_description: string;
  category: string;
  service_type: string;
  price_from?: number;
  show_price: boolean;
  estimated_duration?: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const DEFAULT_TYPES = [
  "Installation électrique complète (neuf / rénovation)",
  "Mise en conformité tableau & disjoncteurs",
  "Dépannage d'urgence 24/7 (court-circuit / panne)",
  "Installation & entretien climatisation",
  "Éclairage LED architectural & domotique",
  "Câblage réseau, baie de brassage & sécurité",
  "Autre prestation sur mesure",
];

function generateServiceId(): string {
  return `srv-${Date.now()}`;
}

interface Props {
  initialServices: ServiceItem[];
}

export function AdminServicesClient({ initialServices }: Props) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [addedServices, setAddedServices] = useState<ServiceItem[]>([]);
  const serviceTypes = DEFAULT_TYPES;
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Électricité Bâtiment");
  const [formType, setFormType] = useState(DEFAULT_TYPES[0]);
  const [formPrice, setFormPrice] = useState("");
  const [formShowPrice, setFormShowPrice] = useState(false);
  const [formDuration, setFormDuration] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "archived">("published");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const baseList = [...addedServices, ...initialServices];
  const services = baseList.filter(
    (s) => !deletedIds.includes(s.id) && !deletedIds.includes(s.title)
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("Veuillez saisir le titre de la prestation.");
      return;
    }
    if (!formType) {
      setFormError("Veuillez sélectionner le type de service.");
      return;
    }

    // Duplicate check
    const isDuplicate = services.some(
      (s) => s.title.trim().toLowerCase() === formTitle.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`Le service "${formTitle.trim()}" existe déjà dans votre catalogue.`);
      return;
    }

    if (formPrice) {
      const priceVal = parseFloat(formPrice);
      if (isNaN(priceVal) || priceVal < 0) {
        setFormError("Le tarif indicatif doit être un montant positif.");
        return;
      }
    }

    setIsSubmitting(true);
    let createdId = generateServiceId();

    try {
      const res = await createServiceAction({
        title: formTitle.trim(),
        short_description: formDesc.trim(),
        category: formCategory.trim() || "Général",
        service_type: formType,
        price_from: formPrice ? Number(formPrice) : undefined,
        show_price: formShowPrice,
        estimated_duration: formDuration.trim() || undefined,
        status: formStatus,
      });
      if (res.success && res.data?.id) {
        createdId = res.data.id;
      }
    } catch (err) {
      console.error("Failed to sync service to database:", err);
    }

    const newSrv: ServiceItem = {
      id: createdId,
      title: formTitle.trim(),
      short_description: formDesc.trim(),
      category: formCategory.trim() || "Général",
      service_type: formType,
      price_from: formPrice ? Number(formPrice) : undefined,
      show_price: formShowPrice,
      estimated_duration: formDuration.trim(),
      status: formStatus,
      sort_order: services.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setAddedServices((prev) => [newSrv, ...prev]);
    router.refresh();
    setIsSubmitting(false);
    showToast(`Service "${newSrv.title}" ajouté avec succès !`);
    setIsModalOpen(false);

    // Reset
    setFormTitle("");
    setFormDesc("");
    setFormCategory("Électricité Bâtiment");
    setFormType(serviceTypes[0] || "");
    setFormPrice("");
    setFormShowPrice(false);
    setFormDuration("");
    setFormStatus("published");
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
    setAddedServices((prev) => prev.filter((s) => s.id !== id && s.title !== id));
    try {
      await deleteServiceAction(id);
    } catch (err) {
      console.error("Failed to delete service from database:", err);
    }
    router.refresh();
    setDeleteConfirmId(null);
    showToast("Service supprimé.");
  };

  const filteredServices = services.filter((srv) => {
    return (
      srv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.service_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#0B69FF]" />
            <span>Catalogue des Services & Tarifs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des prestations électriques, tarifications indicatives et durée d'intervention
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="catalogue-services-technovolt"
            label="Exporter CSV"
            headers={["Titre", "Catégorie", "Type de Service", "Tarif Indicatif", "Affichage Public", "Durée", "Statut"]}
            rows={filteredServices.map((s) => [
              s.title,
              s.category,
              s.service_type,
              s.price_from ? `${s.price_from} TND` : "Sur devis",
              s.show_price ? "Visible" : "Masqué (Sur devis)",
              s.estimated_duration || "—",
              s.status,
            ])}
          />

          <Button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="bg-[#0B69FF] hover:bg-[#094FC9] text-white gap-2 font-bold px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un service</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un service par titre, catégorie ou type..."
            className="ps-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => (
          <div
            key={srv.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0B69FF]/50 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#0B69FF] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                  {srv.category}
                </span>
                <h3 className="font-bold text-slate-900 mt-2 text-base">{srv.title}</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmId(srv.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{srv.short_description}</p>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="font-semibold text-slate-800 line-clamp-1">Type : {srv.service_type}</div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="h-3 w-3" />
                <span>Durée estimée : {srv.estimated_duration || "Selon chantier"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                {srv.show_price && srv.price_from ? (
                  <span className="font-extrabold text-emerald-600 font-mono text-sm">
                    {formatCurrency(srv.price_from)}
                  </span>
                ) : (
                  <span className="font-medium text-slate-500 italic">Sur devis</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                {srv.show_price ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{srv.show_price ? "Prix affiché" : "Prix masqué"}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredServices.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Aucun service trouvé.</div>
        )}
      </div>

      {/* Modal Ajouter un Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Ajouter un Service au Catalogue</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intitulé du service *</label>
                <Input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ex: Installation Tableau Électrique"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description courte</label>
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Détail des prestations incluses..."
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Tableaux, Dépannage, Climatisation..."
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de service (sans affichage de prix) *
                </label>
                <select
                  required
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {serviceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif indicatif (TND)</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.000"
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Durée estimée</label>
                  <Input
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="ex: 2-4 heures"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                >
                  <option value="published">Publié (Actif)</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="show-price"
                  checked={formShowPrice}
                  onChange={(e) => setFormShowPrice(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]"
                />
                <label htmlFor="show-price" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Afficher le tarif indicatif publiquement sur le site
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9] text-white"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le service"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce service ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le service de la liste.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">
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
