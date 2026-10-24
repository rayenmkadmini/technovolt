import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServices } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("services");
  const services = await getServices(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-slate-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {t("title")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Toutes nos interventions sont exécutées par des professionnels certifiés respectant scrupuleusement les normes de sécurité en vigueur à Tataouine et sa région.
            </p>
          </div>

          {/* Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card
                key={service.id}
                id={service.category}
                className="group flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white"
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
                        {t("startingFrom")}{" "}
                        {formatCurrency(service.price_from, locale)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-medium text-white">
                        Sur Devis
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#1B3A6B] transition-colors">
                      {service.title}
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {service.short_description}
                    </p>

                    {service.scope_of_work && service.scope_of_work.length > 0 && (
                      <div className="pt-2 space-y-1.5 border-t border-slate-100">
                        {service.scope_of_work.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-slate-600"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/services/${service.slug}`}
                      className="text-sm font-semibold text-[#1B3A6B] hover:text-[#0F2342] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>{t("learnMore")}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link href={`/quote?service=${service.id}`}>
                      <Button variant="secondary" size="sm" className="font-semibold text-xs">
                        {t("requestQuote")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
