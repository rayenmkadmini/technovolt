import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { initialLeads } from "@/lib/data/adminStore";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Inbox,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
} from "lucide-react";

export default async function AdminLeadsPage({
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
            <Inbox className="h-6 w-6 text-[#0B69FF]" />
            <span>Gestion des Demandes & Prospects (Leads CRM)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Toutes les demandes de devis et prises de contact reçues via le site web
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {initialLeads.length} Demande(s)
          </Badge>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            className="w-full ps-9 pe-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500">Statut :</span>
          <select className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white">
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="won">Gagné</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Réf. / Date</th>
                <th className="px-4 py-3.5 text-start">Prospect & Contact</th>
                <th className="px-4 py-3.5 text-start">Localisation</th>
                <th className="px-4 py-3.5 text-start">Projet / Message</th>
                <th className="px-4 py-3.5 text-start">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    <div>{lead.reference_number}</div>
                    <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                      {formatDate(lead.created_at, locale)}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {lead.full_name}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{lead.email}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="h-3 w-3 text-[#F5A623] shrink-0" />
                      <span>{lead.address || "Tataouine"}</span>
                    </span>
                  </td>

                  <td className="px-4 py-4 max-w-xs">
                    <p className="line-clamp-2 text-slate-600">
                      {lead.message}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        lead.status === "new"
                          ? "secondary"
                          : lead.status === "contacted"
                          ? "outline"
                          : "success"
                      }
                      className="text-[10px]"
                    >
                      {lead.status === "new"
                        ? "Nouveau"
                        : lead.status === "contacted"
                        ? "Contacté"
                        : "Gagné"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-end space-x-2">
                    <Link href={`/admin/quotations/new?leadId=${lead.id}`}>
                      <Button variant="default" size="sm" className="text-xs h-7 px-2.5">
                        <FileText className="h-3.5 w-3.5 me-1" />
                        <span>Devis</span>
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
