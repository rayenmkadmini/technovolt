import { Suspense } from "react";
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

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement des règlements...</div>}>
      <AdminPaymentsClient initialPayments={initialPayments} />
    </Suspense>
  );
}
