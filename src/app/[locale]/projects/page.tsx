import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProjects } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProjectsGallery } from "@/components/projects/ProjectsGallery";
import { MapPin, Calendar, Zap, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projects");
  const projects = await getProjects(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-slate-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="secondary" className="px-3.5 py-1 text-xs font-bold gap-1.5 inline-flex items-center">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{t("title")}</span>
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {locale === "ar"
                ? "مشاريع وأشغال ميدانية حقيقية نفذتها شركة تكنوفولت في ولاية تطاوين: فلل سكنية، محلات تجارية، شبكات كهربائية، تكييف وأنظمة ذكية."
                : locale === "en"
                ? "Authentic electrical installations and engineering works carried out by TECHNOVOLT in Tataouine: villas, commercial buildings, wiring, air conditioning, and home automation."
                : "Retrouvez nos interventions concrètes à Tataouine : villas, commerces, remises aux normes, installations de climatisation et automatismes domotiques."}
            </p>
          </div>

          {/* Featured Major Projects Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0B69FF]" />
                <span>
                  {locale === "ar"
                    ? "أبرز المشاريع المنجزة"
                    : locale === "en"
                    ? "Featured Project Highlights"
                    : "Projets & Chantiers Majeurs"}
                </span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {projects.length}{" "}
                {locale === "ar" ? "مشاريع رئيسية" : locale === "en" ? "key projects" : "réalisations détaillées"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="group rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div
                    className="relative aspect-[16/10] overflow-hidden bg-slate-900"
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
                      <span className="inline-flex items-center rounded-md bg-[#0B69FF]/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-xs">
                        {proj.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                          <span>{proj.location}</span>
                        </span>
                        {proj.completion_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{proj.completion_date}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#0B69FF] transition-colors">
                        {proj.title}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href="/quote"
                        className="text-xs font-semibold text-[#0B69FF] hover:text-[#0F2342] inline-flex items-center gap-1 group/btn"
                      >
                        <span>
                          {locale === "ar"
                            ? "طلب دراسة لمشروع مماثل"
                            : locale === "en"
                            ? "Request a similar project"
                            : "Demander un projet similaire"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive 74-Photo Worksite Gallery */}
          <ProjectsGallery locale={locale} />

          {/* Bottom CTA */}
          <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0848B8] to-[#0B69FF] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 end-0 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              {locale === "ar"
                ? "هل لديك مشروع بناء أو صيانة قيد التنفيذ في تطاوين ؟"
                : locale === "en"
                ? "Do you have an ongoing or planned project in Tataouine?"
                : "Vous avez un projet en cours ou à venir à Tataouine ?"}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              {locale === "ar"
                ? "يرافقكم خبراؤنا في الكهرباء العامة والتكييف والتحكم الذكي من المخطط الأولي حتى التشغيل النهائي."
                : locale === "en"
                ? "Our electrical, HVAC and automation specialists assist you from the blueprint study to final commissioning."
                : "Nos électriciens vous accompagnent de l'étude préliminaire jusqu'à la mise sous tension finale."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/quote">
                <Button variant="secondary" size="lg" className="font-bold gap-2 text-slate-900 shadow-lg">
                  <Zap className="h-4 w-4 fill-slate-900" />
                  <span>
                    {locale === "ar"
                      ? "طلب عرض سعر مجاني"
                      : locale === "en"
                      ? "Request Free Quote"
                      : "Demander une étude gratuite"}
                  </span>
                </Button>
              </Link>
              <a
                href="https://wa.me/21626250027?text=Bonjour%20TECHNOVOLT,%20je%20souhaite%20un%20devis"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="font-medium bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  WhatsApp: +216 26 250 027
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
