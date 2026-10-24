"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ClientRegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("clientAuth");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (formData.password.length < 6) {
      setErrorMsg(
        locale === "ar"
          ? "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل"
          : "Le mot de passe doit contenir au moins 6 caractères."
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign up in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: "client",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Upsert customer profile
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          role: "client",
          is_active: true,
          updated_at: new Date().toISOString(),
        });

        // Insert into customers table if reference does not exist
        await supabase.from("customers").insert({
          reference_number: `CLT-${Date.now().toString().slice(-6)}`,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          notes: `Enregistré via le portail client web (Tataouine: ${formData.address || "Centre-ville"})`,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/client");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la création du compte.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6">
          <div className="text-center space-y-3">
            <div
              className="relative h-12 w-48 mx-auto overflow-hidden flex items-center justify-center"
              style={{ position: "relative" }}
            >
              <Image
                src="/logo.png"
                alt="TECHNOVOLT"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t("registerTitle")}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {t("registerSubtitle")}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-900">
                Compte créé avec succès !
              </h3>
              <p className="text-xs text-emerald-700">
                Bienvenue chez TECHNOVOLT. Redirection vers votre espace client...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t("fullName")} *
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Ex: Mohamed Trabelsi"
                    className="ps-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t("phone")} *
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+216 90 000 000"
                      className="ps-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t("email")} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="nom@exemple.tn"
                      className="ps-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t("password")} * (min. 6 caractères)
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="ps-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t("address")} (Tataouine)
                </label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Ex: Cité Ennour, Route de Remada"
                    className="ps-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="secondary"
                  size="lg"
                  className="w-full gap-2 font-bold shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>{t("registerButton")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/client/login"
                className="font-bold text-[#0B69FF] hover:text-[#F5A623] transition-colors underline"
              >
                {t("signInLink")}
              </Link>
            </p>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Données personnelles protégées & confidentielles</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
