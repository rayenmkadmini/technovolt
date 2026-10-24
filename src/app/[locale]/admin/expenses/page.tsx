import { setRequestLocale } from "next-intl/server";
import { initialExpenses } from "@/lib/data/adminStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingDown,
  Plus,
  Tag,
  Truck,
  Receipt,
} from "lucide-react";

export default async function AdminExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const totalExpenses = initialExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingDown className="h-6 w-6 text-red-600" />
            <span>Dépenses & Achats Fournisseurs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Charges d'exploitation, approvisionnements chantiers, carburant et outillage
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-end">
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Dépenses</div>
            <div className="text-xl font-black text-slate-900">
              {formatCurrency(totalExpenses, locale)}
            </div>
          </div>
          <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
            <Plus className="h-4 w-4" />
            <span>Nouvelle Dépense</span>
          </Button>
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
                <th className="px-4 py-3.5 text-start">Fournisseur / Bénéficiaire</th>
                <th className="px-4 py-3.5 text-start">Description</th>
                <th className="px-4 py-3.5 text-center">Mode</th>
                <th className="px-4 py-3.5 text-end">Montant Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {exp.reference}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {exp.expense_date}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span>{exp.category_name}</span>
                    </span>
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {exp.supplier_name}
                  </td>

                  <td className="px-4 py-4 text-slate-600 max-w-xs">
                    {exp.description}
                  </td>

                  <td className="px-4 py-4 text-center font-mono text-[11px] uppercase text-slate-500">
                    {exp.payment_method}
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900 text-sm">
                    {formatCurrency(exp.amount, locale)}
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
