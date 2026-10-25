import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RevenueExpenseChart } from "@/components/admin/charts/RevenueExpenseChart";
import {
  Inbox,
  Users,
  Calendar,
  Wrench,
  FileText,
  CreditCard,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Phone,
  Plus,
} from "lucide-react";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load live data from Supabase
  let invoices: any[] = [];
  let payments: any[] = [];
  let expenses: any[] = [];
  let leads: any[] = [];
  let appointments: any[] = [];
  let workOrders: any[] = [];
  let customers: any[] = [];

  try {
    const supabase = createAdminClient();
    const [invRes, payRes, expRes, leadRes, aptRes, woRes, custRes] = await Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("appointments").select("*, customers(full_name, phone)").order("scheduled_date", { ascending: true }).limit(5),
      supabase.from("work_orders").select("*"),
      supabase.from("customers").select("*"),
    ]);

    invoices = invRes.data || [];
    payments = payRes.data || [];
    expenses = expRes.data || [];
    leads = leadRes.data || [];
    appointments = aptRes.data || [];
    workOrders = woRes.data || [];
    customers = custRes.data || [];
  } catch (err) {
    console.error("Failed to load dashboard data from Supabase:", err);
  }

  // Financial calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCollected = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const totalReceivables = invoices.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const estimatedProfit = totalCollected - totalExpenses;

  // Operational metrics
  const newLeads = leads.filter((l) => l.status === "new");
  const upcomingApts = appointments.filter((a) => a.status === "confirmed");
  const activeJobs = workOrders.filter((w) => w.status === "in_progress");
  const unpaidInvoices = invoices.filter((i) => (Number(i.balance_due) || 0) > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tableau de Bord Commercial & Opérationnel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            TECHNOVOLT &bull; Siège Tataouine &bull; Données en direct
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/quotations/new">
            <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nouveau Devis</span>
            </Button>
          </Link>
          <Link href="/admin/invoices/new">
            <Button variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Créer Facture</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Indicateurs Financiers (TND)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Invoiced Revenue */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">
                Chiffre d'Affaires Facturé
              </CardTitle>
              <FileText className="h-4 w-4 text-[#0B69FF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(totalInvoiced, locale)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total factures émises
              </p>
            </CardContent>
          </Card>

          {/* Cash Actually Collected */}
          <Card className="border-emerald-200 bg-emerald-50/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-emerald-800">
                Encaissé Réellement
              </CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrency(totalCollected, locale)}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">
                Règlements reçus (Espèces/Banque)
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Receivables */}
          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-amber-800">
                Créances Clients à Recouvrer
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-700">
                {formatCurrency(totalReceivables, locale)}
              </div>
              <p className="text-[11px] text-amber-600 mt-1">
                {unpaidInvoices.length} facture(s) en attente de solde
              </p>
            </CardContent>
          </Card>

          {/* Recorded Expenses */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">
                Dépenses & Achats
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(totalExpenses, locale)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Marge estimée : {formatCurrency(estimatedProfit, locale)}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Opérations & Terrain
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/admin/leads" className="block">
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0B69FF] hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Nouvelles Demandes</span>
                <Inbox className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {newLeads.length}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">À traiter d'urgence</span>
            </div>
          </Link>

          <Link href="/admin/appointments" className="block">
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0B69FF] hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Rendez-vous à venir</span>
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {upcomingApts.length}
              </div>
              <span className="text-[11px] text-slate-500">Cette semaine</span>
            </div>
          </Link>

          <Link href="/admin/work-orders" className="block">
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0B69FF] hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Chantiers en Cours</span>
                <Wrench className="h-4 w-4 text-[#F5A623]" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {activeJobs.length}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">En intervention</span>
            </div>
          </Link>

          <Link href="/admin/customers" className="block">
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0B69FF] hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Clients Référencés</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {customers.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Actifs</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Visual Analytics Chart: Revenue vs. Expenses */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Évolution du Chiffre d'Affaires vs Dépenses Mensuelles (TND)
            </h2>
            <p className="text-xs text-slate-500">
              Comparatif d'exploitation par période pour l'exercice en cours
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Exercice 2026
            </span>
          </div>
        </div>
        <RevenueExpenseChart />
      </div>

      {/* Two Column Layout: Latest Leads & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Leads / Demandes */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Dernières Demandes Web & Devis
              </h3>
              <p className="text-xs text-slate-500">
                Inquiétudes ou projets transmis par le formulaire
              </p>
            </div>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>Voir tout</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune demande enregistrée.</p>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {lead.full_name}
                      </span>
                      <Badge
                        variant={lead.status === "new" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {lead.status === "new" ? "Nouveau" : "Contacté"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{lead.phone}</span>
                      </span>
                      <span>&bullet;</span>
                      <span>{lead.address || "Tataouine"}</span>
                    </div>
                    {lead.message && (
                      <p className="text-xs text-slate-600 line-clamp-1 italic">
                        "{lead.message}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-end">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {formatDate(lead.created_at, locale)}
                    </span>
                    <Link href={`/admin/quotations/new?leadId=${lead.id}`}>
                      <Button variant="default" size="sm" className="text-xs h-7 px-2">
                        Créer Devis
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Prochains Rendez-vous
              </h3>
              <p className="text-xs text-slate-500">
                Interventions programmées à Tataouine
              </p>
            </div>
            <Link href="/admin/appointments">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>Planning</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucun rendez-vous planifié.</p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B69FF] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#F5A623]" />
                      <span>{apt.scheduled_date} à {apt.scheduled_time || "09:00"}</span>
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      Confirmé
                    </Badge>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {apt.customers?.full_name || apt.reference_number}
                    </div>
                    <div className="text-xs text-slate-600">
                      {apt.notes || "Intervention technique à domicile"}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60">
                    <span>{apt.address || "Tataouine"}</span>
                    <span className="font-medium text-slate-700">Équipe Technique Tataouine</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
