import { setRequestLocale } from "next-intl/server";
import { getServices } from "@/lib/data/services";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Layers,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const services = await getServices(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#0B69FF]" />
            <span>Gestion des Services (CMS Catalogue)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Modifier les titres, descriptions, prix indicatifs et visibilité sur le site public
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Ajouter un Service</span>
        </Button>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Ordre</th>
                <th className="px-4 py-3.5 text-start">Titre du Service</th>
                <th className="px-4 py-3.5 text-start">Catégorie</th>
                <th className="px-4 py-3.5 text-end">Prix Indicatif</th>
                <th className="px-4 py-3.5 text-center">Affichage Prix</th>
                <th className="px-4 py-3.5 text-center">Statut Publication</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-slate-400">
                    #{srv.sort_order}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {srv.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                      {srv.short_description}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                    {srv.category}
                  </td>

                  <td className="px-4 py-4 text-end font-mono">
                    {srv.price_from ? (
                      formatCurrency(srv.price_from, locale)
                    ) : (
                      <span className="text-slate-400">Sur devis</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {srv.show_price ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visible</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Masqué</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">
                      {srv.status === "published" ? "Publié" : srv.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-end space-x-1.5 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                      <Edit className="h-3.5 w-3.5 me-1" />
                      <span>Modifier</span>
                    </Button>
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
