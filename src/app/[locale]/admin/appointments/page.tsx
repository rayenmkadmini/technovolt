import { setRequestLocale } from "next-intl/server";
import { initialAppointments } from "@/lib/data/adminStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2,
} from "lucide-react";

export default async function AdminAppointmentsPage({
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
            <Calendar className="h-6 w-6 text-[#0B69FF]" />
            <span>Planning & Rendez-vous d'Intervention</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion du planning des techniciens et interventions à Tataouine
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Nouveau Rendez-vous</span>
        </Button>
      </div>

      {/* Appointments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialAppointments.map((apt) => (
          <div
            key={apt.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 hover:border-[#0B69FF] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#0B69FF]">
                {apt.reference_number}
              </span>
              <Badge variant="success" className="text-xs">
                {apt.status === "confirmed" ? "Confirmé" : apt.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                {apt.customer_name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{apt.customer_phone}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="font-semibold text-slate-800">
                {apt.service_title}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-[#F5A623]" />
                <span>
                  Date : <strong>{apt.scheduled_date}</strong> à <strong>{apt.scheduled_time}</strong> ({apt.estimated_duration})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                <span>{apt.address}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Technicien assigné : {apt.technician_name}</span>
              </div>
            </div>

            {apt.notes && (
              <p className="text-xs text-slate-500 italic">
                Note : {apt.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
