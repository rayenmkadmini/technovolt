"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { createAppointmentAction, deleteAppointmentAction } from "@/app/actions/adminActions";
import {
  Calendar,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Search,
  AlertCircle,
  Wrench,
} from "lucide-react";

export interface AppointmentItem {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_phone: string;
  service_title: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: string;
  address: string;
  technician_name: string;
  status: string;
  notes: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_appointments";

const fallbackServicesList = [
  "Installation Tableau Électrique & TGBT",
  "Dépannage & Recherche de Panne 24/7",
  "Rénovation Électrique Complète (NFC 15-100)",
  "Installation & Recharge Climatiseur",
  "Domotique & Éclairage Intelligent",
  "Mise à la terre & Contrôle de Conformité STEG",
];

const techniciansList = [
  "Tarak B. (Électricien Senior)",
  "Kais M. (Climatisation & Froid)",
  "Mounir R. (Domotique & Sécurité)",
  "Équipe Technique Chantier",
];

interface Props {
  initialAppointments: AppointmentItem[];
  customersList?: { name: string; phone: string; address?: string }[];
}

export function AdminAppointmentsClient({ initialAppointments, customersList = [] }: Props) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [addedAppointments, setAddedAppointments] = useState<AppointmentItem[]>([]);
  const availableCustomers = customersList;
  const availableServices = fallbackServicesList;

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formService, setFormService] = useState(fallbackServicesList[0]);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState("1h30");
  const [formAddress, setFormAddress] = useState("");
  const [formTechnician, setFormTechnician] = useState(techniciansList[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const baseList = [...addedAppointments, ...initialAppointments];
  const appointments = baseList.filter(
    (a) => !deletedIds.includes(a.id) && !deletedIds.includes(a.reference_number)
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCustomerSelect = (customerName: string) => {
    setFormCustomer(customerName);
    const found = availableCustomers.find((c) => c.name === customerName);
    if (found) {
      if (found.phone) setFormPhone(found.phone);
      if (found.address) setFormAddress(found.address);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomer.trim()) {
      setFormError("Veuillez sélectionner ou saisir le nom du client.");
      return;
    }
    if (!formService.trim()) {
      setFormError("Veuillez sélectionner un service.");
      return;
    }
    if (!formDate) {
      setFormError("Veuillez choisir la date du rendez-vous.");
      return;
    }
    if (!formTime) {
      setFormError("Veuillez spécifier l'heure du rendez-vous.");
      return;
    }

    setIsSubmitting(true);
    let createdId = `apt-${Date.now()}`;
    let createdRef = `RDV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await createAppointmentAction({
        customer_name: formCustomer.trim(),
        customer_phone: formPhone.trim(),
        service_title: formService.trim(),
        scheduled_date: formDate,
        scheduled_time: formTime,
        estimated_duration: formDuration.trim() || "1h30",
        address: formAddress.trim(),
        notes: formNotes.trim(),
        technician_name: formTechnician.trim(),
      });
      if (res.success && res.data) {
        createdId = res.data.id;
        if (res.data.reference_number) createdRef = res.data.reference_number;
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to sync appointment to database:", err);
    }

    const newApt: AppointmentItem = {
      id: createdId,
      reference_number: createdRef,
      customer_name: formCustomer.trim(),
      customer_phone: formPhone.trim(),
      service_title: formService.trim(),
      scheduled_date: formDate,
      scheduled_time: formTime,
      estimated_duration: formDuration.trim() || "1h",
      address: formAddress.trim(),
      technician_name: formTechnician.trim(),
      status: "confirmed",
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    setAddedAppointments((prev) => [newApt, ...prev]);
    setIsSubmitting(false);
    showToast("Rendez-vous enregistré avec succès !");
    setIsModalOpen(false);

    // Reset form
    setFormCustomer("");
    setFormPhone("");
    setFormService(availableServices[0] || "");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime("09:00");
    setFormDuration("1h30");
    setFormAddress("");
    setFormTechnician(techniciansList[0]);
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    // 1. Optimistic removal
    setDeletedIds((prev) => [...prev, id]);
    setDeleteConfirmId(null);
    showToast("Rendez-vous supprimé avec succès.");

    try {
      const remaining = appointments.filter((a) => a.id !== id && a.reference_number !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // 2. Database persistence
    try {
      const res = await deleteAppointmentAction(id);
      if (!res.success) {
        showToast(res.error || "Erreur lors de la suppression.");
        setDeletedIds((prev) => prev.filter((dId) => dId !== id));
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete appointment from database:", err);
      showToast("Erreur lors de la suppression.");
      setDeletedIds((prev) => prev.filter((dId) => dId !== id));
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    return (
      apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-[#0B69FF]" />
            <span>Planning & Rendez-vous d'Intervention</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestion du planning des techniciens et interventions à Tataouine</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="rendez-vous-technovolt"
            label="Exporter CSV"
            headers={["Réf. RDV", "Client", "Téléphone", "Prestation", "Date", "Heure", "Technicien", "Statut"]}
            rows={filteredAppointments.map((a) => [
              a.reference_number,
              a.customer_name,
              a.customer_phone,
              a.service_title,
              a.scheduled_date,
              a.scheduled_time,
              a.technician_name,
              a.status,
            ])}
          />

          <Button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="bg-[#0B69FF] hover:bg-[#094FC9] text-white gap-2 font-bold px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau rendez-vous</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par client, référence RDV, technicien ou prestation..."
            className="ps-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Grid of Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0B69FF]/50 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#0B69FF] bg-blue-50 px-2 py-0.5 rounded">
                  {apt.reference_number}
                </span>
                <h3 className="font-bold text-slate-900 mt-2 text-base">{apt.customer_name}</h3>
              </div>
              <Badge variant="success">Confirmé</Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1 font-medium">{apt.service_title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  {apt.scheduled_date} à <strong className="text-slate-800">{apt.scheduled_time}</strong> (durée: {apt.estimated_duration})
                </span>
              </div>
              {apt.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{apt.customer_phone}</span>
                </div>
              )}
              {apt.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{apt.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Intervenant : <strong className="text-slate-800">{apt.technician_name}</strong></span>
              </div>
            </div>

            {apt.notes && (
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {apt.notes}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Réf: {apt.reference_number}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(apt.id);
                }}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs"
                title="Supprimer ce rendez-vous"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Aucun rendez-vous trouvé.</div>
        ) : null}
      </div>

      {/* Modal Nouveau Rendez-vous */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouveau Rendez-vous d'Intervention</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sélectionner un Client (ou saisir un nouveau) *
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    value={availableCustomers.some((c) => c.name === formCustomer) ? formCustomer : ""}
                  >
                    <option value="">-- Choisir parmi les clients enregistrés --</option>
                    {availableCustomers.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.phone || "Pas de tél"})
                      </option>
                    ))}
                  </select>

                  <Input
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="Nom du client (ou personnalisé)"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prestation / Service *</label>
                <select
                  required
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {availableServices.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <Input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heure de passage *</label>
                  <Input
                    required
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone client</label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+216 ..."
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Durée estimée</label>
                  <Input
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="ex: 1h30"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse de l'intervention</label>
                <Input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="ex: Cité Ennour, Route de Remada, Tataouine"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technicien / Équipe assignée</label>
                <select
                  value={formTechnician}
                  onChange={(e) => setFormTechnician(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {techniciansList.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarques / Symptômes de panne</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ex: Disjoncteur saute dès mise sous tension..."
                  className="h-10 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9] text-white"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le rendez-vous"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce rendez-vous ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le rendez-vous du planning.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Oui, supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
