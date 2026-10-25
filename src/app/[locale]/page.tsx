import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServices, getProjects, getCompanySettings } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClientCounter } from "@/components/home/ClientCounter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Phone,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  FileCheck,
  MapPin,
  ChevronRight,
} from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("hero");
  const tServices = await getTranslations("services");
  const tWhy = await getTranslations("whyUs");
  const tHow = await getTranslations("howItWorks");

  const [services, projects, settings] = await Promise.all([
    getServices(locale),
    getProjects(locale),
    getCompanySettings(),
  ]);

  const whatsappUrl = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    locale === "ar"
      ? "مرحباً تكنوفولت، أود الاستفسار عن خدماتكم."
      : "Bonjour TECHNOVOLT, je souhaite avoir un renseignement ou un devis."
  )}`;

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <Header />

      <main className="flex-1">
        {/* ================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0848B8] to-[#0B69FF] text-white pt-12 pb-20 lg:pt-20 lg:pb-32">
          {/* Decorative ambient background glows */}
          <div className="absolute top-0 start-1/4 -translate-y-1/2 w-96 h-96 bg-[#F5A623]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 end-10 translate-y-1/3 w-[30rem] h-[30rem] bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headlines & Actions */}
              <div className="lg:col-span-7 space-y-6 text-start">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-slate-200">
                  <span className="flex h-2 w-2 rounded-full bg-[#F5A623] animate-ping" />
                  <span>{t("tagline")}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
                  {t("title")}
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                  {t("subtitle")}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <Link href="/quote">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Zap className="h-5 w-5 text-slate-900 fill-slate-900" />
                      <span>{t("cta")}</span>
                    </Button>
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 text-base font-medium bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
                    >
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                      <span>{t("ctaWhatsapp")}</span>
                    </Button>
                  </a>
                </div>

                {/* Badges / Guarantees */}
                <div className="pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>
                      {locale === "ar"
                        ? "المطابقة والسلامة"
                        : locale === "en"
                        ? "Safety & Compliance"
                        : "Conformité & Sécurité"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>
                      {locale === "ar"
                        ? "تدخل سريع"
                        : locale === "en"
                        ? "Fast Intervention"
                        : "Intervention Rapide"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>
                      {locale === "ar"
                        ? "عرض سعر مجاني"
                        : locale === "en"
                        ? "Free Quotation"
                        : "Devis Gratuit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Card with Brand Logo */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900"
                    style={{ position: "relative" }}
                  >
                    <Image
                      src="/images/projects/technovolt-chantier-01.jpg"
                      alt="TECHNOVOLT Électricité générale et domotique"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 480px"
                      className="object-cover"
                    />
                    {/* Floating Brand Logo Badge */}
                    <div className="absolute top-4 start-4 rounded-xl bg-white/95 backdrop-blur-md px-4 py-2 shadow-lg border border-white/40 flex items-center">
                      <div className="relative h-7 w-32" style={{ position: "relative" }}>
                        <Image
                          src="/logo.png"
                          alt="TECHNOVOLT"
                          fill
                          sizes="128px"
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end p-6">
                      <div className="text-white space-y-1">
                        <span className="text-xs uppercase tracking-wider text-[#F5A623] font-semibold">
                          {locale === "ar" ? "تطاوين والجنوب التونسي" : "Tataouine & Région"}
                        </span>
                        <h4 className="font-bold text-lg">
                          {locale === "ar"
                            ? "حلول كهربائية احترافية وتحكم ذكي"
                            : "Solutions Électriques Professionnelles & Domotique"}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Micro stat bar */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-white/10 p-3">
                      <div className="text-xl font-bold text-[#F5A623]">6j / 7</div>
                      <div className="text-xs text-slate-300">Disponibilité</div>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <div className="text-xl font-bold text-white">100%</div>
                      <div className="text-xs text-slate-300">Devis Sans Engagement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. SERVICES OVERVIEW - ASYMMETRIC HUMAN-CRAFTED SHOWCASE */}
        {/* ================================================================= */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B69FF]/10 text-[#0B69FF] text-xs font-bold">
                  <Zap className="h-3.5 w-3.5 text-[#F5A623]" />
                  <span>{tServices("title")}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {tServices("subtitle")}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === "ar"
                    ? "خدمات فنية معتمدة تلبي أدق متطلبات الأمان الكهربائي والمناخ الصحراوي في تطاوين."
                    : "Interventions certifiées adaptées aux spécificités techniques et climatiques de Tataouine et du sud tunisien."}
                </p>
              </div>

              <Link href="/services" className="shrink-0">
                <Button variant="outline" className="gap-2 font-semibold">
                  <span>{tServices("allServices")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Featured Primary Service: Full Electrical Engineering Showcase */}
            {services.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all hover:shadow-lg">
                <div
                  className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-900"
                  style={{ position: "relative" }}
                >
                  <Image
                    src={services[0].cover_image}
                    alt={services[0].title || "Installation Électrique TECHNOVOLT"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute top-4 start-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B69FF]/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                      <ShieldCheck className="h-4 w-4 text-[#F5A623]" />
                      <span>{locale === "ar" ? "الخدمة المركزية" : "Service Majeur"}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-4 end-4">
                    <span className="inline-flex items-center rounded-lg bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white">
                      Tataouine & Région
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold uppercase tracking-wider text-[#0B69FF]">
                        Génie Électrique Résidentiel & Tertiaire
                      </span>
                      {services[0].estimated_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{services[0].estimated_duration}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {services[0].title}
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {services[0].short_description}
                    </p>

                    {services[0].scope_of_work && services[0].scope_of_work.length > 0 && (
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {services[0].scope_of_work.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Tarification</div>
                      <div className="text-lg font-extrabold text-[#0B69FF]">
                        {services[0].show_price && services[0].price_from
                          ? `${tServices("startingFrom")} ${formatCurrency(services[0].price_from, locale)}`
                          : "Devis Gratuit & Personnalisé"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link href={`/services/${services[0].slug}`}>
                        <Button variant="outline" size="sm" className="font-semibold text-xs">
                          {tServices("learnMore")}
                        </Button>
                      </Link>
                      <Link href={`/quote?service=${services[0].id}`}>
                        <Button variant="secondary" size="sm" className="gap-1.5 font-bold text-xs shadow-sm">
                          <Zap className="h-3.5 w-3.5" />
                          <span>{tServices("requestQuote")}</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Asymmetric Grid for Specialized Secondary Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(1).map((service) => (
                <div
                  key={service.id}
                  className="group rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between hover:border-[#0B69FF]/40 hover:shadow-lg transition-all duration-300 space-y-5"
                >
                  <div className="space-y-4">
                    <div
                      className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100"
                      style={{ position: "relative" }}
                    >
                      <Image
                        src={service.cover_image}
                        alt={service.title || "Service"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 end-3">
                        {service.show_price && service.price_from ? (
                          <span className="inline-block rounded-md bg-[#0B69FF] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                            {tServices("startingFrom")} {formatCurrency(service.price_from, locale)}
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
                            Devis Gratuit
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#0B69FF] transition-colors">
                        {service.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {service.short_description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/services/${service.slug}`}
                      className="text-xs font-bold text-[#0B69FF] inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{tServices("learnMore")}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                    <Link href={`/quote?service=${service.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-700 hover:text-[#0B69FF]">
                        {tServices("requestQuote")}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. WHY CHOOSE TECHNOVOLT - HUMAN LOCAL ENGINEERING FOCUS */}
        {/* ================================================================= */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Local Engineering Authority */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623]/10 text-[#B3740A] text-xs font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#F5A623]" />
                  <span>{tWhy("title")}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {tWhy("subtitle")}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === "ar"
                    ? "يتطلب المناخ الصحراوي القاسي في تطاوين معايير كهربائية صارمة. نحن نصمم ونصلح شبكاتكم لتتحمل درجات الحرارة العالية وتقلبات الجهد الكهربائي بكل أمان."
                    : "Le climat du sud tunisien impose des exigences électriques accrues : fortes chaleurs estivales, surcharges de climatisation et surtensions orageuses. TECHNOVOLT conçoit des installations durables et sécurisées."}
                </p>

                {/* Local Stats Box */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B69FF]">
                    {locale === "ar" ? "التزامنا المحلي بتطاوين" : "Nos Engagements Locaux à Tataouine"}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-black text-[#0B69FF]">6j / 7</div>
                      <div className="text-xs text-slate-500 font-medium">Disponibilité terrain</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[#F5A623]">100%</div>
                      <div className="text-xs text-slate-500 font-medium">Devis sans engagement</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/contact">
                    <Button variant="default" className="gap-2 font-bold shadow-md">
                      <Phone className="h-4 w-4" />
                      <span>{locale === "ar" ? "تواصل مع فريقنا الفني" : "Contacter nos techniciens"}</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: 4 Technical Pillars Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-[#0B69FF]/10 flex items-center justify-center text-[#0B69FF]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Normes & Sécurité Absolue
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mise à la terre certifiée, disjoncteurs différentiels 30mA et appareillages conformes aux standards tunisiens et internationaux.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-[#F5A623]/15 flex items-center justify-center text-[#D4891A]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Réactivité à Tataouine
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Déplacement rapide pour les pannes urgentes et diagnostic transparent avant toute intervention de réparation.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tarifs Clairs en Millimes TND
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Devis détaillé avec prix unitaires précis (3 décimales). Aucun frais dissimulé, validation préalable obligatoire.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ancrage Régional Sud
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Couverture de Tataouine Ville, Ghomrassen, Remada, Bir Lahmar, Smâr, Beni Khedache et Dhehiba.
                  </p>
                </div>
              </div>
            </div>

            {/* Regional Delegation Strip */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-[#F5A623] shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {locale === "ar" ? "المناطق المغطاة بولاية تطاوين" : "Zone d'Intervention — Gouvernorat de Tataouine"}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Tataouine Ville &bull; Ghomrassen &bull; Remada &bull; Bir Lahmar &bull; Smâr &bull; Beni Khedache &bull; Dhehiba
                  </p>
                </div>
              </div>

              <Link href="/contact" className="shrink-0">
                <Button variant="secondary" size="sm" className="font-bold text-xs gap-1.5">
                  <span>Demander une visite</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. FEATURED PROJECTS */}
        {/* ================================================================= */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
              <div className="space-y-3">
                <Badge variant="secondary" className="px-3 py-1">
                  Réalisations Récentes
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Nos Chantiers & Projets
                </h2>
                <p className="text-slate-600 max-w-xl">
                  Découvrez quelques-uns de nos projets récents réalisés à Tataouine en électricité résidentielle, tertiaire et domotique.
                </p>
              </div>

              <Link href="/projects">
                <Button variant="outline" className="gap-2 shrink-0">
                  <span>Voir tous les projets</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div
                    className="relative aspect-[16/10] overflow-hidden bg-slate-100"
                    style={{ position: "relative" }}
                  >
                    <Image
                      src={proj.cover_image}
                      alt={proj.title || "Projet TECHNOVOLT"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 start-4">
                      <span className="inline-flex items-center rounded-md bg-[#0B69FF]/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                        {proj.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                        <span>{proj.location}</span>
                      </span>
                      {proj.completion_date && (
                        <span>{proj.completion_date}</span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0B69FF] transition-colors">
                      {proj.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Worksite Photos Gallery Strip */}
            <div className="mt-12 rounded-2xl bg-[#0B69FF] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-2 text-center md:text-start">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F5A623] text-slate-900">
                  {locale === "ar" ? "معرض الصور الكامل" : "74 Photos de Chantiers Réels"}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {locale === "ar"
                    ? "استكشف معرض صور أعمالنا الميدانية في تطاوين"
                    : "Découvrez notre galerie de 74 photos de travaux récents"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  {locale === "ar"
                    ? "أعمال تمديد الكابلات، تركيب الخزانات الكهربائية، سبوتات الليد وتوصيلات التكييف بالصور."
                    : "Armoires modulaires, câblages sous conduits, éclairage architectural et installations de climatisation."}
                </p>
              </div>

              <Link href="/projects" className="shrink-0">
                <Button variant="secondary" size="lg" className="font-bold text-slate-900 gap-2">
                  <span>
                    {locale === "ar" ? "فتح معرض الصور (74)" : "Ouvrir la Galerie (74 photos)"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. HOW IT WORKS */}
        {/* ================================================================= */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <Badge variant="secondary" className="px-3 py-1">
                {tHow("title")}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {tHow("subtitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Contact & Demande",
                  desc: "Remplissez le formulaire en ligne ou contactez-nous directement par téléphone ou WhatsApp.",
                },
                {
                  step: "02",
                  title: "Diagnostic & Devis",
                  desc: "Nous analysons votre besoin technique et vous transmettons une proposition détaillée sans frais.",
                },
                {
                  step: "03",
                  title: "Planification",
                  desc: "Validation conjointe de la date et de l'heure d'intervention selon vos disponibilités.",
                },
                {
                  step: "04",
                  title: "Intervention Pro",
                  desc: "Nos techniciens interviennent avec matériel adapté et appliquent les règles de sécurité strictes.",
                },
                {
                  step: "05",
                  title: "Contrôle & Test",
                  desc: "Vérification rigoureuse du bon fonctionnement sous tension et explications au client.",
                },
                {
                  step: "06",
                  title: "Facturation & Garantie",
                  desc: "Remise de la facture claire et suivi post-intervention pour votre entière tranquillité.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <span className="text-3xl font-black text-[#F5A623]/80">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. FAQ SECTION */}
        {/* ================================================================= */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 space-y-3">
              <Badge variant="secondary" className="px-3 py-1">
                Questions Fréquentes
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Tout ce que vous devez savoir
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Quelles sont les zones couvertes par TECHNOVOLT ?",
                  a: "Nous intervenons principalement dans toute la ville de Tataouine ainsi que les délégations voisines (Ghomrassen, Remada, Smâr, Bir Lahmar, Dhehiba, Beni Khedache). Pour des chantiers importants, nous pouvons nous déplacer au-delà.",
                },
                {
                  q: "Le devis est-il gratuit et sans engagement ?",
                  a: "Oui, l'établissement du devis est 100% gratuit et transparent. Pour les chantiers neufs ou les rénovations complètes, nous pouvons nous déplacer sur site pour évaluer précisément les besoins techniques.",
                },
                {
                  q: "En combien de temps intervenez-vous pour une panne urgente ?",
                  a: "Pour les pannes d'électricité totales ou urgences sécuritaires à Tataouine, nous mobilisons un technicien dans les plus brefs délais suivant votre appel ou message WhatsApp.",
                },
                {
                  q: "Quelles sont les garanties sur vos travaux ?",
                  a: "Toutes nos installations et pièces neuves bénéficient de garanties matérielles constructeur ainsi que de notre garantie de bonne exécution conforme aux normes de sécurité électrique.",
                },
                {
                  q: "Installez-vous des climatiseurs achetés ailleurs ?",
                  a: "Oui, nous pouvons réaliser l'installation complète, le raccordement frigorifique et électrique ainsi que le tirage au vide de votre propre climatiseur neuf ou d'occasion.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#0B69FF]/30 transition-colors"
                >
                  <h3 className="text-base font-bold text-slate-900 flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed ps-8">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. FINAL CALL TO ACTION BANNER */}
        {/* ================================================================= */}
        <section className="py-20 bg-gradient-to-r from-[#0B69FF] via-[#094FC9] to-[#063A9B] text-white relative overflow-hidden">
          <div className="absolute top-0 end-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-[#F5A623]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#F5A623] font-semibold tracking-wide uppercase">
              Besoin d'un électricien qualifié ?
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Prêt à concrétiser votre projet ou sécuriser votre installation ?
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Demandez votre devis gratuit en quelques clics ou échangez directement avec notre équipe technique.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/quote">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto gap-2 font-bold text-base shadow-xl"
                >
                  <Zap className="h-5 w-5 fill-slate-900" />
                  <span>Demander un devis gratuit</span>
                </Button>
              </Link>

              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
                >
                  <PhoneCall className="h-5 w-5" />
                  <span>Nous contacter</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ClientCounter />
      <Footer />
    </div>
  );
}
