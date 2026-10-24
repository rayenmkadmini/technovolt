"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  FileText,
  Receipt,
  Calendar,
  PlusCircle,
  LogOut,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ClientDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("clientAuth");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        // Allow visitor preview or redirect
        setUser({ email: "client.tataouine@technovolt.tn" });
        setProfile({
          full_name: "Client TECHNOVOLT",
          role: "client",
          phone: "+216 90 000 000",
        });
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (prof) {
        setProfile(prof);
      } else {
        setProfile({
          full_name: currentUser.user_metadata?.full_name || "Client TECHNOVOLT",
          role: "client",
        });
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const sampleQuotes = [
    {
      id: "DEV-2026-0042",
      service: "Installation Climatiseur Split 18000 BTU",
      date: "2026-10-20",
      amount: "680.000 TND",
      status: "accepted",
      statusLabel: locale === "ar" ? "مقبول" : "Accepté",
    },
    {
      id: "DEV-2026-0038",
      service: "Rénovation Tableau Électrique & Disjoncteurs",
      date: "2026-10-14",
      amount: "420.000 TND",
      status: "completed",
      statusLabel: locale === "ar" ? "مكتمل" : "Terminé",
    },
  ];

  const sampleInvoices = [
    {
      id: "FAC-2026-0029",
      date: "2026-10-15",
      amount: "420.000 TND",
      status: "paid",
      statusLabel: locale === "ar" ? "مدفوعة" : "Payée",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#1B3A6B] text-white flex items-center justify-center font-bold text-2xl shadow-md">
              <User className="h-8 w-8 text-[#F5A623]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile?.full_name || "Bienvenue"}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {locale === "ar" ? "حريف معتمد" : "Client Particulier"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{user?.email}</span>
                <span>&bull;</span>
                <span>Tataouine, Tunisie</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/quote" className="flex-1 md:flex-initial">
              <Button variant="secondary" className="w-full gap-2 font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>{t("requestService")}</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="gap-2 text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("signOut")}</span>
            </Button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("myQuotes")}
              </span>
              <FileText className="h-5 w-5 text-[#1B3A6B]" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">2</div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>1 devis accepté & validé</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("myInvoices")}
              </span>
              <Receipt className="h-5 w-5 text-[#F5A623]" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">1</div>
            <p className="text-xs text-slate-500">Total facturé : 420.000 TND (Payée)</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("myAppointments")}
              </span>
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">1</div>
            <p className="text-xs text-slate-500">Prochaine visite technique planifiée</p>
          </div>
        </div>

        {/* Quotes & Invoices Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quotes Table */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#1B3A6B]" />
                <span>{t("myQuotes")}</span>
              </h2>
              <Link href="/quote" className="text-xs font-bold text-[#1B3A6B] hover:underline">
                + Nouveau devis
              </Link>
            </div>

            <div className="space-y-3">
              {sampleQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{q.id}</span>
                      <span className="text-xs text-slate-400">&bull; {q.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{q.service}</p>
                  </div>
                  <div className="text-end space-y-1">
                    <div className="text-xs font-bold text-[#1B3A6B]">{q.amount}</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {q.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Support & Invoices */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#F5A623]" />
                <span>{t("myInvoices")}</span>
              </h2>

              <div className="space-y-3">
                {sampleInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{inv.id}</div>
                      <div className="text-[11px] text-slate-400">{inv.date}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-xs font-bold text-slate-900">{inv.amount}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {inv.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Support Card */}
            <div className="bg-gradient-to-br from-[#1B3A6B] to-[#122442] text-white rounded-3xl p-6 space-y-4 shadow-md">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F5A623]" />
                <h3 className="font-bold text-sm">Assistance Technique Directe</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Une urgence électrique ou une question sur votre installation à Tataouine ? Nos techniciens sont joignables directement.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://wa.me/21690000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full gap-2 font-bold text-xs bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </Button>
                </a>
                <a href="tel:+21675000000" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs text-white border-white/20 hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Appeler</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
