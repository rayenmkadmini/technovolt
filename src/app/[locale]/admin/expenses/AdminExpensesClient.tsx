"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  ReceiptText,
} from "lucide-react";

export interface ExpenseItem {
  id: string;
  reference: string;
  expense_date: string;
  category_name: string;
  supplier_name?: string;
  description: string;
  amount: number;
  currency: string;
  tax_amount: number;
  payment_method: string;
  payment_status: "pending" | "paid";
  notes?: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_expenses";

const defaultDemoExpenses: ExpenseItem[] = [
  {
    id: "exp-01",
    reference: "DEP-2026-0041",
    expense_date: "2026-10-23",
    category_name: "Matériel Électrique",
    supplier_name: "Comptoir Électrique du Sud",
    description: "Achat 4 rouleaux câble 3x2.5mm² Nexans et 20 disjoncteurs Hager 16A",
    amount: 580.0,
    currency: "TND",
    tax_amount: 92.6,
    payment_method: "Virement",
    payment_status: "paid",
    notes: "Facture N° FC-8921",
    created_at: "2026-10-23T10:00:00Z",
  },
  {
    id: "exp-02",
    reference: "DEP-2026-0042",
    expense_date: "2026-10-21",
    category_name: "Carburant & Déplacement",
    supplier_name: "Station Agil Tataouine",
    description: "Plein gasoil utilitaire Peugeot Partner intervention Remada",
    amount: 110.0,
    currency: "TND",
    tax_amount: 0,
    payment_method: "Espèces",
    payment_status: "paid",
    notes: "Reçu N° 44129",
    created_at: "2026-10-21T08:30:00Z",
  },
];

const fallbackSuppliers = [
  "Comptoir Électrique du Sud",
  "STEG Tataouine",
  "Grossiste Climatisation Gabès",
  "Station Agil Tataouine",
  "Quincaillerie Moderne",
];

const categories = [
  "Matériel Électrique",
  "Outillage & Équipement",
  "Carburant & Déplacement",
  "Fournitures & Consommables",
  "Salaire & Sous-traitance",
  "Loyer & Charges",
  "Autre",
];

interface Props {
  initialExpenses: ExpenseItem[];
}

export function AdminExpensesClient({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    initialExpenses.length > 0 ? initialExpenses : defaultDemoExpenses
  );
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>(fallbackSuppliers);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Matériel Électrique");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSupplier, setFormSupplier] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formStatus, setFormStatus] = useState<"pending" | "paid">("paid");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // 1. Expenses
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExpenses(parsed);
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoExpenses));
          }
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoExpenses));
        }

        // 2. Suppliers
        const suppRaw = localStorage.getItem("technovolt_admin_suppliers");
        if (suppRaw) {
          const parsedSupp = JSON.parse(suppRaw);
          if (Array.isArray(parsedSupp) && parsedSupp.length > 0) {
            const names = parsedSupp.map((s: any) => s.name).filter(Boolean);
            if (names.length > 0) setAvailableSuppliers(names);
          }
        }
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
      window.dispatchEvent(new Event("storage"));
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

    setIsSubmitting(true);
    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      reference: `DEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      expense_date: formDate,
      category_name: formCategory.trim() || "Matériel Électrique",
      supplier_name: formSupplier.trim() || "—",
      description: formDesc.trim(),
      amount: Math.round(amt * 1000) / 1000,
      currency: "TND",
      tax_amount: 0,
      payment_method: formMethod === "cash" ? "Espèces" : formMethod === "bank_transfer" ? "Virement" : "Chèque",
      payment_status: formStatus,
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    save([newExp, ...expenses]);
    setIsSubmitting(false);
    showToast(`Dépense ${newExp.reference} enregistrée avec succès !`);
    setIsModalOpen(false);

    // Reset
    setFormDesc("");
    setFormCategory("Matériel Électrique");
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormSupplier("");
    setFormMethod("cash");
    setFormStatus("paid");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    save(expenses.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
    showToast("Dépense supprimée.");
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.supplier_name && e.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || e.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
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
            <ReceiptText className="h-6 w-6 text-[#0B69FF]" />
            <span>Gestion des Dépenses & Achats Chantier</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total Dépenses :{" "}
            <span className="font-extrabold text-rose-600 font-mono text-base">
              {formatCurrency(totalExpenses)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="depenses-technovolt"
            label="Exporter CSV"
            headers={["Réf. Dépense", "Date", "Catégorie", "Fournisseur", "Description", "Montant (TND)", "Paiement", "Statut"]}
            rows={filteredExpenses.map((e) => [
              e.reference,
              e.expense_date,
              e.category_name,
              e.supplier_name || "",
              e.description,
              e.amount,
              e.payment_method,
              e.payment_status === "paid" ? "Payé" : "En attente",
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
            <span>Nouvelle dépense</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par libellé, fournisseur, référence..."
            className="ps-9 h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-start">Réf.</th>
                <th className="py-3 px-4 text-start">Date</th>
                <th className="py-3 px-4 text-start">Catégorie</th>
                <th className="py-3 px-4 text-start">Fournisseur</th>
                <th className="py-3 px-4 text-start">Description</th>
                <th className="py-3 px-4 text-start">Mode</th>
                <th className="py-3 px-4 text-end">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{e.reference}</td>
                  <td className="py-3 px-4 text-slate-600">{e.expense_date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                      {e.category_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{e.supplier_name || "—"}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{e.description}</td>
                  <td className="py-3 px-4 text-slate-600">{e.payment_method}</td>
                  <td className="py-3 px-4 text-end font-extrabold text-slate-900 font-mono text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        e.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {e.payment_status === "paid" ? "Payé" : "En attente"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      onClick={() => setDeleteConfirmId(e.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouvelle Dépense / Achat</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Libellé *</label>
                <Input
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="ex: Achat câbles 2.5mm² et disjoncteurs Hager..."
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant TTC (TND) *</label>
                  <Input
                    required
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.000"
                    className="h-10 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fournisseur</label>
                <div className="space-y-2">
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                    onChange={(e) => setFormSupplier(e.target.value)}
                    value={availableSuppliers.includes(formSupplier) ? formSupplier : ""}
                  >
                    <option value="">-- Choisir parmi les fournisseurs existants --</option>
                    {availableSuppliers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <Input
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Ou saisir le nom du fournisseur..."
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de paiement</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement Bancaire</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut du paiement</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    <option value="paid">Payé</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / N° Facture</label>
                  <Input
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ex: Facture N° 892"
                    className="h-10 text-sm"
                  />
                </div>
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
                  {isSubmitting ? "Enregistrement..." : "Enregistrer la dépense"}
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
              <p className="text-xs text-slate-500 mt-1">Cette opération supprimera l'enregistrement de la dépense.</p>
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
