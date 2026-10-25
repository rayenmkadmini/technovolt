import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminInvoicesClient, InvoiceItem } from "./AdminInvoicesClient";

export default async function AdminInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialInvoices: InvoiceItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("invoices")
      .select("*, customers(full_name, phone, notes)")
      .order("issue_date", { ascending: false });

    if (data && data.length > 0) {
      initialInvoices = data.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number || `FAC-${inv.id.slice(0, 8)}`,
        customer_name: inv.customers?.full_name || "Client Tataouine",
        customer_phone: inv.customers?.phone || "",
        customer_address: inv.customers?.notes || "Tataouine",
        issue_date: inv.issue_date || new Date().toISOString().slice(0, 10),
        due_date: inv.due_date || new Date().toISOString().slice(0, 10),
        subtotal: Number(inv.subtotal) || 0,
        tax_rate: Number(inv.tax_rate) || 19,
        tax_amount: Number(inv.tax_amount) || 0,
        total: Number(inv.total) || 0,
        amount_paid: Number(inv.amount_paid) || 0,
        balance_due: Number(inv.balance_due) || 0,
        status: (inv.status || "paid") as InvoiceItem["status"],
        payment_terms: inv.payment_terms || "",
        created_at: inv.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load invoices from Supabase:", err);
  }

  return <AdminInvoicesClient locale={locale} initialInvoices={initialInvoices} />;
}
