import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/forms/ContactForm";
import { Badge } from "@/components/ui/Badge";
import { getCompanySettings } from "@/lib/data/services";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const settings = await getCompanySettings();

  const whatsappClean = settings.whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-slate-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {t("title")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Une question, un dépannage ou un devis pour votre habitation ou commerce à Tataouine ? Contactez nos électriciens qualifiés.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Contact Info & Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Coordonnées Directes
                </h2>

                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50">
                    <div className="h-10 w-10 rounded-lg bg-[#0B69FF]/10 flex items-center justify-center text-[#0B69FF] shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Téléphone direct</div>
                      <div className="text-sm font-bold text-slate-900">{settings.phone}</div>
                      <div className="text-xs text-slate-500">Appels & Dépannages d'urgence</div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-emerald-700 font-medium">WhatsApp direct</div>
                      <div className="text-sm font-bold text-slate-900">{settings.whatsapp}</div>
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Ouvrir la conversation WhatsApp &rarr;
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50">
                    <div className="h-10 w-10 rounded-lg bg-[#0B69FF]/10 flex items-center justify-center text-[#0B69FF] shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Email professionnel</div>
                      <div className="text-sm font-bold text-slate-900">{settings.email}</div>
                      <div className="text-xs text-slate-500">Réponse garantie sous 24h</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50">
                    <div className="h-10 w-10 rounded-lg bg-[#0B69FF]/10 flex items-center justify-center text-[#0B69FF] shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Adresse</div>
                      <div className="text-sm font-bold text-slate-900">
                        {settings.address}, {settings.city}, Tunisie
                      </div>
                      <div className="text-xs text-slate-500">Gouvernorat de Tataouine</div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50">
                    <div className="h-10 w-10 rounded-lg bg-[#0B69FF]/10 flex items-center justify-center text-[#0B69FF] shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Horaires d'ouverture</div>
                      <div className="text-sm font-bold text-slate-900">{settings.opening_hours_fr}</div>
                      <div className="text-xs text-slate-500">Dimanche : Sur urgence uniquement</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Nos engagements de service</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2">
                  <p>&bullet; Devis gratuit sans aucun engagement préalable</p>
                  <p>&bullet; Respect strict des normes électriques et mise à la terre</p>
                  <p>&bullet; Disponibilité pour les interventions sur Tataouine</p>
                </div>
              </div>
            </div>

            {/* Right: Interactive Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm locale={locale} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
