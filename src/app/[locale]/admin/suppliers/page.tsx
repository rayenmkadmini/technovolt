import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSuppliersClient, SupplierItem } from "./AdminSuppliersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialSuppliers: SupplierItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (data && data.length > 0) {
      initialSuppliers = data.map((sup: any) => ({
        id: sup.id,
        name: sup.name,
        contact_person: sup.contact_person || "",
        phone: sup.phone || "",
        email: sup.email || "",
        address: sup.address || "",
        notes: sup.notes || "",
        outstanding_amount: Number(sup.outstanding_amount) || 0,
        is_active: sup.is_active ?? true,
      }));
    }
  } catch (err) {
    console.error("Failed to load suppliers from Supabase:", err);
  }

  return <AdminSuppliersClient initialSuppliers={initialSuppliers} />;
}
