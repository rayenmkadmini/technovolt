import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPaymentsClient, PaymentItem } from "./AdminPaymentsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialPayments: PaymentItem[] = [];
  let customersList: { name: string; phone: string }[] = [];
  let invoicesList: any[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("payments")
      .select("*, customers(full_name)")
      .order("payment_date", { ascending: false });

    const { data: custData } = await supabase
      .from("customers")
      .select("full_name, phone")
      .order("full_name", { ascending: true });

    if (custData && custData.length > 0) {
      customersList = custData.map((c: any) => ({
        name: c.full_name,
        phone: c.phone || "",
      }));
    }

    const { data: invData } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, amount_paid, balance_due, status")
      .order("issue_date", { ascending: false });

    if (invData && invData.length > 0) {
      invoicesList = invData;
    }

    if (data && data.length > 0) {
      initialPayments = data.map((pay: any) => ({
        id: pay.id,
        payment_reference: pay.payment_reference || `REG-${pay.id.slice(0, 8)}`,
        customer_name: pay.customers?.full_name || "Client",
        invoice_number: pay.notes?.startsWith("Facture ") ? pay.notes.replace("Facture ", "") : "",
        amount: Number(pay.amount) || 0,
        currency: pay.currency || "TND",
        payment_date: pay.payment_date || new Date().toISOString().slice(0, 10),
        payment_method: pay.payment_method === "bank_transfer" ? "Virement" : pay.payment_method === "check" ? "Chèque" : "Espèces",
        receipt_reference: pay.receipt_reference || "",
        notes: pay.notes || "",
        created_at: pay.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load payments from Supabase:", err);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement des règlements...</div>}>
      <AdminPaymentsClient
        initialPayments={initialPayments}
        customersList={customersList}
        invoicesList={invoicesList}
      />
    </Suspense>
  );
}
