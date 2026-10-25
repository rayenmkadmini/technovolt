"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  CreditCard,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

export interface PaymentItem {
  id: string;
  payment_reference: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  receipt_reference: string;
  notes: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_payments";

const defaultDemoPayments: PaymentItem[] = [
  {
    id: "pay-01",
    payment_reference: "REG-2026-0038",
    customer_name: "Société Sud Équipement",
    invoice_number: "FAC-2026-0038",
    amount: 900.0,
    currency: "TND",
    payment_date: "2026-10-21",
    payment_method: "Virement",
    receipt_reference: "VIR-BNA-88392",
    notes: "Acompte de 900 TND reçu",
    created_at: "2026-10-21T11:00:00Z",
  },
  {
    id: "pay-02",
    payment_reference: "REG-2026-0039",
    customer_name: "Dr. Lassaad Marzouki",
    invoice_number: "FAC-2026-0039",
    amount: 450.0,
    currency: "TND",
    payment_date: "2026-10-19",
    payment_method: "Espèces",
    receipt_reference: "ESP-2026-19",
    notes: "Règlement total au comptant",
    created_at: "2026-10-19T16:00:00Z",
  },
];

interface Props {
  initialPayments: PaymentItem[];
}

export function AdminPaymentsClient({ initialPayments }: Props) {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<PaymentItem[]>(
    initialPayments.length > 0 ? initialPayments : defaultDemoPayments
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formInvoice, setFormInvoice] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formMethod, setFormMethod] = useState("cash");
  const [formReceipt, setFormReceipt] = useState("");
  const [formNotes, setFormNotes] = useState("");
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
            setPayments(parsed);
            return;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemoPayments));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check URL query parameters for prefilling from invoice list
  useEffect(() => {
    const cust = searchParams.get("customer");
    const inv = searchParams.get("invNum");
    const amt = searchParams.get("amount");
    if (cust || inv || amt) {
      const timer = setTimeout(() => {
        if (cust) setFormCustomer(decodeURIComponent(cust));
        if (inv) setFormInvoice(decodeURIComponent(inv));
        if (amt) setFormAmount(amt);
        setIsModalOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: PaymentItem[]) => {
    setPayments(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save payments failed", e);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomer.trim()) {
      setFormError("Veuillez saisir le nom du client.");
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Le montant du règlement doit être un nombre strictement supérieur à 0.");
      return;
    }
    if (!formDate) {
      setFormError("Veuillez sélectionner la date du règlement.");
      return;
    }

    const newPay: PaymentItem = {
      id: `pay-${Date.now()}`,
      payment_reference: `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: formCustomer.trim(),
      invoice_number: formInvoice.trim(),
      amount: Math.round(amt * 1000) / 1000,
      currency: "TND",
      payment_date: formDate,
      payment_method: formMethod === "cash" ? "Espèces" : formMethod === "bank_transfer" ? "Virement" : "Chèque",
      receipt_reference: formReceipt.trim(),
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    save([newPay, ...payments]);

    // Synchronize corresponding invoice in localStorage if referenced
    if (formInvoice.trim()) {
      try {
        const invStorage = localStorage.getItem("technovolt_admin_invoices");
        if (invStorage) {
          const invList = JSON.parse(invStorage);
          if (Array.isArray(invList)) {
            const updatedInvList = invList.map((inv: any) => {
              if (inv.invoice_number === formInvoice.trim()) {
                const newPaid = Math.round(((inv.amount_paid || 0) + amt) * 1000) / 1000;
                const newBalance = Math.max(0, Math.round(((inv.total || 0) - newPaid) * 1000) / 1000);
                const newStatus = newBalance <= 0 ? "paid" : "partially_paid";
                return {
                  ...inv,
                  amount_paid: newPaid,
                  balance_due: newBalance,
                  status: newStatus,
                };
              }
              return inv;
            });
            localStorage.setItem("technovolt_admin_invoices", JSON.stringify(updatedInvList));
          }
        }
      } catch (err) {
        console.error("Failed to update invoice balance:", err);
      }
    }

    showToast("Règlement enregistré avec succès !");
    setIsModalOpen(false);
    setFormCustomer("");
    setFormInvoice("");
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormMethod("cash");
    setFormReceipt("");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    save(payments.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
    showToast("Règlement supprimé.");
  };

  const filteredPayments = payments.filter((p) => {
    return (
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
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
            <CreditCard className="h-6 w-6 text-[#0B69FF]" />
            <span>Encaissements & Règlements Reçus</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité des flux financiers réels encaissés (espèces, virements, chèques)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Encaissé</div>
            <div className="text-xl font-black text-emerald-600">{formatCurrency(totalCollected, "fr")}</div>
          </div>

          <ExportCsvButton
            filename="reglements-technovolt"
            label="Exporter CSV"
            headers={["Réf. Règlement", "Date", "Client", "Facture", "Mode", "Montant (TND)", "Réf. Reçu"]}
            rows={filteredPayments.map((p) => [
              p.payment_reference,
              p.payment_date,
              p.customer_name,
              p.invoice_number || "-",
              p.payment_method,
              p.amount,
              p.receipt_reference || "-",
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
            <span>Enregistrer Règlement</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par client, reçu ou facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Réf. Règlement</th>
                <th className="px-4 py-3.5 text-start">Date</th>
                <th className="px-4 py-3.5 text-start">Client</th>
                <th className="px-4 py-3.5 text-start">Facture</th>
                <th className="px-4 py-3.5 text-center">Mode</th>
                <th className="px-4 py-3.5 text-end">Montant</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">{p.payment_reference}</td>
                  <td className="px-4 py-4 text-slate-600">{p.payment_date}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{p.customer_name}</td>
                  <td className="px-4 py-4 text-slate-600 font-mono">{p.invoice_number || "-"}</td>
                  <td className="px-4 py-4 text-center text-slate-500">{p.payment_method}</td>
                  <td className="px-4 py-4 text-end font-semibold text-emerald-600">{formatCurrency(p.amount, "fr")}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">Aucun règlement trouvé.</td>
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
                <span>Enregistrer un Règlement</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <Input
                  required
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  placeholder="Nom du client"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facture concernée (réf.)</label>
                <Input
                  value={formInvoice}
                  onChange={(e) => setFormInvoice(e.target.value)}
                  placeholder="Ex: FAC-2026-0038"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant encaissé (TND) *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date d'encaissement *</label>
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
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Réf. transaction / Reçu</label>
                <Input
                  value={formReceipt}
                  onChange={(e) => setFormReceipt(e.target.value)}
                  placeholder="Ex: VIR-STB-9982 ou N° Chèque"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observations éventuelles..."
                  className="h-10 text-sm"
                />
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce règlement ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le règlement de la trésorerie.</p>
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
