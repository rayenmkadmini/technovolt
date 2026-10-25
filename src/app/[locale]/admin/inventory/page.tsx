import { setRequestLocale } from "next-intl/server";
import { AdminInventoryClient } from "./AdminInventoryClient";

const initialProducts: any[] = [];

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminInventoryClient initialProducts={initialProducts} />;
}