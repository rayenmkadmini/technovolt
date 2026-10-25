"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { deleteQuotationAction } from "@/app/actions/adminActions";
import {
  FileText,
  Plus,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";

export interface QuotationItem {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount_amount?: number;
  tax_amount: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
  items?: any[];
  terms?: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_quotations";

const defaultDemoQuotations: QuotationItem[] = [
  {
    id: "quot-01",
    quotation_number: "DEV-2026-0044",
    customer_name: "Youssef Ben Salem",
    customer_phone: "+216 98 123 456",
    customer_address: "Tataouine — Cité Ennour",
    issue_date: "2026-10-22",
    valid_until: "2026-11-21",
    subtotal: 820.0,
    tax_amount: 155.8,
    total: 975.8,
    status: "sent",
    created_at: "2026-10-22T10:00:00Z",
  },
  {
    id: "quot-02",
    quotation_number: "DEV-2026-0043",
    customer_name: "Hôtel Sangho Tataouine",
    customer_phone: "+216 75 860 120",
    customer_address: "Zone Touristique, Tataouine",
    issue_date: "2026-10-15",
    valid_until: "2026-11-14",
    subtotal: 2100.0,
    tax_amount: 399.0,
    total: 2499.0,
    status: "accepted",
    created_at: "2026-10-15T14:00:00Z",
  },
];

function buildInvoiceFromQuote(quote: QuotationItem) {
  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(timestamp + 15 * 86400000).toISOString().slice(0, 10);

  return {
    id: `inv-${timestamp}`,
    invoice_number: `FAC-${year}-${randomSuffix}`,
    customer_name: quote.customer_name,
    customer_phone: quote.customer_phone || "",
    customer_address: quote.customer_address || "",
    issue_date: issueDate,
    due_date: dueDate,
    subtotal: quote.subtotal,
    tax_amount: quote.tax_amount,
    total: quote.total,
    amount_paid: 0,
    balance_due: quote.total,
    status: "issued" as const,
    items: quote.items || [
      {
        id: "item-1",
        description: `Prestation issue du devis ${quote.quotation_number}`,
        quantity: 1,
        unit: "forfait",
        unit_price: quote.subtotal,
      },
    ],
    created_at: new Date().toISOString(),
  };
}

export function AdminQuotationsClient({
  locale,
  initialQuotations = [],
}: {
  locale: string;
  initialQuotations?: QuotationItem[];
}) {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationItem[]>(
    initialQuotations.length > 0 ? initialQuotations : defaultDemoQuotations
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && initialQuotations.length === 0) {
            setQuotations(parsed);
            return;
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [initialQuotations]);

  const saveQuotations = (next: QuotationItem[]) => {
    setQuotations(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuotationAction(id);
    } catch (err) {
      console.error("Failed to delete quotation from database:", err);
    }
    saveQuotations(quotations.filter((q) => q.id !== id));
    setDeleteConfirmId(null);
    showToast("Devis supprimé.");
  };

  const handleConvertToInvoice = (quote: QuotationItem) => {
    const newInvoice = buildInvoiceFromQuote(quote);

    try {
      const invStorage = localStorage.getItem("technovolt_admin_invoices");
      let list = [];
      if (invStorage) {
        try {
          const parsed = JSON.parse(invStorage);
          if (Array.isArray(parsed)) list = parsed;
        } catch {}
      }
      localStorage.setItem("technovolt_admin_invoices", JSON.stringify([newInvoice, ...list]));
    } catch {}

    // Mark quote as converted
    const updatedQuotes = quotations.map((q) =>
      q.id === quote.id ? { ...q, status: "converted" as const } : q
    );
    saveQuotations(updatedQuotes);

    showToast(`Devis ${quote.quotation_number} converti avec succès en Facture ${newInvoice.invoice_number} !`);
    setTimeout(() => {
      router.push("/admin/invoices");
    }, 1500);
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
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
            <span>Devis Clients (Quotations)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Création, suivi, conversion en facture et impression des devis à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="devis-technovolt"
            label="Exporter CSV"
            headers={[
              "N° Devis",
              "Client",
              "Date d'Émission",
              "Validité",
              "Total HT",
              "TVA",
              "Total TTC",
              "Statut",
            ]}
            rows={filteredQuotes.map((q) => [
              q.quotation_number,
              q.customer_name,
              q.issue_date,
              q.valid_until,
              q.subtotal,
              q.tax_amount,
              q.total,
              q.status,
            ])}
          />

          <Link href="/admin/quotations/new">
            <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs bg-[#0B69FF] hover:bg-[#094FC9]">
              <Plus className="h-4 w-4" />
              <span>Créer un Devis</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par N° devis ou client..."
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
            <option value="all">Tous les devis</option>
            <option value="sent">Envoyé</option>
            <option value="accepted">Accepté</option>
            <option value="converted">Converti en facture</option>
            <option value="draft">Brouillon</option>
            <option value="rejected">Refusé</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">N° Devis</th>
                <th className="px-4 py-3.5 text-start">Client</th>
                <th className="px-4 py-3.5 text-start">Date d'Émission</th>
                <th className="px-4 py-3.5 text-start">Valable jusqu'au</th>
                <th className="px-4 py-3.5 text-end">Total TTC</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {q.quotation_number}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {q.customer_name}
                    </div>
                    {q.customer_phone && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {q.customer_phone}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {q.issue_date}
                  </td>

                  <td className="px-4 py-4 text-slate-500">
                    {q.valid_until}
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900">
                    {formatCurrency(q.total, locale)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={
                        q.status === "accepted" || q.status === "converted"
                          ? "success"
                          : q.status === "sent"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {q.status === "converted"
                        ? "Facturé"
                        : q.status === "accepted"
                        ? "Accepté"
                        : q.status === "sent"
                        ? "Envoyé"
                        : q.status === "draft"
                        ? "Brouillon"
                        : "Refusé"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-end space-x-2 whitespace-nowrap">
                    {q.status !== "converted" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConvertToInvoice(q)}
                        className="text-[11px] h-7 px-2 font-semibold"
                      >
                        <ArrowRight className="h-3 w-3 me-1" />
                        <span>Facturer</span>
                      </Button>
                    )}

                    <button
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-block align-middle"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Aucun devis trouvé.
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce devis ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le devis de la liste.</p>
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
