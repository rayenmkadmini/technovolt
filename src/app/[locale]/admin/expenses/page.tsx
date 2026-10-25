import { setRequestLocale } from "next-intl/server";
import { AdminExpensesClient } from "./AdminExpensesClient";

const initialExpenses: any[] = [];

export default async function AdminExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminExpensesClient initialExpenses={initialExpenses} />;
}