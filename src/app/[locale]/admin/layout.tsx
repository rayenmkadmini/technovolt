"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Calendar,
  Wrench,
  FileText,
  CreditCard,
  TrendingDown,
  Package,
  Truck,
  BarChart3,
  Layers,
  Image as ImageIcon,
  Settings,
  Star,
  Activity,
  Globe,
  Menu,
  X,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuSections = [
    {
      title: "Pilotage & CRM",
      items: [
        { href: "/admin", label: "Tableau de Bord", icon: LayoutDashboard },
        { href: "/admin/leads", label: "Demandes & Devis", icon: Inbox, badge: "2" },
        { href: "/admin/customers", label: "Fichier Clients", icon: Users },
        { href: "/admin/appointments", label: "Rendez-vous", icon: Calendar, badge: "2" },
        { href: "/admin/work-orders", label: "Chantiers & Travaux", icon: Wrench },
      ],
    },
    {
      title: "Facturation & Finances",
      items: [
        { href: "/admin/quotations", label: "Devis Clients", icon: FileText },
        { href: "/admin/invoices", label: "Factures", icon: FileText },
        { href: "/admin/payments", label: "Règlements Reçus", icon: CreditCard },
        { href: "/admin/expenses", label: "Dépenses & Achats", icon: TrendingDown },
        { href: "/admin/reports", label: "Rapports & Rentabilité", icon: BarChart3 },
      ],
    },
    {
      title: "Stock & Fournisseurs",
      items: [
        { href: "/admin/inventory", label: "Matériel & Stock", icon: Package },
        { href: "/admin/suppliers", label: "Fournisseurs", icon: Truck },
      ],
    },
    {
      title: "Site Web & CMS",
      items: [
        { href: "/admin/services", label: "Gestion Services", icon: Layers },
        { href: "/admin/projects", label: "Galerie Projets", icon: ImageIcon },
        { href: "/admin/reviews", label: "Avis Clients", icon: Star },
        { href: "/admin/media", label: "Médiathèque", icon: ImageIcon },
        { href: "/admin/seo", label: "Référencement SEO", icon: Globe },
        { href: "/admin/settings", label: "Paramètres Société", icon: Settings },
      ],
    },
    {
      title: "Sécurité & Système",
      items: [
        { href: "/admin/users", label: "Utilisateurs & Droits", icon: Users },
        { href: "/admin/activity", label: "Journal d'Activité", icon: Activity },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar for Admin */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/admin" className="flex items-center gap-3">
            <div
              className="relative h-9 w-36 overflow-hidden rounded bg-white px-2 py-1 flex items-center shadow-xs"
              style={{ position: "relative" }}
            >
              <Image
                src="/logo.png"
                alt="TECHNOVOLT Admin"
                fill
                sizes="144px"
                className="object-contain object-start"
              />
            </div>
            <span className="hidden sm:inline-block rounded bg-[#1B3A6B] px-2 py-0.5 text-xs font-bold text-white">
              ADMINISTRATION
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Voir le site public</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center gap-2 border-s border-slate-200 ps-4">
            <div className="h-8 w-8 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center text-xs font-bold">
              TV
            </div>
            <div className="hidden md:block text-start">
              <div className="text-xs font-bold text-slate-900">Admin TECHNOVOLT</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tataouine &bull; Connecté</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Persistent Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-e border-slate-200 bg-white p-4 space-y-6 shrink-0">
          <div className="space-y-6 flex-1 overflow-y-auto">
            {menuSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {sec.title}
                </div>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#1B3A6B] text-white shadow-xs font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${active ? "text-[#F5A623]" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            active
                              ? "bg-[#F5A623] text-slate-900"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Système Sécurisé</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Devise par défaut : <strong>TND (Dinar Tunisien)</strong>
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-72 bg-white p-4 flex flex-col space-y-6 shadow-xl z-50 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Navigation Admin</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {menuSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </div>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "bg-[#1B3A6B] text-white shadow-xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${active ? "text-[#F5A623]" : "text-slate-500"}`} />
                          <span>{item.label}</span>
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Admin Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
