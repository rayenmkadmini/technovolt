import { setRequestLocale } from "next-intl/server";
import { AdminCustomersClient } from "./AdminCustomersClient";

const initialCustomers: any[] = [];

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCustomersClient initialCustomers={initialCustomers} />;
}