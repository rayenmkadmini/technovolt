import { setRequestLocale } from "next-intl/server";
import { initialPayments } from "@/lib/data/adminStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CreditCard,
  Plus,
  Receipt,
  Building,
  Banknote,
} from "lucide-react";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const totalCollected = initialPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
            <div className="text-xl font-black text-emerald-600">
              {formatCurrency(totalCollected, locale)}
            </div>
          </div>
          <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
            <Plus className="h-4 w-4" />
            <span>Enregistrer Règlement</span>
          </Button>
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
                <th className="px-4 py-3.5 text-start">Facture Liée</th>
                <th className="px-4 py-3.5 text-start">Mode de Règlement</th>
                <th className="px-4 py-3.5 text-start">Réf. Reçu / Virement</th>
                <th className="px-4 py-3.5 text-end">Montant Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {pay.payment_reference}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {pay.payment_date}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                    {pay.customer_name}
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-700">
                    {pay.invoice_number}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {pay.payment_method === "cash" ? (
                        <>
                          <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Espèces</span>
                        </>
                      ) : (
                        <>
                          <Building className="h-3.5 w-3.5 text-blue-600" />
                          <span>Virement Bancaire</span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-[11px] text-slate-500">
                    {pay.receipt_reference || "N/A"}
                  </td>

                  <td className="px-4 py-4 text-end font-black text-emerald-600 text-sm">
                    {formatCurrency(pay.amount, locale)}
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
