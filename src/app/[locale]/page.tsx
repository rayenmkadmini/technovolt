import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServices, getProjects, getCompanySettings } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  FileCheck,
  Sparkles,
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
  const tFaq = await getTranslations("faq");
  const tCta = await getTranslations("cta");
  const tCommon = await getTranslations("common");

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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* ================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#122442] to-[#1B3A6B] text-white pt-12 pb-20 lg:pt-20 lg:pb-32">
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
                <div className="pt-8 border-t border-white/15 grid grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>Conformité & Sécurité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>Intervention Rapide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-[#F5A623] shrink-0" />
                    <span>Devis Gratuit 100%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Card with Brand Logo */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800">
                    <Image
                      src="/logo.jpg"
                      alt="TECHNOVOLT Électricité générale et domotique"
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                      <div className="text-white space-y-1">
                        <span className="text-xs uppercase tracking-wider text-[#F5A623] font-semibold">
                          Tataouine & Région
                        </span>
                        <h4 className="font-bold text-lg">
                          Solutions Électriques Professionnelles
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
        {/* 2. SERVICES OVERVIEW */}
        {/* ================================================================= */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <Badge variant="secondary" className="px-3 py-1">
                {tServices("title")}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {tServices("subtitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200/80 flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Image
                      src={service.cover_image}
                      alt={service.title || "Service TECHNOVOLT"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 end-3">
                      {service.show_price && service.price_from ? (
                        <span className="inline-flex items-center rounded-lg bg-[#1B3A6B] px-3 py-1 text-xs font-semibold text-white shadow-md">
                          {tServices("startingFrom")}{" "}
                          {formatCurrency(service.price_from, locale)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-medium text-white">
                          Devis Gratuit
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1B3A6B] transition-colors mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {service.short_description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/services/${service.slug}`}
                        className="text-sm font-semibold text-[#1B3A6B] hover:text-[#0F2342] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>{tServices("learnMore")}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>

                      <Link href={`/quote?service=${service.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          {tServices("requestQuote")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/services">
                <Button variant="default" size="lg" className="gap-2">
                  <span>{tServices("allServices")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. WHY CHOOSE TECHNOVOLT */}
        {/* ================================================================= */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <Badge variant="secondary" className="px-3 py-1">
                {tWhy("title")}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {tWhy("subtitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  key: "experience",
                  icon: Wrench,
                  title: "Expertise Technique Éprouvée",
                  desc: "Des spécialistes qualifiés en installations électriques, dépannages haute sécurité et automatismes modernes.",
                },
                {
                  key: "quality",
                  icon: ShieldCheck,
                  title: "Matériel Certifié & Conforme",
                  desc: "Utilisation exclusive d'appareillages conformes aux normes tunisiennes et internationales pour une sécurité sans faille.",
                },
                {
                  key: "availability",
                  icon: Clock,
                  title: "Réactivité à Tataouine",
                  desc: "Interventions rapides en cas de coupure ou panne urgente dans le gouvernorat de Tataouine et ses délégations.",
                },
                {
                  key: "pricing",
                  icon: FileCheck,
                  title: "Tarifs Clairs & Transparents",
                  desc: "Devis détaillé avant chaque intervention. Pas de frais cachés, prix calculés avec rigueur et justesse.",
                },
                {
                  key: "guarantee",
                  icon: CheckCircle2,
                  title: "Garantie & Suivi Technique",
                  desc: "Chaque prestation réalisée par TECHNOVOLT bénéficie d'un suivi attentif et d'une garantie de bon fonctionnement.",
                },
                {
                  key: "local",
                  icon: MapPin,
                  title: "Proximité Locale",
                  desc: "Une entreprise ancrée à Tataouine, connaissant parfaitement les contraintes climatiques et réseau du sud tunisien.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-lg transition-all duration-300 space-y-3"
                  >
                    <div className="h-12 w-12 rounded-lg bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
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
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Image
                      src={proj.cover_image}
                      alt={proj.title || "Projet TECHNOVOLT"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 start-4">
                      <span className="inline-flex items-center rounded-md bg-[#1B3A6B]/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
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

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1B3A6B] transition-colors">
                      {proj.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                </div>
              ))}
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
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#1B3A6B]/30 transition-colors"
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
        <section className="py-20 bg-gradient-to-r from-[#1B3A6B] via-[#152D54] to-[#0A1526] text-white relative overflow-hidden">
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

      <Footer />
    </div>
  );
}
