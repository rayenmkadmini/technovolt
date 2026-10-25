import { setRequestLocale } from "next-intl/server";
import { AdminSuppliersClient } from "./AdminSuppliersClient";

const initialSuppliers: any[] = [];

export default async function AdminSuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminSuppliersClient initialSuppliers={initialSuppliers} />;
}