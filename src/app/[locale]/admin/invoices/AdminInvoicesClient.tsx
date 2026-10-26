"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { deleteInvoiceAction } from "@/app/actions/adminActions";
import {
  FileText,
  Plus,
  CreditCard,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
  items?: any[];
  payment_terms?: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_invoices";

export function AdminInvoicesClient({
  locale,
  initialInvoices = [],
}: {
  locale: string;
  initialInvoices?: InvoiceItem[];
}) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const invoices = initialInvoices.filter(
    (inv) => !deletedIds.includes(inv.id) && !deletedIds.includes(inv.invoice_number)
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    // 1. Optimistic removal: immediate UI response
    setDeletedIds((prev) => [...prev, id]);
    setDeleteConfirmId(null);
    showToast("Facture supprimée.");

    try {
      const remaining = invoices.filter((inv) => inv.id !== id && inv.invoice_number !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // 2. Database persistence: delete from Supabase
    try {
      const res = await deleteInvoiceAction(id);
      if (!res.success) {
        console.error("Failed to delete invoice from database:", res.error);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to delete invoice from database:", err);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
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
            <FileText className="h-6 w-6 text-[#0B69FF]" />
            <span>Facturation Client (Invoices)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Factures émises, suivi des règlements et créances clients à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="factures-technovolt"
            label="Exporter CSV"
            headers={[
              "N° Facture",
              "Client",
              "Téléphone",
              "Émission",
              "Échéance",
              "Total TTC (TND)",
              "Encaissé (TND)",
              "Solde Dû (TND)",
              "Statut",
            ]}
            rows={filteredInvoices.map((inv) => [
              inv.invoice_number,
              inv.customer_name || "",
              inv.customer_phone || "",
              inv.issue_date,
              inv.due_date,
              inv.total,
              inv.amount_paid,
              inv.balance_due,
              inv.status,
            ])}
          />
          <Link href="/admin/invoices/new">
            <Button variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Créer une Facture</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par N° facture ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">Toutes les factures</option>
            <option value="paid">Payée</option>
            <option value="partially_paid">Partiellement payée</option>
            <option value="issued">Émise</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">N° Facture</th>
                <th className="px-4 py-3.5 text-start">Client</th>
                <th className="px-4 py-3.5 text-start">Date d'Émission</th>
                <th className="px-4 py-3.5 text-start">Échéance</th>
                <th className="px-4 py-3.5 text-end">Total TTC</th>
                <th className="px-4 py-3.5 text-end">Encaissé</th>
                <th className="px-4 py-3.5 text-end">Reste Dû</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {inv.invoice_number}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {inv.customer_name}
                    </div>
                    {inv.customer_phone && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.customer_phone}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {inv.issue_date}
                  </td>

                  <td className="px-4 py-4 text-slate-500">
                    {inv.due_date}
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900">
                    {formatCurrency(inv.total, locale)}
                  </td>

                  <td className="px-4 py-4 text-end font-semibold text-emerald-600">
                    {formatCurrency(inv.amount_paid, locale)}
                  </td>

                  <td className="px-4 py-4 text-end">
                    {inv.balance_due > 0 ? (
                      <span className="font-bold text-amber-600">
                        {formatCurrency(inv.balance_due, locale)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0.000 TND</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "partially_paid"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {inv.status === "paid"
                        ? "Payée"
                        : inv.status === "partially_paid"
                        ? "Partiellement payée"
                        : "Émise"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-end space-x-1.5 whitespace-nowrap">
                    {inv.balance_due > 0 && (
                      <Link href={`/admin/payments?invoiceId=${inv.id}&amount=${inv.balance_due}&customer=${encodeURIComponent(inv.customer_name)}&invNum=${encodeURIComponent(inv.invoice_number)}`}>
                        <Button variant="default" size="sm" className="text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <CreditCard className="h-3 w-3 me-1" />
                          <span>Encaisser</span>
                        </Button>
                      </Link>
                    )}

                    <button
                      onClick={() => setDeleteConfirmId(inv.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-block align-middle"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                    Aucune facture trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer cette facture ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera la facture de la liste.</p>
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
