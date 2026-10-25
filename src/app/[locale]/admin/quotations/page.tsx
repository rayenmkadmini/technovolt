import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminQuotationsClient, QuotationItem } from "./AdminQuotationsClient";

export default async function AdminQuotationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialQuotations: QuotationItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("quotations")
      .select("*, customers(full_name, phone, notes)")
      .order("issue_date", { ascending: false });

    if (data && data.length > 0) {
      initialQuotations = data.map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number || `DEV-${q.id.slice(0, 8)}`,
        customer_name: q.customers?.full_name || "Client Tataouine",
        customer_phone: q.customers?.phone || "",
        customer_address: q.customers?.notes || "Tataouine",
        issue_date: q.issue_date || new Date().toISOString().slice(0, 10),
        valid_until: q.valid_until || new Date().toISOString().slice(0, 10),
        subtotal: Number(q.subtotal) || 0,
        discount_amount: Number(q.discount_amount) || 0,
        tax_amount: Number(q.tax_amount) || 0,
        total: Number(q.total) || 0,
        status: (q.status || "sent") as QuotationItem["status"],
        terms: q.terms || "",
        created_at: q.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load quotations from Supabase:", err);
  }

  return <AdminQuotationsClient locale={locale} initialQuotations={initialQuotations} />;
}
