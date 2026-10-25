"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import {
  Wrench,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Clock,
} from "lucide-react";

export interface WorkOrderItem {
  id: string;
  job_number: string;
  customer_name: string;
  customer_phone?: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";
  start_date: string;
  completion_date?: string;
  labor_hours: number;
  total_cost: number;
  notes?: string;
  technician_name?: string;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_work_orders";

const initialDemoWorkOrders: WorkOrderItem[] = [
  {
    id: "wo-01",
    job_number: "OT-2026-0012",
    customer_name: "Société Sud Équipement",
    customer_phone: "+216 75 760 111",
    description: "Installation armoire générale de distribution et câblage atelier",
    status: "in_progress",
    start_date: "2026-10-20",
    completion_date: "2026-10-28",
    labor_hours: 18,
    total_cost: 1450.0,
    technician_name: "Tarak B.",
    notes: "Fourniture disjoncteurs différentiels 40A et câbles 10mm² inclus",
    created_at: "2026-10-20T08:00:00Z",
  },
  {
    id: "wo-02",
    job_number: "OT-2026-0011",
    customer_name: "M. Hichem Ben Amor",
    customer_phone: "+216 98 443 210",
    description: "Raccordement tableau villa R+1 et mise à la terre",
    status: "completed",
    start_date: "2026-10-15",
    completion_date: "2026-10-17",
    labor_hours: 12,
    total_cost: 680.0,
    technician_name: "Kais M.",
    notes: "Mesure de terre validée à 4.2 Ohms (conforme STEG)",
    created_at: "2026-10-15T09:30:00Z",
  },
];

export function AdminWorkOrdersClient({ locale }: { locale: string }) {
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(initialDemoWorkOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTech, setFormTech] = useState("");
  const [formHours, setFormHours] = useState("4");
  const [formCost, setFormCost] = useState("250");
  const [formStatus, setFormStatus] = useState<WorkOrderItem["status"]>("in_progress");
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorkOrders(parsed);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveWorkOrders = (next: WorkOrderItem[]) => {
    setWorkOrders(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomer.trim()) {
      setFormError("Veuillez renseigner le nom du client.");
      return;
    }
    if (!formDesc.trim()) {
      setFormError("Veuillez décrire les travaux à effectuer.");
      return;
    }
    if (!formStartDate) {
      setFormError("Veuillez indiquer la date de début du chantier.");
      return;
    }

    const hours = parseFloat(formHours);
    const cost = parseFloat(formCost);

    if (isNaN(hours) || hours < 0) {
      setFormError("Les heures de main d'œuvre doivent être un nombre positif.");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError("Le coût total doit être un montant positif.");
      return;
    }

    const newJobNumber = `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newWorkOrder: WorkOrderItem = {
      id: `wo-${Date.now()}`,
      job_number: newJobNumber,
      customer_name: formCustomer.trim(),
      customer_phone: formPhone.trim() || undefined,
      description: formDesc.trim(),
      technician_name: formTech.trim() || undefined,
      status: formStatus,
      start_date: formStartDate,
      completion_date: formEndDate || undefined,
      labor_hours: hours,
      total_cost: cost,
      notes: formNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    saveWorkOrders([newWorkOrder, ...workOrders]);
    showToast("Nouvel ordre de travail enregistré !");
    setIsModalOpen(false);

    // Reset form
    setFormCustomer("");
    setFormPhone("");
    setFormDesc("");
    setFormTech("");
    setFormHours("4");
    setFormCost("250");
    setFormStatus("in_progress");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    saveWorkOrders(workOrders.filter((wo) => wo.id !== id));
    setDeleteConfirmId(null);
    showToast("Ordre de travail supprimé.");
  };

  const filteredOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
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
            <Wrench className="h-6 w-6 text-[#0B69FF]" />
            <span>Ordres de Travail & Chantiers (Work Orders)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi opérationnel des chantiers en cours, temps passé et fournitures utilisées à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="ordres-de-travail-technovolt"
            label="Exporter CSV"
            headers={["N° Ordre", "Client", "Description", "Heures MO", "Coût Total (TND)", "Statut", "Début", "Fin"]}
            rows={filteredOrders.map((wo) => [
              wo.job_number,
              wo.customer_name,
              wo.description,
              wo.labor_hours,
              wo.total_cost,
              wo.status,
              wo.start_date,
              wo.completion_date || "-",
            ])}
          />

          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold text-xs bg-[#0B69FF] hover:bg-[#094FC9]"
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Ordre de Travail</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher chantier, client, N° ordre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">Tous les statuts</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="pending">En attente</option>
            <option value="on_hold">Suspendu</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
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
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-[#0B69FF]">
                    {wo.job_number}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                    <div>{wo.customer_name}</div>
                    {wo.customer_phone && (
                      <div className="text-[11px] font-mono text-slate-400 font-normal">
                        {wo.customer_phone}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 max-w-sm">
                    <p className="font-medium text-slate-800">{wo.description}</p>
                    {wo.technician_name && (
                      <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                        Tech : {wo.technician_name}
                      </p>
                    )}
                    {wo.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{wo.notes}</p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {wo.labor_hours} h
                    </span>
                  </td>

                  <td className="px-4 py-4 text-end font-bold text-slate-900">
                    {formatCurrency(wo.total_cost, locale)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={
                        wo.status === "completed"
                          ? "success"
                          : wo.status === "in_progress"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {wo.status === "completed"
                        ? "Terminé"
                        : wo.status === "in_progress"
                        ? "En cours"
                        : wo.status === "pending"
                        ? "En attente"
                        : wo.status === "on_hold"
                        ? "Suspendu"
                        : "Annulé"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-slate-500 text-[11px]">
                    <div>Début : {wo.start_date}</div>
                    {wo.completion_date && <div>Fin : {wo.completion_date}</div>}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(wo.id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer l'ordre de travail"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    Aucun ordre de travail ne correspond aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#0B69FF]" />
                <span>Nouvel Ordre de Travail</span>
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

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                  <Input
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="Ex: Société Sud Équipement"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description des Travaux *</label>
                <Textarea
                  required
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Remplacement disjoncteur général, tirage câble triphasé..."
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technicien assigné</label>
                  <Input
                    value={formTech}
                    onChange={(e) => setFormTech(e.target.value)}
                    placeholder="Ex: Tarak B."
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heures MO (h) *</label>
                  <Input
                    required
                    type="number"
                    step="0.5"
                    min="0"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coût Total (TND) *</label>
                  <Input
                    required
                    type="number"
                    step="0.001"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="pending">En attente</option>
                    <option value="on_hold">Suspendu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de début *</label>
                  <Input
                    required
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de fin prévue</label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes et fournitures utilisées</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Câble R2V 3x2.5, disjoncteur Schneider 16A..."
                  className="h-10 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-medium"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
                >
                  Enregistrer l'Ordre
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer cet ordre de travail ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera l'ordre de travail de la liste.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
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
