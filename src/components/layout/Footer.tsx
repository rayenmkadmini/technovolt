import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Zap,
} from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tServices = useTranslations("services.categories");
  const locale = useLocale();

  return (
    <footer className="bg-[#0F1D33] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Identity & Brand */}
          <div className="space-y-4">
            <div
              className="relative h-12 w-48 rounded-lg bg-white p-2 flex items-center shadow-md"
              style={{ position: "relative" }}
            >
              <Image
                src="/logo.png"
                alt="TECHNOVOLT"
                fill
                sizes="192px"
                className="object-contain"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("description")}
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Tataouine, Sud Tunisien &bullet; Interventions 6j/7</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h3 className="text-white text-base font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F5A623]" />
              <span>{t("ourServices")}</span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services#electrical_installation"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{tServices("electrical_installation")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services#electrical_repair"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{tServices("electrical_repair")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services#ac_installation"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{tServices("ac_installation")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services#water_heater_installation"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{tServices("water_heater_installation")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services#home_automation"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{tServices("home_automation")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h3 className="text-white text-base font-semibold mb-4">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  {tNav("services")}
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  {tNav("projects")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link href="/quote" className="hover:text-[#F5A623] transition-colors flex items-center gap-1 font-medium">
                  <span>{tNav("requestQuote")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Location */}
          <div>
            <h3 className="text-white text-base font-semibold mb-4">
              {t("contactInfo")}
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#F5A623] shrink-0 mt-1" />
                <span>Tataouine, Tunisie (Zone urbaine et délégations)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#F5A623] shrink-0" />
                <span>Lun - Sam : 08:00 - 18:00</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#F5A623] shrink-0" />
                <span>Disponible pour dépannages & devis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#F5A623] shrink-0" />
                <span>contact@technovolt.tn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} TECHNOVOLT. {t("allRights")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/about#privacy" className="hover:text-slate-200 transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/about#terms" className="hover:text-slate-200 transition-colors">
              {t("terms")}
            </Link>
            <Link href="/admin" className="text-slate-400 hover:text-[#F5A623] transition-colors">
              Portail Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
