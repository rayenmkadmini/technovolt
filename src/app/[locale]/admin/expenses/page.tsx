import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminExpensesClient, ExpenseItem } from "./AdminExpensesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialExpenses: ExpenseItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("expenses")
      .select("*, suppliers(name)")
      .order("expense_date", { ascending: false });

    if (data && data.length > 0) {
      initialExpenses = data.map((exp: any) => ({
        id: exp.id,
        reference: exp.reference || `DEP-${exp.id.slice(0, 8)}`,
        expense_date: exp.expense_date || new Date().toISOString().slice(0, 10),
        category_name: exp.notes?.startsWith("Catégorie: ") ? exp.notes.replace("Catégorie: ", "") : "Fournitures & Chantier",
        supplier_name: exp.suppliers?.name || "Fournisseur",
        description: exp.description || "",
        amount: Number(exp.amount) || 0,
        currency: exp.currency || "TND",
        tax_amount: Number(exp.tax_amount) || 0,
        payment_method: exp.payment_method === "bank_transfer" ? "Virement" : "Espèces",
        payment_status: (exp.payment_status || "paid") as "paid" | "pending",
        notes: exp.notes || "",
        created_at: exp.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load expenses from Supabase:", err);
  }

  return <AdminExpensesClient initialExpenses={initialExpenses} />;
}
