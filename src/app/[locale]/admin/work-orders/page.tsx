import { setRequestLocale } from "next-intl/server";
import { initialWorkOrders } from "@/lib/data/adminStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default async function AdminWorkOrdersPage({
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
            <Wrench className="h-6 w-6 text-[#0B69FF]" />
            <span>Ordres de Travail & Chantiers (Work Orders)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi opérationnel des chantiers en cours, temps passé et fournitures utilisées
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Nouvel Ordre de Travail</span>
        </Button>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">N° Ordre</th>
                <th className="px-4 py-3.5 text-start">Client</th>
                <th className="px-4 py-3.5 text-start">Description des Travaux</th>
                <th className="px-4 py-3.5 text-center">Heures MO</th>
                <th className="px-4 py-3.5 text-end">Coût Total</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-start">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialWorkOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {wo.job_number}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                    {wo.customer_name}
                  </td>

                  <td className="px-4 py-4 max-w-sm">
                    <p className="font-medium text-slate-800">{wo.description}</p>
                    {wo.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{wo.notes}</p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center font-mono">
                    {wo.labor_hours} h
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900">
                    {formatCurrency(wo.total_cost, locale)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={wo.status === "completed" ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {wo.status === "completed" ? "Terminé" : "En cours"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-slate-500 text-[11px]">
                    <div>Début : {wo.start_date}</div>
                    {wo.completion_date && <div>Fin : {wo.completion_date}</div>}
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
