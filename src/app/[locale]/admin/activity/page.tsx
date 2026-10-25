import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import {
  Activity,
  FileText,
  CreditCard,
  Settings,
  Wrench,
} from "lucide-react";

export default async function AdminActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let logs: any[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    logs = data || [];
  } catch (err) {
    console.error("Failed to load activity logs from Supabase:", err);
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "invoices":
        return FileText;
      case "payments":
        return CreditCard;
      case "work_orders":
        return Wrench;
      default:
        return Settings;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-[#0B69FF]" />
            <span>Journal d'Activité & Audit de Sécurité (Activity Logs)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité des opérations enregistrées directement dans la base de données
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Horodatage</th>
                <th className="px-4 py-3.5 text-start">Opération Réalisée</th>
                <th className="px-4 py-3.5 text-start">Détails de l'Objet / Ressource</th>
                <th className="px-4 py-3.5 text-start">Auteur</th>
                <th className="px-4 py-3.5 text-end">Adresse IP & Localisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const Icon = getIcon(log.resource_type);
                const detailsText = log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ") : log.resource_type;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.created_at, locale)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                        <Icon className="h-3.5 w-3.5 text-[#0B69FF]" />
                        <span>{log.action}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-800">
                      {detailsText}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      Direction TECHNOVOLT
                    </td>

                    <td className="px-4 py-4 text-end font-mono text-[11px] text-slate-400">
                      {log.ip_address || "197.0.xxx.xxx (Tataouine)"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
