"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  serviceCategory: string;
  comment: string;
  date: string;
  isVerified: boolean;
  status: "approved" | "pending" | "rejected";
}

const initialReviews: Review[] = [
  {
    id: "rev-01",
    customerName: "Youssef B. (Cité Ennour)",
    rating: 5,
    serviceCategory: "Installation Électrique Villa",
    comment: "Travail très propre et soigné. Le technicien a pris le temps d'expliquer l'équilibrage des disjoncteurs et le parafoudre. Très satisfait.",
    date: "2026-03-08",
    isVerified: true,
    status: "approved",
  },
  {
    id: "rev-02",
    customerName: "Bilel T. (Tataouine Centre)",
    rating: 5,
    serviceCategory: "Climatisation 24000 BTU",
    comment: "Pose rapide et propre avant les fortes chaleurs. Tirage au vide impeccable et prix transparent conforme au devis.",
    date: "2026-05-14",
    isVerified: true,
    status: "approved",
  },
  {
    id: "rev-03",
    customerName: "Nizar G. (Ghomrassen)",
    rating: 4,
    serviceCategory: "Dépannage Urgent",
    comment: "Intervention rapide le jour même suite court-circuit au tableau. Pièce de rechange disponible dans la camionnette.",
    date: "2026-09-02",
    isVerified: true,
    status: "approved",
  },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({
    customerName: "",
    rating: 5,
    serviceCategory: "Électricité Générale",
    comment: "",
    isVerified: true,
  });

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.customerName || !newReview.comment) return;

    setReviews([
      {
        id: `rev-${Date.now()}`,
        ...newReview,
        date: new Date().toISOString().split("T")[0],
        status: "approved",
      },
      ...reviews,
    ]);
    setShowAddForm(false);
    setNewReview({
      customerName: "",
      rating: 5,
      serviceCategory: "Électricité Générale",
      comment: "",
      isVerified: true,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Star className="h-6 w-6 text-[#F5A623] fill-[#F5A623]" />
            <span>Modération des Témoignages & Avis Clients</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Seuls les avis authentiques de clients réels ayant validé la publication sont affichés
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1.5 font-semibold text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Avis Client Vérifié</span>
        </Button>
      </div>

      {/* Add Review Drawer / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddReview}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Enregistrer un Nouvel Avis Client (Avec Accord Explicite)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nom du Client *
              </label>
              <Input
                required
                placeholder="Ex : Mohamed A. (Tataouine)"
                value={newReview.customerName}
                onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Service Réalisé
              </label>
              <Input
                value={newReview.serviceCategory}
                onChange={(e) => setNewReview({ ...newReview, serviceCategory: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Note Attribuée
              </label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                className="w-full text-xs h-10 rounded-lg border border-slate-300 px-3 bg-white"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 / 5)</option>
                <option value={4}>⭐⭐⭐⭐ (4 / 5)</option>
                <option value={3}>⭐⭐⭐ (3 / 5)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Commentaire du Client *
            </label>
            <Textarea
              required
              rows={3}
              placeholder="Texte authentique du retour d'expérience client..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="default" size="sm">
              Valider et Publier
            </Button>
          </div>
        </form>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Date</th>
                <th className="px-4 py-3.5 text-start">Client</th>
                <th className="px-4 py-3.5 text-start">Prestation</th>
                <th className="px-4 py-3.5 text-center">Note</th>
                <th className="px-4 py-3.5 text-start">Commentaire Client</th>
                <th className="px-4 py-3.5 text-center">Statut</th>
                <th className="px-4 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 text-slate-500 font-mono">
                    {rev.date}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{rev.customerName}</span>
                      {rev.isVerified && (
                        <span title="Client Vérifié">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {rev.serviceCategory}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-[#F5A623] inline-flex items-center gap-1">
                      <span>{rev.rating}</span>
                      <Star className="h-3.5 w-3.5 fill-[#F5A623]" />
                    </span>
                  </td>
                  <td className="px-4 py-4 max-w-md text-slate-700 italic">
                    "{rev.comment}"
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge
                      variant={
                        rev.status === "approved"
                          ? "success"
                          : rev.status === "pending"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px]"
                    >
                      {rev.status === "approved"
                        ? "Publié"
                        : rev.status === "pending"
                        ? "En attente"
                        : "Refusé"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-end space-x-1.5 whitespace-nowrap">
                    {rev.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(rev.id, "approved")}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                        title="Approuver et publier"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    {rev.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(rev.id, "rejected")}
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                        title="Rejeter"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
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
