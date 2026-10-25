import { setRequestLocale } from "next-intl/server";
import { AdminWorkOrdersClient } from "./AdminWorkOrdersClient";

export default async function AdminWorkOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminWorkOrdersClient locale={locale} />;
}
