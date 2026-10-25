import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminCustomersClient, CustomerItem } from "./AdminCustomersClient";

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialCustomers: CustomerItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      initialCustomers = data.map((c: any) => ({
        id: c.id,
        reference_number: c.reference_number || `CL-${c.id.slice(0, 8)}`,
        full_name: c.full_name,
        phone: c.phone || "",
        email: c.email || "",
        company_name: c.company_name || "",
        tax_id: c.tax_id || "",
        notes: c.notes || "",
        total_spent: Number(c.total_spent) || 0,
        outstanding_balance: Number(c.outstanding_balance) || 0,
        is_active: c.is_active ?? true,
        created_at: c.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load customers from Supabase:", err);
  }

  return <AdminCustomersClient initialCustomers={initialCustomers} />;
}
