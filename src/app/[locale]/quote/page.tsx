import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuoteRequestForm } from "@/components/forms/QuoteRequestForm";
import { getServices } from "@/lib/data/services";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Clock, FileCheck } from "lucide-react";

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale } = await params;
  const { service: preselectedService } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("quote");
  const services = await getServices(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-slate-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {t("title")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Recevez une proposition claire, chiffrée et adaptée pour vos travaux électriques, climatisation ou domotique à Tataouine.
            </p>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Sans engagement</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#F5A623]" />
                <span>Réponse sous 24h</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-[#0B69FF]" />
                <span>Prix détaillés</span>
              </span>
            </div>
          </div>

          <QuoteRequestForm
            locale={locale}
            services={services}
            preselectedService={preselectedService}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
