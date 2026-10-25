"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Phone,
  Mail,
  Building,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle2,
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

interface Props {
  initialCustomers: CustomerItem[];
}

export function AdminCustomersClient({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => setCustomers(parsed), 0);
        }
      }
    } catch {}
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
    if (!formName.trim() || !formPhone.trim()) {
      alert("Veuillez saisir le nom et le téléphone.");
      return;
    }
    const newCust: CustomerItem = {
      id: `cust-${Date.now()}`,
      reference_number: `CL-${Date.now().toString().slice(-4)}`,
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
    showToast("Client ajouté avec succès !");
    setIsModalOpen(false);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormCompany("");
  };

  const handleDelete = (id: string) => {
    save(customers.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    showToast("Client supprimé.");
  };

  const filtered = customers.filter((c) =>
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
            Particuliers et professionnels sous contrat ou ayant réalisé des chantiers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Ajouter un Client</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher par nom, téléphone..." className="ps-9 h-9 text-xs" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Réf.</th>
                <th className="px-4 py-3.5 text-start">Nom du Client / Société</th>
                <th className="px-4 py-3.5 text-start">Téléphone / Email</th>
                <th className="px-4 py-3.5 text-end">Total Dépensé</th>
                <th className="px-4 py-3.5 text-end">Solde Dû</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-500">{cust.reference_number}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">{cust.full_name}</div>
                    {cust.company_name && <div className="text-[11px] text-slate-500">{cust.company_name}</div>}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div>{cust.phone}</div>
                    <div className="text-[11px] text-slate-500">{cust.email}</div>
                  </td>
                  <td className="px-4 py-4 text-end font-semibold">{formatCurrency(cust.total_spent, "fr")}</td>
                  <td className="px-4 py-4 text-end font-semibold text-rose-600">{formatCurrency(cust.outstanding_balance, "fr")}</td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">Actif</Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => setDeleteConfirmId(cust.id)} className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">Aucun client trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Ajouter un Client</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Youssef Ben Salem" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone *</label>
                <Input required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+216 98 123 456" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Société</label>
                <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Nom de la société" className="h-10 text-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
                <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce client ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le client de la liste.</p>
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