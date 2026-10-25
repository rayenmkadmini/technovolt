"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  Truck,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Search,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";

export interface SupplierItem {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  outstanding_amount: number;
  is_active: boolean;
}

const STORAGE_KEY = "technovolt_admin_suppliers";

const defaultDemoSuppliers: SupplierItem[] = [
  {
    id: "supp-01",
    name: "Comptoir Électrique du Sud",
    contact_person: "M. Adel Mabrouk",
    phone: "+216 75 760 300",
    email: "commercial@comptoir-sud.tn",
    address: "Route de Médenine Km 2, Tataouine",
    notes: "Distributeur officiel Legrand, Hager, Schneider Electric",
    outstanding_amount: 0,
    is_active: true,
  },
  {
    id: "supp-02",
    name: "Grossiste Climatisation Gabès",
    contact_person: "M. Tarek Yahia",
    phone: "+216 75 271 450",
    email: "clima.sud@gnet.tn",
    address: "Zone Industrielle, Gabès",
    notes: "Fournisseur compresseurs, gaz R410A / R32 et liaisons frigorifiques",
    outstanding_amount: 0,
    is_active: true,
  },
  {
    id: "supp-03",
    name: "Station Agil Tataouine",
    contact_person: "Service Flotte",
    phone: "+216 75 761 020",
    email: "agil.tataouine@agil.com.tn",
    address: "Avenue Habib Bourguiba, Tataouine",
    notes: "Compte carburant utilitaires chantier",
    outstanding_amount: 0,
    is_active: true,
  },
];

interface Props {
  initialSuppliers: SupplierItem[];
}

export function AdminSuppliersClient({ initialSuppliers }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(
    initialSuppliers.length > 0 ? initialSuppliers : defaultDemoSuppliers
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuppliers(parsed);
            return;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoSuppliers));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: SupplierItem[]) => {
    setSuppliers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("save suppliers failed", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Veuillez saisir le nom commercial du fournisseur.");
      return;
    }

    // Check duplicate supplier name
    const isDuplicate = suppliers.some(
      (s) => s.name.trim().toLowerCase() === formName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`Le fournisseur "${formName.trim()}" existe déjà dans votre répertoire.`);
      return;
    }

    // Email format validation if email is provided
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setFormError("Veuillez saisir une adresse email valide.");
      return;
    }

    setIsSubmitting(true);
    const newSupp: SupplierItem = {
      id: `supp-${Date.now()}`,
      name: formName.trim(),
      contact_person: formContact.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      notes: formNotes.trim(),
      outstanding_amount: 0,
      is_active: true,
    };

    save([newSupp, ...suppliers]);
    setIsSubmitting(false);
    showToast(`Fournisseur "${newSupp.name}" ajouté avec succès !`);
    setIsModalOpen(false);

    // Reset
    setFormName("");
    setFormContact("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    save(suppliers.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
    showToast("Fournisseur supprimé.");
  };

  const filteredSuppliers = suppliers.filter((supp) => {
    return (
      supp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supp.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supp.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supp.phone.includes(searchTerm)
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
            <Truck className="h-6 w-6 text-[#0B69FF]" />
            <span>Répertoire Fournisseurs & Partenaires Matériel</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grossistes électriques, comptoirs de vente et distributeurs agréés à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="fournisseurs-technovolt"
            label="Exporter CSV"
            headers={["Fournisseur", "Contact", "Téléphone", "Email", "Adresse", "Notes"]}
            rows={filteredSuppliers.map((s) => [
              s.name,
              s.contact_person,
              s.phone,
              s.email,
              s.address,
              s.notes,
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
            <span>Nouveau fournisseur</span>
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
            placeholder="Rechercher par nom de fournisseur, contact, adresse..."
            className="ps-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supp) => (
          <div
            key={supp.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0B69FF]/50 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{supp.name}</h3>
                {supp.contact_person && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Contact : {supp.contact_person}</p>
                )}
              </div>
              <button
                onClick={() => setDeleteConfirmId(supp.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              {supp.phone && (
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{supp.phone}</span>
                </div>
              )}
              {supp.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{supp.email}</span>
                </div>
              )}
              {supp.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                  <span>{supp.address}</span>
                </div>
              )}
            </div>

            {supp.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {supp.notes}
              </p>
            )}
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Aucun fournisseur trouvé.</div>
        )}
      </div>

      {/* Modal Nouveau Fournisseur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouveau Fournisseur</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom commercial du fournisseur *</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Comptoir Électrique du Sud"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interlocuteur / Contact</label>
                <Input
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="ex: M. Hichem"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+216 75 ..."
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@fournisseur.tn"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse / Ville</label>
                <Input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Zone Industrielle, Tataouine"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Produits fournis</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Distributeur disjoncteurs, câbles..."
                  className="h-10 text-sm"
                />
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
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le fournisseur"}
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce fournisseur ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le fournisseur de votre carnet d'adresses.</p>
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
