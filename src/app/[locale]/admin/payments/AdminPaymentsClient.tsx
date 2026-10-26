"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { createPaymentAction, deletePaymentAction } from "@/app/actions/adminActions";
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

function generatePaymentId(): string {
  return `pay-${Date.now()}`;
}

function generatePaymentRef(): string {
  return `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

interface Props {
  initialPayments: PaymentItem[];
  customersList?: { name: string; phone: string }[];
  invoicesList?: any[];
}

export function AdminPaymentsClient({ initialPayments, customersList = [], invoicesList = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [addedPayments, setAddedPayments] = useState<PaymentItem[]>([]);
  const availableInvoices = invoicesList;
  const availableCustomers = customersList;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const baseList = [...addedPayments, ...initialPayments];
  const payments = baseList.filter(
    (p) => !deletedIds.includes(p.id) && !deletedIds.includes(p.payment_reference)
  );

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

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleInvoiceSelect = (invNum: string) => {
    setFormInvoice(invNum);
    if (!invNum) return;
    const inv = availableInvoices.find((i) => i.invoice_number === invNum);
    if (inv) {
      setFormCustomer(inv.customer_name);
      setFormAmount(String(inv.balance_due || inv.total || 0));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomer.trim()) {
      setFormError("Veuillez sélectionner ou saisir le nom du client.");
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

    // Duplicate detection: check for exact duplicate receipt reference if provided
    if (formReceipt.trim()) {
      const duplicateReceipt = payments.find(
        (p) => p.receipt_reference && p.receipt_reference.toLowerCase() === formReceipt.trim().toLowerCase()
      );
      if (duplicateReceipt) {
        setFormError(`Un règlement existe déjà avec la référence de reçu "${formReceipt.trim()}".`);
        return;
      }
    }

    // Prevent identical duplicate payment on same invoice, customer, amount and date
    const duplicatePayment = payments.find(
      (p) =>
        p.customer_name.toLowerCase() === formCustomer.trim().toLowerCase() &&
        p.invoice_number.toLowerCase() === formInvoice.trim().toLowerCase() &&
        p.amount === Math.round(amt * 1000) / 1000 &&
        p.payment_date === formDate
    );
    if (duplicatePayment) {
      setFormError("Un règlement identique a déjà été enregistré pour ce client, cette facture et cette date.");
      return;
    }

    setIsSubmitting(true);
    let createdId = generatePaymentId();
    let createdRef = generatePaymentRef();

    try {
      const res = await createPaymentAction({
        customer_name: formCustomer.trim(),
        invoice_number: formInvoice.trim() || undefined,
        amount: Math.round(amt * 1000) / 1000,
        payment_method:
          formMethod === "cash"
            ? "Espèces"
            : formMethod === "bank_transfer"
            ? "Virement"
            : formMethod === "check"
            ? "Chèque"
            : "Traite",
        payment_date: formDate,
        receipt_reference: formReceipt.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      if (res.success && res.data) {
        createdId = res.data.id;
        if (res.data.payment_reference) createdRef = res.data.payment_reference;
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to sync payment to database:", err);
    }

    const newPay: PaymentItem = {
      id: createdId,
      payment_reference: createdRef,
      customer_name: formCustomer.trim(),
      invoice_number: formInvoice.trim(),
      amount: Math.round(amt * 1000) / 1000,
      currency: "TND",
      payment_date: formDate,
      payment_method:
        formMethod === "cash"
          ? "Espèces"
          : formMethod === "bank_transfer"
          ? "Virement"
          : formMethod === "check"
          ? "Chèque"
          : "Traite",
      receipt_reference: formReceipt.trim(),
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    setAddedPayments((prev) => [newPay, ...prev]);

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
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (err) {
        console.error("Failed to update invoice balance:", err);
      }
    }

    setIsSubmitting(false);
    showToast(`Règlement ${newPay.payment_reference} enregistré avec succès !`);
    setIsModalOpen(false);

    // Reset
    setFormCustomer("");
    setFormInvoice("");
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormMethod("cash");
    setFormReceipt("");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    // 1. Optimistic removal
    setDeletedIds((prev) => [...prev, id]);
    setDeleteConfirmId(null);
    showToast("Règlement supprimé.");

    try {
      const remaining = payments.filter((p) => p.id !== id && p.payment_reference !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // 2. Database persistence
    try {
      const res = await deletePaymentAction(id);
      if (!res.success) {
        showToast(res.error || "Erreur lors de la suppression.");
        setDeletedIds((prev) => prev.filter((dId) => dId !== id));
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete payment from database:", err);
      showToast("Erreur lors de la suppression.");
      setDeletedIds((prev) => prev.filter((dId) => dId !== id));
    }
  };

  const filteredPayments = payments.filter((pay) => {
    return (
      pay.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.receipt_reference.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span>Encaissements & Règlements Clients</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total Encaissé :{" "}
            <span className="font-extrabold text-emerald-600 font-mono text-base">
              {formatCurrency(totalCollected)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="reglements-technovolt"
            label="Exporter CSV"
            headers={[
              "Réf. Paiement",
              "Client",
              "N° Facture",
              "Montant (TND)",
              "Date",
              "Mode",
              "N° Reçu / Transaction",
              "Notes",
            ]}
            rows={filteredPayments.map((p) => [
              p.payment_reference,
              p.customer_name,
              p.invoice_number,
              p.amount,
              p.payment_date,
              p.payment_method,
              p.receipt_reference,
              p.notes,
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
            <span>Enregistrer un règlement</span>
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
            placeholder="Rechercher par client, référence paiement, facture ou reçu..."
            className="ps-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-start">Réf. Règlement</th>
                <th className="py-3 px-4 text-start">Client</th>
                <th className="py-3 px-4 text-start">Facture Liée</th>
                <th className="py-3 px-4 text-start">Date</th>
                <th className="py-3 px-4 text-start">Mode de Règlement</th>
                <th className="py-3 px-4 text-start">Réf. Reçu / Transaction</th>
                <th className="py-3 px-4 text-end">Montant Encaissé</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0B69FF]">{p.payment_reference}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.customer_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.invoice_number || "—"}</td>
                  <td className="py-3 px-4 text-slate-600">{p.payment_date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.receipt_reference || "—"}</td>
                  <td className="py-3 px-4 text-end font-extrabold text-emerald-600 font-mono text-sm">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Aucun règlement enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouveau Règlement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0B69FF]" />
                <span>Enregistrement d'un Règlement</span>
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
              {/* Select from existing Invoices */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facture à Régler (optionnel)
                </label>
                <select
                  value={formInvoice}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                >
                  <option value="">-- Règlement sans facture spécifique --</option>
                  {availableInvoices.map((inv) => (
                    <option key={inv.invoice_number} value={inv.invoice_number}>
                      {inv.invoice_number} — {inv.customer_name} (Reste: {formatCurrency(inv.balance_due || inv.total || 0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Client *</label>
                <div className="space-y-2">
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                    onChange={(e) => setFormCustomer(e.target.value)}
                    value={availableCustomers.some((c) => c.name === formCustomer) ? formCustomer : ""}
                  >
                    <option value="">-- Choisir parmi les clients enregistrés --</option>
                    {availableCustomers.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <Input
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="Nom du client (ou personnalisé)"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Encaissé (TND) *</label>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date d'Encaissement *</label>
                  <Input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Payment Method & Receipt */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Paiement</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement Bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="draft">Traite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">N° Reçu / Transaction</label>
                  <Input
                    value={formReceipt}
                    onChange={(e) => setFormReceipt(e.target.value)}
                    placeholder="ex: REC-1049, VIR-BNA..."
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes comptables</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Remarques..."
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
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le règlement"}
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
              <p className="text-xs text-slate-500 mt-1">Cette opération annulera l'enregistrement de ce paiement.</p>
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
