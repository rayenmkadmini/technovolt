import { setRequestLocale } from "next-intl/server";
import { AdminUsersClient } from "./AdminUsersClient";

const initialUsers = [
  {
    id: "usr-00",
    fullName: "Rayen Mkadmini (Super Admin)",
    email: "rayen25360@gmail.com",
    role: "super_admin",
    roleLabel: "Super Admin",
    status: "active",
    lastLogin: "Session active (Connecté)",
    permissions: "Accès Total Illimité (Super Administrateur, Rôles, Supabase, RLS, Finances, CMS)",
  },
  {
    id: "usr-04",
    fullName: "Client Tataouine (Portail Client)",
    email: "client.tataouine@technovolt.tn",
    role: "client",
    roleLabel: "Client",
    status: "active",
    lastLogin: "Aujourd'hui à 11:20",
    permissions: "Consultation devis & factures personnelles, demande d'intervention",
  },
];

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminUsersClient initialUsers={initialUsers as any} />;
}