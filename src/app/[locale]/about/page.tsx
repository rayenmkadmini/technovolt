import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Zap,
  ShieldCheck,
  Target,
  Award,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-slate-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {t("title")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              TECHNOVOLT est née de la volonté d'apporter aux particuliers et professionnels de Tataouine un service électrique moderne, hautement sécurisé et conforme aux meilleures exigences techniques.
            </p>
          </div>

          {/* Presentation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-sm">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase font-bold text-[#F5A623] tracking-wider">
                Notre Identité
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Votre Partenaire de Confiance en Électricité & Domotique
              </h2>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Implantée au cœur de <strong>Tataouine</strong>, la société TECHNOVOLT intervient sur l'ensemble des problématiques électriques : des installations complètes pour bâtiments neufs au dépannage d'urgence, en passant par l'installation de climatiseurs, chauffe-eau et solutions de domotique intelligente.
                </p>
                <p>
                  Dans une région caractérisée par des amplitudes thermiques importantes et des épisodes orageux réguliers, la qualité de l'installation électrique, le dimensionnement des câbles et la protection parafoudre sont indispensables pour préserver vos équipements.
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-2xl font-bold text-[#1B3A6B]">Tataouine</div>
                  <div className="text-xs text-slate-500">Zone d'intervention principale</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-2xl font-bold text-[#F5A623]">100%</div>
                  <div className="text-xs text-slate-500">Normes de sécurité respectées</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
                <Image
                  src="/logo.jpg"
                  alt="TECHNOVOLT Électricité générale et domotique"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Mission & Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Notre Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fournir des prestations d'électricité générale et de domotique sans compromis sur la sécurité des personnes et la fiabilité durable des équipements.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Nos Valeurs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rigueur technique, transparence tarifaire, ponctualité lors des rendez-vous et respect absolu de la parole donnée envers chacun de nos clients.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Excellence & Garantie</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Chaque raccordement, mise à la terre et tableau posé fait l'objet de contrôles rigoureux au multimètre et contrôleur d'isolement avant validation.
              </p>
            </div>
          </div>

          {/* Tataouine Service Coverage */}
          <div className="rounded-3xl bg-[#1B3A6B] text-white p-8 sm:p-12 space-y-6">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs uppercase font-bold text-[#F5A623]">
                Périmètre géographique
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Zones & Délégations Desservies à Tataouine
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nos équipes interviennent dans toute l'agglomération de Tataouine ainsi que dans l'ensemble des délégations environnantes :
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {[
                "Tataouine Ville",
                "Tataouine Nord / Sud",
                "Ghomrassen",
                "Remada",
                "Smâr",
                "Bir Lahmar",
              ].map((city, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/10 text-xs font-semibold backdrop-blur-sm"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#F5A623] shrink-0" />
                  <span>{city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
