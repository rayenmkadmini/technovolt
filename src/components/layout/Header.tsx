"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  X,
  Phone,
  FileText,
  Zap,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/services", label: t("services") },
    { href: "/projects", label: t("projects") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      {/* Top micro bar for quick contacts */}
      <div className="bg-[#1B3A6B] text-white text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Zap className="h-3 w-3 text-[#F5A623]" />
              <span>Tataouine, Tunisie &bullet; Électricité Générale & Domotique</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Interventions certifiées & Devis gratuit</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-3 w-3" />
              <span>{t("admin")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="relative h-12 w-36 sm:h-14 sm:w-44 overflow-hidden rounded-md flex items-center"
              style={{ position: "relative" }}
            >
              <Image
                src="/logo.jpg"
                alt="TECHNOVOLT Logo"
                fill
                sizes="(max-width: 640px) 144px, 176px"
                className="object-contain object-start transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#1B3A6B] bg-slate-100/80 font-semibold"
                    : "text-slate-600 hover:text-[#1B3A6B] hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            <Link href="/quote">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 font-semibold shadow-sm hover:shadow transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>{t("requestQuote")}</span>
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#1B3A6B] bg-slate-100 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/quote"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button variant="secondary" className="w-full gap-2 font-semibold">
                <FileText className="h-4 w-4" />
                <span>{t("requestQuote")}</span>
              </Button>
            </Link>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500 hover:text-slate-900"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t("admin")}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
