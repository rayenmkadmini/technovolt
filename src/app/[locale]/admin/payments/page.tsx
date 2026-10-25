import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPaymentsClient, PaymentItem } from "./AdminPaymentsClient";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialPayments: PaymentItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("payments")
      .select("*, customers(full_name)")
      .order("payment_date", { ascending: false });

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
      <AdminPaymentsClient initialPayments={initialPayments} />
    </Suspense>
  );
}
