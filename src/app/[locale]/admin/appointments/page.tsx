import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAppointmentsClient, AppointmentItem } from "./AdminAppointmentsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialAppointments: AppointmentItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("appointments")
      .select("*, customers(full_name, phone)")
      .order("scheduled_date", { ascending: true });

    if (data && data.length > 0) {
      initialAppointments = data.map((apt: any) => ({
        id: apt.id,
        reference_number: apt.reference_number || `RDV-${apt.id.slice(0, 8)}`,
        customer_name: apt.customers?.full_name || "Client Tataouine",
        customer_phone: apt.customers?.phone || "+216 75 000 000",
        service_title: apt.notes || "Diagnostic & Intervention",
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time ? apt.scheduled_time.slice(0, 5) : "09:30",
        estimated_duration: apt.estimated_duration || "1h30",
        address: apt.address || "Tataouine",
        technician_name: "Tarak B.",
        status: apt.status || "confirmed",
        notes: apt.notes || "",
        created_at: apt.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load appointments from Supabase:", err);
  }

  return <AdminAppointmentsClient initialAppointments={initialAppointments} />;
}
