import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminWorkOrdersClient, WorkOrderItem } from "./AdminWorkOrdersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWorkOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialWorkOrders: WorkOrderItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("work_orders")
      .select("*, customers(full_name, phone)")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      initialWorkOrders = data.map((wo: any) => ({
        id: wo.id,
        job_number: wo.job_number || `OT-${wo.id.slice(0, 8)}`,
        customer_name: wo.customers?.full_name || "Client Tataouine",
        customer_phone: wo.customers?.phone || "+216 75 000 000",
        service_title: wo.notes?.startsWith("Service: ") ? wo.notes.replace("Service: ", "") : "Électricité générale",
        description: wo.description || "",
        status: wo.status || "in_progress",
        start_date: wo.start_date || new Date().toISOString().slice(0, 10),
        completion_date: wo.completion_date || undefined,
        labor_hours: Number(wo.labor_hours) || 0,
        total_cost: Number(wo.total_cost) || 0,
        notes: wo.notes || "",
        technician_name: "Tarak B.",
        created_at: wo.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load work orders from Supabase:", err);
  }

  return <AdminWorkOrdersClient locale={locale} initialWorkOrders={initialWorkOrders} />;
}
