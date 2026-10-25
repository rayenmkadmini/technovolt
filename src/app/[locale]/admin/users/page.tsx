import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersClient, UserItem } from "./AdminUsersClient";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialUsers: UserItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (profiles && profiles.length > 0) {
      initialUsers = profiles.map((p: any) => ({
        id: p.id,
        fullName: p.full_name || "Utilisateur TECHNOVOLT",
        email: p.full_name.includes("Rayen") ? "rayen25360@gmail.com" : `${p.role}@technovolt.tn`,
        role: p.role || "admin",
        roleLabel: p.role === "super_admin" ? "Super Admin" : p.role === "client" ? "Client (Portail)" : "Administrateur",
        status: p.is_active ? "active" : "inactive",
        lastLogin: "Session active (Supabase)",
        permissions: p.role === "super_admin"
          ? "Accès Total Illimité (Super Administrateur, Rôles, Supabase, RLS, Finances, CMS)"
          : "Gestion des opérations, clients, stocks et finances",
      }));
    }
  } catch (err) {
    console.error("Failed to load users from Supabase:", err);
  }

  return <AdminUsersClient initialUsers={initialUsers} />;
}
