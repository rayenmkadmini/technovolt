import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProjects } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Calendar, Zap, ArrowRight } from "lucide-react";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {t("title")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Retrouvez nos interventions concrètes à Tataouine : villas, commerces, remises aux normes, installations de climatisation et automatismes domotiques.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="group rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
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
                    <span className="inline-flex items-center rounded-md bg-[#1B3A6B]/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
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

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#1B3A6B] transition-colors">
                      {proj.title}
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/quote"
                      className="text-xs font-semibold text-[#1B3A6B] hover:text-[#0F2342] inline-flex items-center gap-1"
                    >
                      <span>Demander un projet similaire</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-[#1B3A6B] text-white">
            <h3 className="text-2xl font-bold mb-2">Vous avez un projet en cours ou à venir ?</h3>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6">
              Nos électriciens vous accompagnent de l'étude préliminaire jusqu'à la mise sous tension finale.
            </p>
            <Link href="/quote">
              <Button variant="secondary" size="lg" className="font-bold">
                Demander une étude gratuite
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
