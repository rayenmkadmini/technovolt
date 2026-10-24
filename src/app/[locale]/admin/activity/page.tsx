import { setRequestLocale } from "next-intl/server";
import {
  Activity,
  FileText,
  CreditCard,
  User,
  Settings,
  Clock,
  ShieldAlert,
} from "lucide-react";

const auditLogs = [
  {
    id: "act-01",
    action: "Émission Facture",
    resource: "Facture FAC-2026-0039 (1 280.000 TND)",
    user: "Rayen M. (Gérant)",
    ip: "197.0.xxx.xxx (Tataouine)",
    timestamp: "2026-10-18 à 16:00:12",
    icon: FileText,
    type: "financial",
  },
  {
    id: "act-02",
    action: "Enregistrement Paiement",
    resource: "Règlement 900.000 TND (Espèces) - Réf: RC-CASH-102",
    user: "Rayen M. (Gérant)",
    ip: "197.0.xxx.xxx (Tataouine)",
    timestamp: "2026-10-19 à 09:30:45",
    icon: CreditCard,
    type: "financial",
  },
  {
    id: "act-03",
    action: "Mise à jour Paramètres",
    resource: "Modification des horaires d'ouverture et numéro WhatsApp",
    user: "Rayen M. (Gérant)",
    ip: "197.0.xxx.xxx (Tataouine)",
    timestamp: "2026-10-24 à 08:59:10",
    icon: Settings,
    type: "system",
  },
  {
    id: "act-04",
    action: "Création Ordre de Travail",
    resource: "Ordre OT-2604-002 assigné à Sami (Frigoriste)",
    user: "Rayen M. (Gérant)",
    ip: "197.0.xxx.xxx (Tataouine)",
    timestamp: "2026-10-22 à 09:00:00",
    icon: Activity,
    type: "operations",
  },
];

export default async function AdminActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-[#1B3A6B]" />
            <span>Journal d'Activité & Audit de Sécurité (Activity Logs)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité immuable des créations, modifications de factures et opérations critiques
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
              {auditLogs.map((log) => {
                const Icon = log.icon;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                        <Icon className="h-3.5 w-3.5 text-[#1B3A6B]" />
                        <span>{log.action}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-800">
                      {log.resource}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {log.user}
                    </td>

                    <td className="px-4 py-4 text-end font-mono text-[11px] text-slate-400">
                      {log.ip}
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
