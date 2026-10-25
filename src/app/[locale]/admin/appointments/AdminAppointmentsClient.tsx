"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2,
  Trash2,
  X,
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

interface Props {
  initialAppointments: AppointmentItem[];
}

export function AdminAppointmentsClient({ initialAppointments }: Props) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formService, setFormService] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("1h");
  const [formAddress, setFormAddress] = useState("");
  const [formTechnician, setFormTechnician] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setTimeout(() => setAppointments(parsed), 0);
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: AppointmentItem[]) => {
    setAppointments(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save appointments failed", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.trim() || !formDate || !formTime) {
      alert("Veuillez saisir le client, la date et l'heure.");
      return;
    }
    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      reference_number: `RDV-${Date.now().toString().slice(-6)}`,
      customer_name: formCustomer.trim(),
      customer_phone: formPhone.trim(),
      service_title: formService.trim(),
      scheduled_date: formDate,
      scheduled_time: formTime,
      estimated_duration: formDuration,
      address: formAddress.trim(),
      technician_name: formTechnician.trim(),
      status: "confirmed",
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };
    save([newApt, ...appointments]);
    showToast("Rendez-vous ajouté avec succès !");
    setIsModalOpen(false);
    setFormCustomer("");
    setFormPhone("");
    setFormService("");
    setFormDate("");
    setFormTime("");
    setFormDuration("1h");
    setFormAddress("");
    setFormTechnician("");
    setFormNotes("");
  };

  const handleDelete = (id: string) => {
    save(appointments.filter((a) => a.id !== id));
    setDeleteConfirmId(null);
    showToast("Rendez-vous supprimé.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-[#0B69FF]" />
            <span>Planning & Rendez-vous d'Intervention</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestion du planning des techniciens et interventions à Tataouine</p>
        </div>
        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Nouveau Rendez-vous</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.map((apt) => (
          <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 hover:border-[#0B69FF] transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#0B69FF]">{apt.reference_number}</span>
              <Badge variant="success" className="text-xs">{apt.status === "confirmed" ? "Confirmé" : apt.status}</Badge>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">{apt.customer_name}</h2>
              {apt.customer_phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{apt.customer_phone}</span>
                </div>
              )}
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              {apt.service_title && <div className="font-semibold text-slate-800">{apt.service_title}</div>}
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-[#F5A623]" />
                <span>Date : <strong>{apt.scheduled_date}</strong> à <strong>{apt.scheduled_time}</strong> ({apt.estimated_duration})</span>
              </div>
              {apt.address && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                  <span>{apt.address}</span>
                </div>
              )}
              {apt.technician_name && (
                <div className="flex items-center gap-2 text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>Technicien assigné : {apt.technician_name}</span>
                </div>
              )}
            </div>
            {apt.notes && <p className="text-xs text-slate-500 italic">Note : {apt.notes}</p>}
            <div className="flex justify-end">
              <button onClick={() => setDeleteConfirmId(apt.id)} className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {appointments.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Aucun rendez-vous.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouveau Rendez-vous</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <Input required value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)} placeholder="Nom du client" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+216 ..." className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service</label>
                <Input value={formService} onChange={(e) => setFormService(e.target.value)} placeholder="Service concerné" className="h-10 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <Input required type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heure *</label>
                  <Input required type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="h-10 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durée estimée</label>
                <Input value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="1h" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Adresse d'intervention" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technicien assigné</label>
                <Input value={formTechnician} onChange={(e) => setFormTechnician(e.target.value)} placeholder="Nom du technicien" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes..." className="h-10 text-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
                <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer ce rendez-vous ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera le rendez-vous.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">Annuler</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirmId)} className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Oui, supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}