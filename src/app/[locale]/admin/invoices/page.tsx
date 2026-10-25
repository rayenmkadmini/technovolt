import { setRequestLocale } from "next-intl/server";
import { AdminInvoicesClient } from "./AdminInvoicesClient";

export default async function AdminInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminInvoicesClient locale={locale} />;
}
