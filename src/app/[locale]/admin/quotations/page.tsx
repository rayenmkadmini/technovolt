import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { initialQuotations } from "@/lib/data/adminStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Plus,
  Printer,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";

export default async function AdminQuotationsPage({
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
            <FileText className="h-6 w-6 text-[#1B3A6B]" />
            <span>Devis Clients (Quotations)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Création, suivi, conversion en facture et impression des devis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/quotations/new">
            <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Créer un Devis</span>
            </Button>
          </Link>
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
                <th className="px-4 py-3.5 text-start">Validité</th>
                <th className="px-4 py-3.5 text-end">Montant HT</th>
                <th className="px-4 py-3.5 text-end">TVA (19%)</th>
                <th className="px-4 py-3.5 text-end">Total TTC</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialQuotations.map((quot) => (
                <tr key={quot.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#1B3A6B]">
                    {quot.quotation_number}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {quot.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {quot.customer_phone}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {quot.issue_date}
                  </td>

                  <td className="px-4 py-4 text-slate-500">
                    Jusqu'au {quot.valid_until}
                  </td>

                  <td className="px-4 py-4 text-end text-slate-600">
                    {formatCurrency(quot.subtotal, locale)}
                  </td>

                  <td className="px-4 py-4 text-end text-slate-500">
                    {formatCurrency(quot.tax_amount, locale)}
                  </td>

                  <td className="px-4 py-4 text-end font-black text-slate-900 text-sm">
                    {formatCurrency(quot.total, locale)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={
                        quot.status === "accepted"
                          ? "success"
                          : quot.status === "sent"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {quot.status === "accepted"
                        ? "Accepté"
                        : quot.status === "sent"
                        ? "Envoyé"
                        : "Brouillon"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-end space-x-1.5 whitespace-nowrap">
                    <Link href={`/admin/invoices/new?quotationId=${quot.id}`}>
                      <Button variant="secondary" size="sm" className="text-[11px] h-7 px-2">
                        Convertir en Facture
                      </Button>
                    </Link>
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
