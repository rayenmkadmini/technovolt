"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  TrendingDown,
  Plus,
  Tag,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
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

const defaultDemoExpenses: ExpenseItem[] = [
  {
    id: "exp-01",
    reference: "DEP-2026-0015",
    expense_date: "2026-10-14",
    category_name: "Matériel Électrique",
    supplier_name: "Comptoir Sud Électrique",
    description: "Câbles R2V 3G2.5, disjoncteurs différentiels 30mA et goulottes",
    amount: 540.0,
    currency: "TND",
    tax_amount: 86.2,
    payment_method: "Virement",
    payment_status: "paid",
    notes: "Facture N° CSE-882",
    created_at: "2026-10-14T09:00:00Z",
  },
  {
    id: "exp-02",
    reference: "DEP-2026-0016",
    expense_date: "2026-10-18",
    category_name: "Carburant & Transport",
    supplier_name: "Station AGIL Tataouine",
    description: "Carburant véhicule d'intervention et déplacements chantiers Ghomrassen",
    amount: 120.0,
    currency: "TND",
    tax_amount: 0,
    payment_method: "Espèces",
    payment_status: "paid",
    notes: "Ticket N° 44918",
    created_at: "2026-10-18T17:30:00Z",
  },
];

interface Props {
  initialExpenses: ExpenseItem[];
}

export function AdminExpensesClient({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    initialExpenses.length > 0 ? initialExpenses : defaultDemoExpenses
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Matériel Électrique");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSupplier, setFormSupplier] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formStatus, setFormStatus] = useState<"pending" | "paid">("paid");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExpenses(parsed);
            return;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoExpenses));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
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
    setFormError(null);

    if (!formDesc.trim()) {
      setFormError("Veuillez saisir la description de la dépense.");
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Le montant doit être un chiffre strictement supérieur à 0.");
      return;
    }
    if (!formDate) {
      setFormError("Veuillez sélectionner la date.");
      return;
    }

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      reference: `DEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      expense_date: formDate,
      category_name: formCategory.trim() || "Matériel Électrique",
      supplier_name: formSupplier.trim() || "-",
      description: formDesc.trim(),
      amount: Math.round(amt * 1000) / 1000,
      currency: "TND",
      tax_amount: 0,
      payment_method: formMethod === "cash" ? "Espèces" : formMethod === "bank_transfer" ? "Virement" : "Chèque",
      payment_status: formStatus,
      notes: "",
      created_at: new Date().toISOString(),
    };

    save([newExp, ...expenses]);
    showToast("Dépense enregistrée avec succès !");
    setIsModalOpen(false);
    setFormDesc("");
    setFormCategory("Matériel Électrique");
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormSupplier("");
    setFormMethod("cash");
    setFormStatus("paid");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    save(expenses.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
    showToast("Dépense supprimée.");
  };

  const filteredExpenses = expenses.filter((e) => {
    return (
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.reference.toLowerCase().includes(searchTerm.toLowerCase())
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
            <TrendingDown className="h-6 w-6 text-red-600" />
            <span>Dépenses & Achats Fournisseurs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Charges d'exploitation, approvisionnements, carburant et outillage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Dépenses</div>
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalExpenses, "fr")}</div>
          </div>

          <ExportCsvButton
            filename="depenses-technovolt"
            label="Exporter CSV"
            headers={["Réf. Dépense", "Date", "Catégorie", "Fournisseur", "Description", "Mode", "Montant (TND)", "Statut"]}
            rows={filteredExpenses.map((exp) => [
              exp.reference,
              exp.expense_date,
              exp.category_name,
              exp.supplier_name,
              exp.description,
              exp.payment_method,
              exp.amount,
              exp.payment_status === "paid" ? "Payée" : "En attente",
            ])}
          />

          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold text-xs bg-[#0B69FF] hover:bg-[#094FC9]"
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Dépense</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher dépense, catégorie, fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Expenses Table */}
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
              {filteredExpenses.map((exp) => (
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
                  <td className="px-4 py-4 text-end font-semibold text-slate-900">{formatCurrency(exp.amount, "fr")}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(exp.id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">Aucune dépense trouvée.</td>
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
                <span>Nouvelle Dépense</span>
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

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <Input
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Achat disjoncteurs Schneider et câbles"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="Matériel Électrique">Matériel Électrique</option>
                  <option value="Climatisation & Gaz">Climatisation & Gaz</option>
                  <option value="Outillage & Équipement">Outillage & Équipement</option>
                  <option value="Carburant & Transport">Carburant & Transport</option>
                  <option value="Loyer & Charges">Loyer & Charges</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant (TND) *</label>
                <Input
                  required
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.000"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <Input
                  required
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fournisseur</label>
                <Input
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="Ex: Comptoir Sud Électrique"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de paiement</label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "pending" | "paid")}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="paid">Payée</option>
                  <option value="pending">En attente de paiement</option>
                </select>
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
                  Enregistrer
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer cette dépense ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera la dépense de la comptabilité.</p>
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
