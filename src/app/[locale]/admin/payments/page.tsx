import { setRequestLocale } from "next-intl/server";
import { AdminPaymentsClient } from "./AdminPaymentsClient";

const initialPayments: any[] = [];

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminPaymentsClient initialPayments={initialPayments} />;
}