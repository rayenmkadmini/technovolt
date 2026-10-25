import { setRequestLocale } from "next-intl/server";
import { AdminAppointmentsClient } from "./AdminAppointmentsClient";

const initialAppointments: any[] = [];

export default async function AdminAppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminAppointmentsClient initialAppointments={initialAppointments} />;
}