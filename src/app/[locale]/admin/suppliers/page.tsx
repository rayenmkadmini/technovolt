import { setRequestLocale } from "next-intl/server";
import { initialSuppliers } from "@/lib/data/adminStore";
import { Button } from "@/components/ui/Button";
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
} from "lucide-react";

export default async function AdminSuppliersPage({
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
            <Truck className="h-6 w-6 text-[#0B69FF]" />
            <span>Répertoire Fournisseurs & Partenaires Matériel</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grossistes électriques, comptoirs de vente et distributeurs agréés
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Nouveau Fournisseur</span>
        </Button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialSuppliers.map((supp) => (
          <div
            key={supp.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#0B69FF]" />
                  <span>{supp.name}</span>
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Contact commercial : <strong>{supp.contact_person}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{supp.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{supp.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                <span>{supp.address}</span>
              </div>
            </div>

            {supp.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {supp.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
