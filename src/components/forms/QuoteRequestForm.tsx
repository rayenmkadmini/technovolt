"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

export function QuoteRequestForm({
  locale,
  services,
  preselectedService,
}: {
  locale: string;
  services: { id: string; title?: string }[];
  preselectedService?: string;
}) {
  const t = useTranslations("quote.form");
  const tSuccess = useTranslations("quote.success");
  const [loading, setLoading] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceId: preselectedService || services[0]?.id || "",
    description: "",
    address: "Tataouine",
    preferredDate: "",
    preferredTime: "morning",
    preferredContact: "phone",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur de validation");
      }

      setSuccessRef(data.referenceNumber || "DEV-CONFIRMED");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = `Bonjour TECHNOVOLT, je viens d'envoyer une demande de devis sur votre site avec la référence ${successRef}. Pouvons-nous échanger ?`;
  const whatsappUrl = `https://wa.me/21690000000?text=${encodeURIComponent(whatsappMessage)}`;

  if (successRef) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 text-center shadow-lg space-y-6 max-w-2xl mx-auto">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {tSuccess("title")}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {tSuccess("message")}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            {tSuccess("reference")}
          </span>
          <span className="text-2xl font-black text-[#1B3A6B] font-mono">
            {successRef}
          </span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2 font-bold"
            >
              <MessageSquare className="h-5 w-5 text-emerald-800" />
              <span>{tSuccess("whatsapp")}</span>
            </Button>
          </a>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{tSuccess("backHome")}</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center">
              1
            </span>
            <span>Vos Coordonnées</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("name")} *
              </label>
              <Input
                required
                placeholder="Ex : Mohamed Ali"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("phone")} *
              </label>
              <Input
                required
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("email")} (optionnel)
              </label>
              <Input
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("address")} *
              </label>
              <Input
                required
                placeholder="Ex : Tataouine Ville, Cité Ennour"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center">
              2
            </span>
            <span>Votre Projet ou Panne</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("service")} *
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
              <option value="other">Autre prestation personnalisée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("description")} *
            </label>
            <Textarea
              required
              rows={4}
              placeholder="Décrivez précisément l'intervention demandée (ex: installation de 3 disjoncteurs, panne chauffe-eau, climatiseur à recharger en gaz, etc.)."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center">
              3
            </span>
            <span>Préférence de Rendez-vous</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("preferredDate")}
              </label>
              <Input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("preferredTime")}
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              >
                <option value="morning">Matin (08h00 - 12h00)</option>
                <option value="afternoon">Après-midi (13h00 - 18h00)</option>
                <option value="urgent">Urgent / Premier créneau disponible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("preferredContact")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="prefContact"
                  value="phone"
                  checked={formData.preferredContact === "phone"}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                />
                <span>Appel Téléphonique</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="prefContact"
                  value="whatsapp"
                  checked={formData.preferredContact === "whatsapp"}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                />
                <span>Message WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            className="w-full gap-2 font-bold text-base shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("sending")}</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                <span>{t("submit")}</span>
              </>
            )}
          </Button>

          <p className="mt-3 text-center text-xs text-slate-500">
            Devis 100% gratuit et sans engagement. Vos données restent confidentielles.
          </p>
        </div>
      </form>
    </div>
  );
}
