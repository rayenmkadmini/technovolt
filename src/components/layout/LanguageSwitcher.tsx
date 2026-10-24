"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "ar", label: "العربية", flag: "🇹🇳" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: string) => {
    setIsOpen(false);
    // Preserves current page path when switching language
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="relative inline-block text-start" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B69FF] transition-all"
        aria-label="Sélectionner la langue / Select language / تغيير اللغة"
      >
        <Globe className="h-3.5 w-3.5 text-[#0B69FF]" />
        <span>{currentLang.label}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-1.5 w-36 origin-top-right rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className={lang.code === locale ? "font-semibold text-[#0B69FF]" : ""}>
                  {lang.label}
                </span>
              </span>
              {lang.code === locale && <Check className="h-3.5 w-3.5 text-[#0B69FF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
