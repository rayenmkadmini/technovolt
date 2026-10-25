import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServiceBySlug, getServices } from "@/lib/data/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
} from "lucide-react";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = await getServiceBySlug(slug, locale);

  if (!service) {
    notFound();
  }

  const allServices = await getServices(locale);
  const relatedServices = allServices.filter((s) => s.slug !== slug).slice(0, 3);

  // Schema.org structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.short_description,
    provider: {
      "@type": "LocalBusiness",
      name: "TECHNOVOLT",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tataouine",
        addressCountry: "TN",
      },
    },
    areaServed: "Tataouine, Tunisia",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 bg-slate-50 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Accueil
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            <Link href="/services" className="hover:text-slate-900 transition-colors">
              Services
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-900 truncate">
              {service.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-10">
              {/* Cover Image */}
              <div
                className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-slate-100"
                style={{ position: "relative" }}
              >
                <Image
                  src={service.cover_image}
                  alt={service.title || "Service TECHNOVOLT"}
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* Title & Overview */}
              <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1">
                  Électricité & Maintenance &bullet; Tataouine
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {service.title}
                </h1>
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  {service.short_description}
                </p>
                <div className="text-slate-600 leading-relaxed space-y-3">
                  <p>{service.full_description}</p>
                </div>
              </div>

              {/* Scope of Work */}
              {service.scope_of_work && service.scope_of_work.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#F5A623]" />
                    <span>Périmètre & Prestations Réalisées</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {service.scope_of_work.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {service.benefits && service.benefits.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#0B69FF]" />
                    <span>Vos Avantages avec TECHNOVOLT</span>
                  </h2>
                  <ul className="space-y-3 pt-2">
                    {service.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-sm text-slate-700"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar CTA Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">
                    Tarification indicative
                  </span>
                  <div className="mt-2">
                    {service.show_price && service.price_from ? (
                      <div>
                        <div className="text-2xl font-black text-[#0B69FF]">
                          À partir de {formatCurrency(service.price_from, locale)}
                        </div>
                        <span className="text-xs text-slate-500">
                          Devis précis établi après évaluation sur place
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-2xl font-black text-[#0B69FF]">
                          Sur Devis Gratuit
                        </div>
                        <span className="text-xs text-slate-500">
                          Sans engagement & intervention rapide
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {service.estimated_duration && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 p-3 rounded-lg bg-slate-50">
                    <Clock className="h-4 w-4 text-[#F5A623]" />
                    <span>Délai estimé : <strong>{service.estimated_duration}</strong></span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Link href={`/quote?service=${service.id}`} className="block">
                    <Button variant="secondary" size="lg" className="w-full gap-2 font-bold">
                      <Zap className="h-5 w-5" />
                      <span>Demander un devis pour ce service</span>
                    </Button>
                  </Link>

                  <Link href="/contact" className="block">
                    <Button variant="outline" size="lg" className="w-full gap-2">
                      <PhoneCall className="h-4 w-4" />
                      <span>Poser une question</span>
                    </Button>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Intervention à Tataouine & environs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Matériel agréé et garanti</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className="mt-20 pt-12 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">
                Services Associés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedServices.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/services/${rel.slug}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#0B69FF] transition-colors mb-2">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {rel.short_description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B69FF]">
                      <span>En savoir plus</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
