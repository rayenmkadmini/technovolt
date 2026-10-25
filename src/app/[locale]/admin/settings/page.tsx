"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { defaultCompanySettings } from "@/lib/data/initialData";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Settings,
  Save,
  CheckCircle2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  Percent,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultCompanySettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Client counter config
  const [counterEnabled, setCounterEnabled] = useState(true);
  const [counterPrefix, setCounterPrefix] = useState("+");
  const [counterValue, setCounterValue] = useState(500);
  const [counterLabel, setCounterLabel] = useState("Clients");
  const [counterTitle, setCounterTitle] = useState("");
  const [counterDescription, setCounterDescription] = useState("");
  const [counterAnimated, setCounterAnimated] = useState(true);
  const [counterSaved, setCounterSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("technovolt_client_counter");
      if (raw) {
        const c = JSON.parse(raw);
        if (typeof c.enabled === "boolean") setCounterEnabled(c.enabled);
        if (typeof c.prefix === "string") setCounterPrefix(c.prefix);
        if (typeof c.value === "number") setCounterValue(c.value);
        if (typeof c.label === "string") setCounterLabel(c.label);
        if (typeof c.title === "string") setCounterTitle(c.title);
        if (typeof c.description === "string") setCounterDescription(c.description);
        if (typeof c.animated === "boolean") setCounterAnimated(c.animated);
      }
    } catch {}
  }, []);

  const handleSaveCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = {
      enabled: counterEnabled,
      prefix: counterPrefix,
      value: Number(counterValue) || 0,
      label: counterLabel,
      title: counterTitle,
      description: counterDescription,
      animated: counterAnimated,
    };
    localStorage.setItem("technovolt_client_counter", JSON.stringify(cfg));
    setCounterSaved(true);
    setTimeout(() => setCounterSaved(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-[#0B69FF]" />
            <span>Paramètres de l'Entreprise (CMS Configuration)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordonnées publiques, WhatsApp, horaires et paramètres fiscaux de TECHNOVOLT
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>Modifications enregistrées !</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity & Slogans in 3 languages */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Identité de la Marque & Slogans Multilingues
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom Commercial Officiel
              </label>
              <Input
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Logo de l'Entreprise (Actuel)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-36 rounded border border-slate-200 overflow-hidden bg-slate-50">
                  <Image
                    src="/logo.jpg"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Logo officiel TECHNOVOLT
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slogan Français (Par défaut)
                </label>
                <Input
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-end">
                  Slogan Arabe (العربية)
                </label>
                <Input
                  dir="rtl"
                  value={settings.tagline_ar}
                  onChange={(e) => setSettings({ ...settings, tagline_ar: e.target.value })}
                  className="text-xs text-end"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slogan Anglais (English)
                </label>
                <Input
                  value={settings.tagline_en}
                  onChange={(e) => setSettings({ ...settings, tagline_en: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Coordonnées de Contact Direct (Affichées sur le site)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone Appel Direct
              </label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro WhatsApp
              </label>
              <Input
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email de Contact
              </label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse
              </label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ville
              </label>
              <Input
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pays
              </label>
              <Input
                value={settings.country}
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Taxes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Horaires d'Ouverture & Paramètres Fiscaux
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horaires d'ouverture (Français)
              </label>
              <Input
                value={settings.opening_hours_fr}
                onChange={(e) => setSettings({ ...settings, opening_hours_fr: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 text-end">
                Horaires d'ouverture (Arabe)
              </label>
              <Input
                dir="rtl"
                value={settings.opening_hours_ar}
                onChange={(e) => setSettings({ ...settings, opening_hours_ar: e.target.value })}
                className="text-xs text-end"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taux TVA par défaut (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={settings.default_tax_rate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_tax_rate: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-xs font-mono w-32"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Taux standard appliqué aux devis et factures (19% en Tunisie)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Devise Monétaire
              </label>
              <Input
                disabled
                value="TND — Dinar Tunisien (Millimes, 3 décimales)"
                className="text-xs bg-slate-100 text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Client Counter Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Compteur de Clients (Page d'accueil)</h2>
            {counterSaved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>Compteur enregistré !</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCounter} className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="counter-enabled"
                checked={counterEnabled}
                onChange={(e) => setCounterEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]"
              />
              <label htmlFor="counter-enabled" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Activer l'affichage du compteur
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Préfixe</label>
                <Input value={counterPrefix} onChange={(e) => setCounterPrefix(e.target.value)} placeholder="+" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <Input type="number" value={counterValue} onChange={(e) => setCounterValue(Number(e.target.value))} placeholder="500" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Libellé</label>
                <Input value={counterLabel} onChange={(e) => setCounterLabel(e.target.value)} placeholder="Clients" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titre (facultatif)</label>
                <Input value={counterTitle} onChange={(e) => setCounterTitle(e.target.value)} placeholder="Titre de la section" className="h-10 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description (facultatif)</label>
              <Input value={counterDescription} onChange={(e) => setCounterDescription(e.target.value)} placeholder="Description..." className="h-10 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="counter-animated"
                checked={counterAnimated}
                onChange={(e) => setCounterAnimated(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]"
              />
              <label htmlFor="counter-animated" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Animation du compteur
              </label>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
              <div className="text-xs text-slate-500 uppercase font-semibold">Aperçu</div>
              {counterTitle && <div className="text-lg font-bold text-slate-900">{counterTitle}</div>}
              <div className="text-4xl font-black text-[#0B69FF]">
                {counterPrefix}
                {Number(counterValue || 0).toLocaleString("fr-FR")}
              </div>
              <div className="text-sm text-slate-600">{counterLabel}</div>
              {counterDescription && <p className="text-xs text-slate-500">{counterDescription}</p>}
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="default" size="sm" className="gap-2 font-bold">
                <Save className="h-4 w-4" />
                <span>Enregistrer le Compteur</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="default" size="lg" className="gap-2 font-bold">
            <Save className="h-5 w-5" />
            <span>Enregistrer Tous les Paramètres</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
