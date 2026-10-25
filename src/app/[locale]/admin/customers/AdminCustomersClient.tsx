"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface CustomerItem {
  id: string;
  reference_number: string;
  full_name: string;
  phone: string;
  email: string;
  company_name: string;
  tax_id: string;
  notes: string;
  is_active: boolean;
  total_spent: number;
  outstanding_balance: number;
}

const STORAGE_KEY = "technovolt_admin_customers";

export const defaultDemoCustomers: CustomerItem[] = [
  {
    id: "cust-01",
    reference_number: "CLI-2026-0012",
    full_name: "Société Sud Équipement",
    phone: "+216 75 760 111",
    email: "direction@sud-equipement.tn",
    company_name: "Sud Équipement SARL",
    tax_id: "1428590/M/A/000",
    notes: "Zone Industrielle Tataouine",
    is_active: true,
    total_spent: 3450.0,
    outstanding_balance: 0,
  },
  {
    id: "cust-02",
    reference_number: "CLI-2026-0013",
    full_name: "Mourad Chaabane",
    phone: "+216 97 554 112",
    email: "mourad.chaabane@gnet.tn",
    company_name: "Particulier",
    tax_id: "",
    notes: "Cité Ennour, Tataouine",
    is_active: true,
    total_spent: 850.0,
    outstanding_balance: 0,
  },
  {
    id: "cust-03",
    reference_number: "CLI-2026-0014",
    full_name: "Café Essafsaf",
    phone: "+216 75 761 900",
    email: "contact@essafsaf.tn",
    company_name: "Café Restaurant Essafsaf",
    tax_id: "0982341/B/B/000",
    notes: "Avenue Habib Bourguiba, Tataouine",
    is_active: true,
    total_spent: 1200.0,
    outstanding_balance: 0,
  },
  {
    id: "cust-04",
    reference_number: "CLI-2026-0015",
    full_name: "Dr. Lassaad Marzouki",
    phone: "+216 98 332 110",
    email: "dr.marzouki@clinique.tn",
    company_name: "Cabinet Médical",
    tax_id: "",
    notes: "Cité El Mahrajène, Tataouine",
    is_active: true,
    total_spent: 450.0,
    outstanding_balance: 0,
  },
];

interface Props {
  initialCustomers: CustomerItem[];
}

export function AdminCustomersClient({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<CustomerItem[]>(
    initialCustomers.length > 0 ? initialCustomers : defaultDemoCustomers
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomers(parsed);
            return;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoCustomers));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: CustomerItem[]) => {
    setCustomers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save customers failed", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Veuillez saisir le nom du client.");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Veuillez saisir le numéro de téléphone.");
      return;
    }

    // Check duplicate phone
    if (customers.some((c) => c.phone.replace(/\s+/g, "") === formPhone.replace(/\s+/g, ""))) {
      setFormError("Un client avec ce numéro de téléphone existe déjà.");
      return;
    }

    setIsSubmitting(true);
    const newCust: CustomerItem = {
      id: `cust-${Date.now()}`,
      reference_number: `CLI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      company_name: formCompany.trim(),
      tax_id: "",
      notes: "",
      is_active: true,
      total_spent: 0,
      outstanding_balance: 0,
    };

    save([newCust, ...customers]);
    setIsSubmitting(false);
    showToast("Client ajouté avec succès !");
    setIsModalOpen(false);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormCompany("");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    save(customers.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    showToast("Client supprimé.");
  };

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#0B69FF]" />
            <span>Fichier Clients (CRM)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion du portefeuille clients particuliers et professionnels à Tataouine
          </p>
        </div>

        <Button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="bg-[#0B69FF] hover:bg-[#094FC9] text-white gap-2 font-bold px-5"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Client</span>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone ou email..."
            className="ps-9 h-10 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-start">Réf.</th>
                <th className="py-3 px-4 text-start">Nom & Société</th>
                <th className="py-3 px-4 text-start">Téléphone</th>
                <th className="py-3 px-4 text-start">Email</th>
                <th className="py-3 px-4 text-end">Total Dépensé</th>
                <th className="py-3 px-4 text-end">Solde Dû</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.reference_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{c.full_name}</div>
                    {c.company_name && <div className="text-[11px] text-slate-500">{c.company_name}</div>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{c.phone}</td>
                  <td className="py-3 px-4 text-slate-600">{c.email || "—"}</td>
                  <td className="py-3 px-4 text-end font-semibold text-slate-900">
                    {formatCurrency(c.total_spent)}
                  </td>
                  <td className="py-3 px-4 text-end font-semibold">
                    {c.outstanding_balance > 0 ? (
                      <span className="text-amber-600 font-bold">{formatCurrency(c.outstanding_balance)}</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">À jour</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={c.is_active ? "success" : "secondary"}>
                      {c.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouveau Client</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet / Raison Sociale *</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Mourad Chaabane ou Sud Équipement"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone *</label>
                <Input
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+216 ..."
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@exemple.tn"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Société / Établissement (optionnel)</label>
                <Input
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Nom de l'entreprise..."
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
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le client"}
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce client ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action est irréversible.</p>
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
