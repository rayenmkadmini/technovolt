import { setRequestLocale } from "next-intl/server";
import {
  initialInvoices,
  initialPayments,
  initialExpenses,
} from "@/lib/data/adminStore";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RevenueExpenseChart } from "@/components/admin/charts/RevenueExpenseChart";
import { ExpenseCategoryChart } from "@/components/admin/charts/ExpenseCategoryChart";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  FileText,
  TrendingDown,
  AlertCircle,
  Download,
  Info,
} from "lucide-react";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Real calculations
  const totalInvoiced = initialInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = initialPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalReceivables = initialInvoices.reduce((sum, i) => sum + i.balance_due, 0);
  const totalExpenses = initialExpenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = totalCollected - totalExpenses;

  // Breakdown of expenses
  const expensesByCategory: Record<string, number> = {};
  initialExpenses.forEach((exp) => {
    const cat = exp.category_name || "Autre";
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-[#1B3A6B]" />
            <span>Rapports Financiers & Compte de Résultat</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyse rigoureuse de la rentabilité, encaissements effectifs et charges d'exploitation
          </p>
        </div>

        <ExportCsvButton
          filename="rapport-financier-technovolt"
          label="Exporter Synthèse CSV"
          headers={["Indicateur Financier", "Montant (TND)", "Observations"]}
          rows={[
            ["Chiffre d'Affaires Facturé TTC", totalInvoiced, "Total des factures émises"],
            ["Total Encaissé Réel", totalCollected, "Trésorerie effective entrée"],
            ["Créances Clients à Recouvrer", totalReceivables, "Soldes factures impayées"],
            ["Charges & Achats Réalisés", totalExpenses, "Matériel, outillage, transport"],
            ["Résultat d'Exploitation Estimé", operatingProfit, "Encaissé moins dépenses payées"],
            ...Object.entries(expensesByCategory).map(([cat, amt]) => [
              `Dépense : ${cat}`,
              amt,
              "Catégorie de charges",
            ]),
          ]}
        />
      </div>

      {/* Accounting safeguard warning box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Principes Comptables Appliqués :</p>
          <p className="leading-relaxed">
            Le <strong>chiffre d'affaires facturé</strong> correspond aux factures émises. L'<strong>encaissé réel</strong> correspond strictement aux règlements reçus et vérifiés. Une facture impayée n'est jamais comptabilisée comme de la trésorerie disponible.
          </p>
        </div>
      </div>

      {/* Primary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-semibold">
              Total Facturé TTC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(totalInvoiced, locale)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Volume d'affaires engagé</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-emerald-800 font-semibold">
              Total Encaissé Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">
              {formatCurrency(totalCollected, locale)}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Trésorerie effective entrée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 font-semibold">
              Charges & Achats Réalisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">
              {formatCurrency(totalExpenses, locale)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Matériel, outillage & carburant</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-blue-900 font-semibold">
              Résultat d'Exploitation Estimé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#1B3A6B]">
              {formatCurrency(operatingProfit, locale)}
            </div>
            <p className="text-[11px] text-blue-700 mt-1">Encaissé &minus; Dépenses payées</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Monthly Performance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Tendance Mensuelle : Encaissements vs Charges d'Exploitation (TND)
        </h3>
        <RevenueExpenseChart />
      </div>

      {/* Two Columns: Category Breakdown & Receivables Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Expenses by Category */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">
            Ventilation des Charges par Catégorie
          </h3>
          <ExpenseCategoryChart />

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {Object.entries(expensesByCategory).map(([cat, amount]) => {
              const pct = Math.round((amount / totalExpenses) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{cat}</span>
                    <span className="font-mono">
                      {formatCurrency(amount, locale)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#1B3A6B] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Receivables Aging Overview */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">
            État des Créances Clients
          </h3>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span>Reste à Encaisser :</span>
              <span className="font-mono text-sm">
                {formatCurrency(totalReceivables, locale)}
              </span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Correspond au solde restant sur les factures émises en attente de paiement à échéance.
            </p>
          </div>

          <div className="pt-2 divide-y divide-slate-100">
            {initialInvoices
              .filter((inv) => inv.balance_due > 0)
              .map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{inv.customer_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{inv.invoice_number}</span>
                  </div>
                  <div className="text-end font-mono font-bold text-amber-700">
                    {formatCurrency(inv.balance_due, locale)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
