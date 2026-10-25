"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  title: string;
  short_description: string;
  category: string;
  service_type: string;
  price_from?: number;
  show_price: boolean;
  estimated_duration: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const DEFAULT_TYPES = [
  "Installation électrique",
  "Rénovation électrique",
  "Dépannage",
  "Climatisation",
  "Chauffe-eau",
  "Domotique",
  "Éclairage",
  "Mise à la terre",
];

const defaultDemoServices: ServiceItem[] = [
  {
    id: "srv-01",
    title: "Installation Électrique Complète",
    short_description: "Étude, schéma unifilaire et câblage complet de villas et locaux à Tataouine",
    category: "Électricité Bâtiment",
    service_type: "Installation électrique",
    price_from: 350.0,
    show_price: false,
    estimated_duration: "3-5 jours",
    status: "published",
    sort_order: 1,
    is_active: true,
    created_at: "2026-10-10T08:00:00Z",
  },
  {
    id: "srv-02",
    title: "Mise en Conformité & Rénovation Tableau",
    short_description: "Remplacement fusibles par disjoncteurs différentiels 30mA aux normes STEG",
    category: "Sécurité & Normes",
    service_type: "Rénovation électrique",
    price_from: 180.0,
    show_price: false,
    estimated_duration: "1 jour",
    status: "published",
    sort_order: 2,
    is_active: true,
    created_at: "2026-10-10T08:00:00Z",
  },
  {
    id: "srv-03",
    title: "Pose & Entretien Climatiseur",
    short_description: "Installation liaisons frigorifiques, tirage au vide et mise en service",
    category: "Climatisation",
    service_type: "Climatisation",
    price_from: 140.0,
    show_price: false,
    estimated_duration: "3-4 heures",
    status: "published",
    sort_order: 3,
    is_active: true,
    created_at: "2026-10-10T08:00:00Z",
  },
];

const STORAGE_KEY = "technovolt_service_types";
const SERVICES_STORAGE = "technovolt_admin_services";

interface Props {
  initialServices: ServiceItem[];
}

export function AdminServicesClient({ initialServices }: Props) {
  const [services, setServices] = useState<ServiceItem[]>(
    initialServices.length > 0 ? initialServices : defaultDemoServices
  );
  const [serviceTypes, setServiceTypes] = useState<string[]>(DEFAULT_TYPES);
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setServiceTypes(parsed);
          }
        }
        const saved = localStorage.getItem(SERVICES_STORAGE);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setServices(parsed);
            return;
          }
        }
        localStorage.setItem(SERVICES_STORAGE, JSON.stringify(defaultDemoServices));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveServices = (next: ServiceItem[]) => {
    setServices(next);
    try {
      localStorage.setItem(SERVICES_STORAGE, JSON.stringify(next));
    } catch (e) {
      console.error("save services failed", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formType) {
      alert("Veuillez saisir le titre et le type de service.");
      return;
    }
    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
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
    saveServices([newSrv, ...services]);
    showToast("Service ajouté avec succès !");
    setIsModalOpen(false);
    setFormTitle("");
    setFormDesc("");
    setFormCategory("Électricité Bâtiment");
    setFormType(serviceTypes[0] || "");
    setFormPrice("");
    setFormShowPrice(false);
    setFormDuration("");
    setFormStatus("published");
  };

  const handleDelete = (id: string) => {
    saveServices(services.filter((s) => s.id !== id));
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
          <p className="text-sm text-slate-500 mt-1">Gestion des prestations électriques, tarifications indicatives et durée d'intervention</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="catalogue-services-technovolt"
            label="Exporter CSV"
            headers={["Titre", "Catégorie", "Type de Service", "Prix Indicatif", "Affiché sur site", "Durée", "Statut"]}
            rows={filteredServices.map((s) => [
              s.title,
              s.category,
              s.service_type,
              s.price_from ? `${s.price_from} TND` : "Sur devis",
              s.show_price ? "Oui" : "Non (Sur devis)",
              s.estimated_duration || "-",
              s.status,
            ])}
          />

          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold text-xs bg-[#0B69FF] hover:bg-[#094FC9]"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Service</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher service, catégorie ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Ordre</th>
                <th className="px-4 py-3.5 text-start">Titre Prestation</th>
                <th className="px-4 py-3.5 text-start">Catégorie</th>
                <th className="px-4 py-3.5 text-start">Type de Service</th>
                <th className="px-4 py-3.5 text-end">Tarif Indicatif</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-slate-400">#{srv.sort_order}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">{srv.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">{srv.short_description}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">{srv.category}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#0B69FF]/10 text-[#0B69FF] text-[11px] font-semibold">
                      {srv.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-end font-mono">
                    {srv.show_price && srv.price_from ? formatCurrency(srv.price_from, "fr") : <span className="text-slate-400">Sur devis</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">{srv.status === "published" ? "Publié" : srv.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-end">
                    <button
                      onClick={() => setDeleteConfirmId(srv.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">Aucun service trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Ajouter un Service</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titre *</label>
                <Input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Installation tableau électrique" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description courte des travaux" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Électricité Bâtiment" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type de service (sans affichage de prix) *</label>
                <select
                  required
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {serviceTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prix indicatif (TND)</label>
                <Input type="number" step="0.001" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.000" className="h-10 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durée estimée</label>
                <Input value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="Ex: 2-4 heures" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="show-price" checked={formShowPrice} onChange={(e) => setFormShowPrice(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]" />
                <label htmlFor="show-price" className="text-xs text-slate-700 font-medium cursor-pointer">Afficher le prix public sur le site (sinon « Sur devis »)</label>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
                <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Enregistrer</Button>
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
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">Annuler</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirmId)} className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Oui, supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
