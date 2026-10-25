import { setRequestLocale } from "next-intl/server";
import { AdminServicesClient } from "./AdminServicesClient";

const initialServices: any[] = [];

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminServicesClient initialServices={initialServices} />;
}