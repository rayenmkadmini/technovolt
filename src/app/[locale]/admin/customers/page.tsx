import { setRequestLocale } from "next-intl/server";
import { initialCustomers } from "@/lib/data/adminStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  Users,
  Phone,
  Mail,
  Building,
  Plus,
  Search,
  Receipt,
  FileCheck,
} from "lucide-react";

export default async function AdminCustomersPage({
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
            <Users className="h-6 w-6 text-[#0B69FF]" />
            <span>Fichier Clients (CRM)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Particuliers et professionnels sous contrat ou ayant réalisé des chantiers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="liste-clients-technovolt"
            label="Exporter CSV"
            headers={["Référence", "Nom du Client", "Téléphone", "Email", "Société", "Matricule Fiscal", "Total Dépensé (TND)", "Solde Dû (TND)"]}
            rows={initialCustomers.map((c) => [
              c.reference_number,
              c.full_name,
              c.phone,
              c.email || "",
              c.company_name || "",
              c.tax_id || "Particulier",
              c.total_spent,
              c.outstanding_balance,
            ])}
          />
          <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
            <Plus className="h-4 w-4" />
            <span>Ajouter un Client</span>
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Réf.</th>
                <th className="px-4 py-3.5 text-start">Nom du Client / Société</th>
                <th className="px-4 py-3.5 text-start">Téléphone / Email</th>
                <th className="px-4 py-3.5 text-start">Matricule Fiscal</th>
                <th className="px-4 py-3.5 text-end">Total Dépensé</th>
                <th className="px-4 py-3.5 text-end">Solde Dû</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {cust.reference_number}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {cust.full_name}
                    </div>
                    {cust.company_name && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" />
                        <span>{cust.company_name}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 space-y-0.5 font-mono">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-sans">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{cust.email}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                    {cust.tax_id || "Particulier"}
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900">
                    {formatCurrency(cust.total_spent, locale)}
                  </td>

                  <td className="px-4 py-4 text-end">
                    {cust.outstanding_balance > 0 ? (
                      <span className="font-bold text-amber-600">
                        {formatCurrency(cust.outstanding_balance, locale)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">0.000 TND</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">
                      Actif
                    </Badge>
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
