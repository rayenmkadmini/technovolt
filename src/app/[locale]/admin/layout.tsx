"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
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
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [customLogo, setCustomLogo] = useState("/logo.png");
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);
  const [leadsCount, setLeadsCount] = useState<number>(0);

  useEffect(() => {
    const updateState = () => {
      try {
        const stored = localStorage.getItem("technovolt_company_logo");
        if (stored) setCustomLogo(stored);
        else setCustomLogo("/logo.png");

        const aptRaw = localStorage.getItem("technovolt_admin_appointments");
        if (aptRaw !== null) {
          const parsedApt = JSON.parse(aptRaw);
          setAppointmentsCount(Array.isArray(parsedApt) ? parsedApt.length : 0);
        } else {
          setAppointmentsCount(0);
        }

        const leadsRaw = localStorage.getItem("technovolt_admin_leads");
        if (leadsRaw !== null) {
          const parsedLeads = JSON.parse(leadsRaw);
          setLeadsCount(Array.isArray(parsedLeads) ? parsedLeads.length : 0);
        } else {
          setLeadsCount(0);
        }
      } catch {}
    };
    updateState();
    window.addEventListener("storage", updateState);
    return () => window.removeEventListener("storage", updateState);
  }, []);

  const isLoginPage = pathname.includes("/admin/login");

  useEffect(() => {
    if (isLoginPage) return;

    const checkAdminAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .single();

        if (profile && ["super_admin", "owner", "admin", "manager"].includes(profile.role)) {
          setAdminUser({ ...user, profile });
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      }
    };

    checkAdminAuth();
  }, [pathname, isLoginPage, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // If on login page, render page directly without administrative chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  const menuSections = [
    {
      title: "Pilotage & CRM",
      items: [
        { href: "/admin", label: "Tableau de Bord", icon: LayoutDashboard },
        { href: "/admin/leads", label: "Demandes & Devis", icon: Inbox, badge: leadsCount > 0 ? String(leadsCount) : undefined },
        { href: "/admin/customers", label: "Fichier Clients", icon: Users },
        { href: "/admin/appointments", label: "Rendez-vous", icon: Calendar, badge: appointmentsCount > 0 ? String(appointmentsCount) : undefined },
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
    <div className="min-h-screen bg-slate-100 flex flex-col" suppressHydrationWarning>
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
                src={customLogo}
                alt="TECHNOVOLT Admin"
                fill
                unoptimized
                sizes="144px"
                className="object-contain object-start"
              />
            </div>
            <span className="hidden sm:inline-block rounded bg-[#0B69FF] px-2 py-0.5 text-xs font-bold text-white">
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

          <div className="flex items-center gap-3 border-s border-slate-200 ps-4" suppressHydrationWarning>
            <div className="h-8 w-8 rounded-full bg-[#0B69FF] text-white flex items-center justify-center text-xs font-bold" suppressHydrationWarning>
              {adminUser?.profile?.full_name?.slice(0, 2).toUpperCase() || "TV"}
            </div>
            <div className="hidden md:block text-start" suppressHydrationWarning>
              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {adminUser?.profile?.full_name || "Admin"}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{adminUser?.profile?.role || "Habilité"}</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
                          ? "bg-[#0B69FF] text-white shadow-xs font-semibold"
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

          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Accès Sécurisé</span>
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              <span>Quitter</span>
            </button>
          </div>
        </aside>

        {/* Mobile Flyout Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 start-0 w-72 bg-white p-4 shadow-xl z-50 flex flex-col overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm">Navigation Admin</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
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
                            ? "bg-[#0B69FF] text-white shadow-xs font-semibold"
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
