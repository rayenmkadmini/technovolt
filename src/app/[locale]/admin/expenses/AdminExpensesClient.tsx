"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingDown,
  Plus,
  Tag,
  Truck,
  Receipt,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";

export interface ExpenseItem {
  id: string;
  reference: string;
  expense_date: string;
  category_name: string;
  supplier_name: string;
  description: string;
  amount: number;
  currency: string;
  tax_amount: number;
  payment_method: string;
  payment_status: "pending" | "paid";
  notes: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_expenses";

interface Props {
  initialExpenses: ExpenseItem[];
}

export function AdminExpensesClient({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formStatus, setFormStatus] = useState<"pending" | "paid">("paid");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setTimeout(() => setExpenses(parsed), 0);
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: ExpenseItem[]) => {
    setExpenses(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save expenses failed", e);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim() || !formAmount || !formDate) {
      alert("Veuillez saisir la description, le montant et la date.");
      return;
    }
    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      reference: `DEP-${Date.now().toString().slice(-6)}`,
      expense_date: formDate,
      category_name: formCategory.trim() || "Autre",
      supplier_name: formSupplier.trim() || "-",
      description: formDesc.trim(),
      amount: Number(formAmount),
      currency: "TND",
      tax_amount: 0,
      payment_method: formMethod,
      payment_status: formStatus,
      notes: "",
      created_at: new Date().toISOString(),
    };
    save([newExp, ...expenses]);
    showToast("Dépense enregistrée avec succès !");
    setIsModalOpen(false);
    setFormDesc("");
    setFormCategory("");
    setFormAmount("");
    setFormDate("");
    setFormSupplier("");
    setFormMethod("cash");
    setFormStatus("paid");
  };

  const handleDelete = (id: string) => {
    save(expenses.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
    showToast("Dépense supprimée.");
  };

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
            <TrendingDown className="h-6 w-6 text-red-600" />
            <span>Dépenses & Achats Fournisseurs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Charges d'exploitation, approvisionnements, carburant et outillage</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Dépenses</div>
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalExpenses, "fr")}</div>
          </div>
          <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Nouvelle Dépense</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Réf. Dépense</th>
                <th className="px-4 py-3.5 text-start">Date</th>
                <th className="px-4 py-3.5 text-start">Catégorie</th>
                <th className="px-4 py-3.5 text-start">Fournisseur</th>
                <th className="px-4 py-3.5 text-start">Description</th>
                <th className="px-4 py-3.5 text-center">Mode</th>
                <th className="px-4 py-3.5 text-end">Montant</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">{exp.reference}</td>
                  <td className="px-4 py-4 text-slate-600">{exp.expense_date}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span>{exp.category_name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{exp.supplier_name}</td>
                  <td className="px-4 py-4 text-slate-600 max-w-xs">{exp.description}</td>
                  <td className="px-4 py-4 text-center text-slate-500">{exp.payment_method}</td>
                  <td className="px-4 py-4 text-end font-semibold">{formatCurrency(exp.amount, "fr")}</td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => setDeleteConfirmId(exp.id)} className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">Aucune dépense.</td>
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
                <span>Nouvelle Dépense</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <Input required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Ex: Achat câbles" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Matériel & Câblage" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant (TND) *</label>
                <Input required type="number" step="0.001" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.000" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <Input required type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fournisseur</label>
                <Input value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="Nom du fournisseur" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de paiement</label>
                <select value={formMethod} onChange={(e) => setFormMethod(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as "pending" | "paid")} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="paid">Payée</option>
                  <option value="pending">En attente</option>
                </select>
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer cette dépense ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera la dépense.</p>
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