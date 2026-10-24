"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";

export function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations("contact.form");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "electrical_installation",
    message: "",
    preferredContact: "phone",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi");
      }

      setSuccess(data.referenceNumber || "MSG-RECU");
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "electrical_installation",
        message: "",
        preferredContact: "phone",
      });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Envoyez-nous un message
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Remplissez ce formulaire et notre équipe technique vous recontactera sous 24h.
      </p>

      {success ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-emerald-900">
            {t("success")}
          </h3>
          <p className="text-sm text-emerald-800">
            {t("successMessage")}
          </p>
          <div className="inline-block px-3 py-1 bg-emerald-100 rounded-md text-xs font-mono font-bold text-emerald-900">
            Réf : {success}
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuccess(null)}
              className="text-xs"
            >
              Envoyer un autre message
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("service")}
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF]"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            >
              <option value="electrical_installation">Électricité Générale / Installation</option>
              <option value="electrical_repair">Dépannage & Panne électrique</option>
              <option value="ac_installation">Climatisation (Pose / Entretien / Gaz)</option>
              <option value="water_heater">Chauffe-eau Électrique</option>
              <option value="home_automation">Domotique & Automatismes</option>
              <option value="other">Autre demande</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("preferredContact")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="phone"
                  checked={formData.preferredContact === "phone"}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                />
                <span>Téléphone</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="whatsapp"
                  checked={formData.preferredContact === "whatsapp"}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                />
                <span>WhatsApp</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="email"
                  checked={formData.preferredContact === "email"}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                />
                <span>Email</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("message")} *
            </label>
            <Textarea
              required
              rows={4}
              placeholder="Décrivez votre besoin ou votre panne..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="lg"
              className="w-full gap-2 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("sending")}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>{t("submit")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
