import { setRequestLocale } from "next-intl/server";
import { AdminQuotationsClient } from "./AdminQuotationsClient";

export default async function AdminQuotationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminQuotationsClient locale={locale} />;
}
