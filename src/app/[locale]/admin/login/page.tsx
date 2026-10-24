"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("rayen25360@gmail.com");
  const [password, setPassword] = useState("123456789");
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
        setErrorMsg(error.message || "Identifiants incorrects.");
        setLoading(false);
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile && !["super_admin", "owner", "admin", "manager"].includes(profile.role)) {
        setErrorMsg("Accès réservé au personnel administratif. Veuillez vous connecter via l'Espace Client.");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
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
          <h1 className="text-xl font-extrabold text-slate-900">
            Espace d'Administration Sécurisé
          </h1>
          <p className="text-xs text-slate-500">
            Connexion réservée au personnel habilité TECHNOVOLT
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Adresse Email Professionnelle
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mot de Passe Sécurisé
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full gap-2 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Vérification des droits...</span>
                </>
              ) : (
                <>
                  <span>Accéder au Tableau de Bord</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Chiffrement TLS 256-bit</span>
          </span>
          <Link href="/" className="hover:text-slate-900 underline">
            Retour au site public
          </Link>
        </div>
      </div>
    </div>
  );
}
