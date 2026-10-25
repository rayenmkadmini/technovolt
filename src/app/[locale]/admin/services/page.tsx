import { setRequestLocale } from "next-intl/server";
import { getServices } from "@/lib/data/services";
import { AdminServicesClient, ServiceItem } from "./AdminServicesClient";

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialServices: ServiceItem[] = [];

  try {
    const rawServices = await getServices(locale);
    if (rawServices && rawServices.length > 0) {
      initialServices = rawServices.map((srv: any) => ({
        id: srv.id,
        title: srv.title || "Prestation",
        short_description: srv.short_description || "",
        category: srv.category || "Électricité Générale",
        service_type: srv.category || "Prestation",
        price_from: srv.price_from ? Number(srv.price_from) : undefined,
        show_price: Boolean(srv.show_price),
        estimated_duration: srv.estimated_duration || "2-4 heures",
        status: (srv.status || "published") as "draft" | "published" | "archived",
        sort_order: srv.sort_order || 1,
        is_active: srv.is_active ?? true,
        created_at: srv.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.error("Failed to load services from Supabase:", err);
  }

  return <AdminServicesClient initialServices={initialServices} />;
}
