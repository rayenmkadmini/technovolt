import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { initialInvoices } from "@/lib/data/adminStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  FileText,
  Plus,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default async function AdminInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-[#0B69FF]" />
            <span>Facturation Client (Invoices)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Factures émises, suivi des règlements et créances clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="factures-technovolt"
            label="Exporter CSV"
            headers={["N° Facture", "Client", "Téléphone", "Émission", "Échéance", "Total TTC (TND)", "Encaissé (TND)", "Solde Dû (TND)", "Statut"]}
            rows={initialInvoices.map((inv) => [
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
              {initialInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {inv.invoice_number}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {inv.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {inv.customer_phone}
                    </div>
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
                      <Link href={`/admin/payments?invoiceId=${inv.id}`}>
                        <Button variant="default" size="sm" className="text-[11px] h-7 px-2">
                          <CreditCard className="h-3 w-3 me-1" />
                          <span>Encaisser</span>
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
