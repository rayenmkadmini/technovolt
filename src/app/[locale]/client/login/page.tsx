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
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ClientLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("clientAuth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          locale === "ar"
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : error.message || "Identifiants invalides."
        );
        setLoading(false);
        return;
      }

      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile && ["super_admin", "owner", "admin", "manager"].includes(profile.role)) {
        router.push("/admin");
      } else {
        router.push("/client");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6">
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
              {t("loginTitle")}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("loginSubtitle")}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.tn"
                  className="ps-9 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t("password")}
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                size="lg"
                className="w-full gap-2 font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    <span>{t("loginButton")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              {t("noAccount")}{" "}
              <Link
                href="/client/register"
                className="font-bold text-[#0B69FF] hover:text-[#F5A623] transition-colors underline"
              >
                {t("signUpLink")}
              </Link>
            </p>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Authentification sécurisée TECHNOVOLT</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
