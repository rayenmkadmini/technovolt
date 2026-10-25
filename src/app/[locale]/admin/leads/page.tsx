import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Inbox,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let leads: any[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    leads = data || [];
  } catch (err) {
    console.error("Failed to load leads from Supabase:", err);
  }

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
            Toutes les demandes de devis et prises de contact enregistrées en base de données
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {leads.length} Demande(s)
          </Badge>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Aucune demande pour le moment</p>
            <p className="text-xs text-slate-400 mt-1">Les prospects via le formulaire apparaîtront ici.</p>
          </div>
        ) : (
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                      <div>{lead.reference_number || `LEAD-${lead.id.slice(0, 8)}`}</div>
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
                        {lead.message || "Demande de contact"}
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
        )}
      </div>
    </div>
  );
}
