import { setRequestLocale } from "next-intl/server";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminReportsClient locale={locale} />;
}
