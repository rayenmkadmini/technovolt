"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { createWorkOrderAction, deleteWorkOrderAction } from "@/app/actions/adminActions";
import {
  Wrench,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

export interface WorkOrderItem {
  id: string;
  job_number: string;
  customer_name: string;
  customer_phone?: string;
  service_title?: string;
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

const fallbackServicesList = [
  "Installation Tableau Électrique & TGBT",
  "Dépannage & Recherche de Panne 24/7",
  "Rénovation Électrique Complète (NFC 15-100)",
  "Installation & Recharge Climatiseur",
  "Domotique & Éclairage Intelligent",
  "Mise à la terre & Contrôle de Conformité STEG",
];

const techniciansList = [
  "Tarak B. (Chef de chantier)",
  "Kais M. (Spécialiste Froid & Câblage)",
  "Mounir R. (Domotique & Réseaux)",
  "Équipe Technique Chantier",
];

function generateWorkOrderId(): string {
  return `wo-${Date.now()}`;
}

function generateNextJobNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `OT-${new Date().getFullYear()}-${randomSuffix}`;
}

export function AdminWorkOrdersClient({
  locale,
  initialWorkOrders = [],
  customersList = [],
}: {
  locale: string;
  initialWorkOrders?: WorkOrderItem[];
  customersList?: { name: string; phone: string }[];
}) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [addedWorkOrders, setAddedWorkOrders] = useState<WorkOrderItem[]>([]);
  const availableCustomers = customersList;
  const [availableServices, setAvailableServices] = useState<string[]>(fallbackServicesList);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseList = [...addedWorkOrders, ...initialWorkOrders];
  const workOrders = baseList.filter(
    (wo) => !deletedIds.includes(wo.id) && !deletedIds.includes(wo.job_number)
  );

  // Form state
  const [formJobNumber, setFormJobNumber] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formService, setFormService] = useState(fallbackServicesList[0]);
  const [formDesc, setFormDesc] = useState("");
  const [formTech, setFormTech] = useState(techniciansList[0]);
  const [formHours, setFormHours] = useState("6");
  const [formCost, setFormCost] = useState("350");
  const [formStatus, setFormStatus] = useState<WorkOrderItem["status"]>("in_progress");
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Services from localStorage if custom types were added
        const srvRaw = localStorage.getItem("technovolt_admin_services");
        if (srvRaw) {
          const parsedSrv = JSON.parse(srvRaw);
          if (Array.isArray(parsedSrv) && parsedSrv.length > 0) {
            const titles = parsedSrv.map((s: any) => s.title || s.name).filter(Boolean);
            if (titles.length > 0) setAvailableServices(titles);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openNewOrderModal = () => {
    setFormJobNumber(generateNextJobNumber());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (custName: string) => {
    setFormCustomer(custName);
    const found = availableCustomers.find((c) => c.name === custName);
    if (found && found.phone) {
      setFormPhone(found.phone);
    }
  };

  const handleServiceSelect = (serviceTitle: string) => {
    setFormService(serviceTitle);
    if (!formDesc) {
      setFormDesc(`Exécution de la prestation : ${serviceTitle}`);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomer.trim()) {
      setFormError("Veuillez renseigner ou sélectionner le nom du client.");
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

    if (formEndDate && formEndDate < formStartDate) {
      setFormError("La date de fin estimée ne peut pas être antérieure à la date de début.");
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

    setIsSubmitting(true);
    let createdId = generateWorkOrderId();
    try {
      const res = await createWorkOrderAction({
        job_number: formJobNumber || undefined,
        customer_name: formCustomer.trim(),
        customer_phone: formPhone.trim(),
        service_title: formService,
        description: formDesc.trim(),
        status: formStatus,
        start_date: formStartDate,
        completion_date: formEndDate || undefined,
        labor_hours: hours,
        total_cost: Math.round(cost * 1000) / 1000,
        notes: formNotes.trim(),
      });
      if (res.success && res.data?.id) {
        createdId = res.data.id;
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to sync work order to database:", err);
    }

    const newWorkOrder: WorkOrderItem = {
      id: createdId,
      job_number: formJobNumber || `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: formCustomer.trim(),
      customer_phone: formPhone.trim(),
      service_title: formService,
      description: formDesc.trim(),
      status: formStatus,
      start_date: formStartDate,
      completion_date: formEndDate || undefined,
      labor_hours: hours,
      total_cost: Math.round(cost * 1000) / 1000,
      technician_name: formTech.trim(),
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    setAddedWorkOrders((prev) => [newWorkOrder, ...prev]);
    setIsSubmitting(false);
    showToast(`Ordre de travail ${newWorkOrder.job_number} créé avec succès !`);
    setIsModalOpen(false);

    // Reset fields
    setFormCustomer("");
    setFormPhone("");
    setFormDesc("");
    setFormTech(techniciansList[0]);
    setFormHours("6");
    setFormCost("350");
    setFormStatus("in_progress");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormNotes("");
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    // 1. Optimistic removal
    setDeletedIds((prev) => [...prev, id]);
    setDeleteConfirmId(null);
    showToast("Ordre de travail supprimé.");

    try {
      const remaining = workOrders.filter((wo) => wo.id !== id && wo.job_number !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // 2. Database persistence
    try {
      const res = await deleteWorkOrderAction(id);
      if (!res.success) {
        showToast(res.error || "Erreur lors de la suppression.");
        setDeletedIds((prev) => prev.filter((dId) => dId !== id));
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete work order from database:", err);
      showToast("Erreur lors de la suppression.");
      setDeletedIds((prev) => prev.filter((dId) => dId !== id));
    }
  };

  const filteredOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.technician_name && wo.technician_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: WorkOrderItem["status"]) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="warning">En cours</Badge>;
      case "completed":
        return <Badge variant="success">Terminé</Badge>;
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "on_hold":
        return <Badge variant="danger">Suspendu</Badge>;
      case "cancelled":
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            <Wrench className="h-6 w-6 text-[#0B69FF]" />
            <span>Ordres de Travail & Interventions Chantier</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des chantiers électriques, rénovations et interventions techniques à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="ordres-de-travail-technovolt"
            label="Exporter CSV"
            headers={[
              "N° Ordre",
              "Client",
              "Téléphone",
              "Prestation",
              "Description",
              "Statut",
              "Début",
              "Fin",
              "Heures",
              "Coût Total (TND)",
              "Technicien",
            ]}
            rows={filteredOrders.map((wo) => [
              wo.job_number,
              wo.customer_name,
              wo.customer_phone || "",
              wo.service_title || "",
              wo.description,
              wo.status,
              wo.start_date,
              wo.completion_date || "",
              wo.labor_hours,
              wo.total_cost,
              wo.technician_name || "",
            ])}
          />

          <Button
            onClick={openNewOrderModal}
            className="bg-[#0B69FF] hover:bg-[#094FC9] text-white gap-2 font-bold px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel ordre de travail</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par N° OT, client, description, technicien..."
            className="ps-9 h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-start">N° Ordre</th>
                <th className="py-3 px-4 text-start">Client</th>
                <th className="py-3 px-4 text-start">Description des Travaux</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-start">Période</th>
                <th className="py-3 px-4 text-end">Heures</th>
                <th className="py-3 px-4 text-end">Coût Total</th>
                <th className="py-3 px-4 text-start">Responsable</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0B69FF]">{wo.job_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{wo.customer_name}</div>
                    {wo.customer_phone && <div className="text-[11px] text-slate-500 font-mono">{wo.customer_phone}</div>}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    {wo.service_title && (
                      <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">{wo.service_title}</div>
                    )}
                    <div className="text-slate-600 line-clamp-2">{wo.description}</div>
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(wo.status)}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div>Du: {wo.start_date}</div>
                    {wo.completion_date && <div className="text-slate-400 text-[11px]">Au: {wo.completion_date}</div>}
                  </td>
                  <td className="py-3 px-4 text-end font-semibold text-slate-800">{wo.labor_hours} h</td>
                  <td className="py-3 px-4 text-end font-bold text-slate-900">{formatCurrency(wo.total_cost, locale)}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{wo.technician_name || "—"}</td>
                  <td className="py-3 px-4 text-end">
                    <button
                      onClick={() => setDeleteConfirmId(wo.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Aucun ordre de travail trouvé pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvel Ordre de Travail */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#0B69FF]" />
                <h3 className="text-lg font-bold text-slate-900">Nouvel Ordre de Travail (OT)</h3>
                <span className="font-mono text-xs bg-blue-50 text-[#0B69FF] px-2 py-0.5 rounded font-bold">
                  {formJobNumber}
                </span>
              </div>
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
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Donneur d'Ordre *</label>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      required
                      value={formCustomer}
                      onChange={(e) => setFormCustomer(e.target.value)}
                      placeholder="Nom du client (ou personnalisé)"
                      className="h-10 text-sm"
                    />
                    <Input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Tél client (+216...)"
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prestation Concernée *</label>
                <select
                  value={formService}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {availableServices.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description des Travaux *</label>
                <Textarea
                  required
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Détaillez les tâches électriques, fournitures requises, consignes particulières..."
                  className="text-sm"
                />
              </div>

              {/* Responsable & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technicien Responsable</label>
                  <select
                    value={formTech}
                    onChange={(e) => setFormTech(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    {techniciansList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut Initial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
                  >
                    <option value="in_progress">En cours</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                    <option value="on_hold">Suspendu</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de fin estimée</label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Hours & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heures estimées</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coût total estimé (TND)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes et contraintes d'accès</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ex: Clé chez le gardien, couper disjoncteur général avant..."
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
                  {isSubmitting ? "Création..." : "Valider l'ordre de travail"}
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer cet ordre de travail ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action est irréversible.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">
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
