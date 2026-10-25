"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { defaultCompanySettings } from "@/lib/data/initialData";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateCompanySettingsAction } from "@/app/actions/adminActions";
import {
  Settings,
  Save,
  CheckCircle2,
  Upload,
  RefreshCw,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultCompanySettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Logo management state
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSaved, setLogoSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client counter config
  const [counterEnabled, setCounterEnabled] = useState(true);
  const [counterPrefix, setCounterPrefix] = useState("+");
  const [counterValue, setCounterValue] = useState(500);
  const [counterLabel, setCounterLabel] = useState("Clients");
  const [counterTitle, setCounterTitle] = useState("");
  const [counterDescription, setCounterDescription] = useState("");
  const [counterAnimated, setCounterAnimated] = useState(true);
  const [counterSaved, setCounterSaved] = useState(false);

  // Floating counter config
  const [floatEnabled, setFloatEnabled] = useState(true);
  const [floatPrefix, setFloatPrefix] = useState("+");
  const [floatValue, setFloatValue] = useState(500);
  const [floatLabel, setFloatLabel] = useState("Clients");
  const [floatSide, setFloatSide] = useState<"left" | "right">("left");
  const [floatBottom, setFloatBottom] = useState(24);
  const [floatSaved, setFloatSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedLogo = localStorage.getItem("technovolt_company_logo");
        if (storedLogo) setLogoUrl(storedLogo);

        const storedSettings = localStorage.getItem("technovolt_company_settings");
        if (storedSettings) setSettings(JSON.parse(storedSettings));

        const rawFloat = localStorage.getItem("technovolt_floating_counter");
        if (rawFloat) {
          const c = JSON.parse(rawFloat);
          if (typeof c.enabled === "boolean") setFloatEnabled(c.enabled);
          if (typeof c.prefix === "string") setFloatPrefix(c.prefix);
          if (typeof c.value === "number") setFloatValue(c.value);
          if (typeof c.label === "string") setFloatLabel(c.label);
          if (c.side === "left" || c.side === "right") setFloatSide(c.side);
          if (typeof c.bottom === "number") setFloatBottom(c.bottom);
        }

        const rawCounter = localStorage.getItem("technovolt_client_counter");
        if (rawCounter) {
          const c = JSON.parse(rawCounter);
          if (typeof c.enabled === "boolean") setCounterEnabled(c.enabled);
          if (typeof c.prefix === "string") setCounterPrefix(c.prefix);
          if (typeof c.value === "number") setCounterValue(c.value);
          if (typeof c.label === "string") setCounterLabel(c.label);
          if (typeof c.title === "string") setCounterTitle(c.title);
          if (typeof c.description === "string") setCounterDescription(c.description);
          if (typeof c.animated === "boolean") setCounterAnimated(c.animated);
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const processLogoFile = (file: File) => {
    setLogoError(null);
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setLogoError("Format d'image non valide. Veuillez importer un fichier PNG, JPG, WebP ou SVG.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setLogoError("Le fichier est trop volumineux. La taille maximale autorisée est de 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setLogoPreview(ev.target.result);
      }
    };
    reader.onerror = () => {
      setLogoError("Échec de la lecture du fichier image.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleSaveLogo = () => {
    if (!logoPreview) return;
    try {
      localStorage.setItem("technovolt_company_logo", logoPreview);
      setLogoUrl(logoPreview);
      setLogoPreview(null);
      setLogoSaved(true);
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => setLogoSaved(false), 3000);
    } catch {
      setLogoError("Erreur lors de l'enregistrement du logo.");
    }
  };

  const handleResetLogo = () => {
    try {
      localStorage.removeItem("technovolt_company_logo");
      setLogoUrl("/logo.png");
      setLogoPreview(null);
      setLogoSaved(true);
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => setLogoSaved(false), 3000);
    } catch {}
  };

  const handleSaveFloat = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = {
      enabled: floatEnabled,
      prefix: floatPrefix,
      value: Number(floatValue) || 0,
      label: floatLabel,
      side: floatSide,
      bottom: Number(floatBottom) || 24,
    };
    localStorage.setItem("technovolt_floating_counter", JSON.stringify(cfg));
    window.dispatchEvent(new Event("storage"));
    setFloatSaved(true);
    setTimeout(() => setFloatSaved(false), 3000);
  };

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
    window.dispatchEvent(new Event("storage"));
    setCounterSaved(true);
    setTimeout(() => setCounterSaved(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompanySettingsAction(settings);
      localStorage.setItem("technovolt_company_settings", JSON.stringify(settings));
    } catch (err) {
      console.error("Failed to update company settings:", err);
    }
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
            Coordonnées publiques, WhatsApp, logo officiel et paramètres fiscaux de TECHNOVOLT
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>Modifications enregistrées !</span>
          </span>
        )}
      </div>

      {/* Logo Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#0B69FF]" />
            <h2 className="text-base font-bold text-slate-900">
              Logo de l'Entreprise & Identité Visuelle
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0B69FF] border border-blue-200">
              Admin Requis
            </span>
          </div>
          {logoSaved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Logo mis à jour !</span>
            </span>
          )}
        </div>

        {logoError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{logoError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Current Logo Preview */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Logo Actuel
            </label>
            <div className="h-28 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
              <div className="relative h-16 w-52">
                <Image
                  src={logoUrl}
                  alt="Logo TECHNOVOLT"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Affiché sur l'en-tête, le pied de page et les devis/factures.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetLogo}
                className="text-[11px] h-7 gap-1 text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Réinitialiser</span>
              </Button>
            </div>
          </div>

          {/* Upload / Drag and Drop Area */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Modifier le Logo (Glisser-déposer ou sélectionner)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoFileChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center ${
                isDragging
                  ? "border-[#0B69FF] bg-blue-50/50"
                  : "border-slate-300 hover:border-[#0B69FF] bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <Upload className={`h-6 w-6 mb-1 ${isDragging ? "text-[#0B69FF]" : "text-slate-400"}`} />
              <p className="text-xs font-semibold text-slate-700">
                Glissez votre nouveau logo ici ou <span className="text-[#0B69FF] underline">parcourez l'appareil</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, WebP ou SVG (Max. 5 Mo)
              </p>
              <div className="mt-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-xs font-semibold gap-1.5 h-7 bg-white"
                >
                  <Upload className="h-3 w-3 text-[#0B69FF]" />
                  <span>Importer un logo depuis l'appareil</span>
                </Button>
              </div>
            </div>

            {logoPreview && (
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-24 rounded bg-white p-1 border border-slate-200">
                    <Image
                      src={logoPreview}
                      alt="Aperçu logo"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Nouvel aperçu prêt</span>
                    <span className="text-[10px] text-slate-500">Confirmez pour appliquer le changement</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoPreview(null)}
                    className="text-xs h-8"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSaveLogo}
                    className="text-xs h-8 font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
                  >
                    Enregistrer le logo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
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
                Immatriculation Fiscale / RC
              </label>
              <Input
                value={settings.tax_number || "MF: 1234567/X/A/M/000"}
                onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                className="text-sm font-mono"
              />
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

          <div className="space-y-4">
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
              <Button type="button" onClick={handleSaveCounter} variant="default" size="sm" className="gap-2 font-bold">
                <Save className="h-4 w-4" />
                <span>Enregistrer le Compteur</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Client Counter Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Compteur Flottant (toujours visible)</h2>
            {floatSaved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>Enregistré !</span>
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="float-enabled" checked={floatEnabled} onChange={(e) => setFloatEnabled(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#0B69FF] focus:ring-[#0B69FF]" />
              <label htmlFor="float-enabled" className="text-xs font-semibold text-slate-700 cursor-pointer">Activer le compteur flottant</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Préfixe</label>
                <Input value={floatPrefix} onChange={(e) => setFloatPrefix(e.target.value)} placeholder="+" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <Input type="number" value={floatValue} onChange={(e) => setFloatValue(Number(e.target.value))} placeholder="500" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Libellé</label>
                <Input value={floatLabel} onChange={(e) => setFloatLabel(e.target.value)} placeholder="Clients" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Côté</label>
                <select value={floatSide} onChange={(e) => setFloatSide(e.target.value as "left" | "right")} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="left">Gauche</option>
                  <option value="right">Droite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Position verticale (px)</label>
                <Input type="number" value={floatBottom} onChange={(e) => setFloatBottom(Number(e.target.value))} placeholder="24" className="h-10 text-sm" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Aperçu</div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B69FF] text-white shadow-lg">
                <span className="text-lg font-black">{floatPrefix}{Number(floatValue || 0).toLocaleString("fr-FR")}</span>
                <span className="text-xs font-semibold text-white/90">{floatLabel}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveFloat} variant="default" size="sm" className="gap-2 font-bold">
                <Save className="h-4 w-4" />
                <span>Enregistrer le Compteur Flottant</span>
              </Button>
            </div>
          </div>
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
