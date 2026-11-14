import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageMediaRole, MEDIA_AUTHORIZED_ROLES } from "./mediaPermissions";

export { MEDIA_AUTHORIZED_ROLES };

export interface AuthorizedAdminResult {
  authorized: boolean;
  userId?: string;
  role?: string;
  error?: string;
  status?: number;
}

/**
 * Verify that the current request has an authenticated, active Supabase user
 * with administrative or content-editor permissions.
 */
export async function requireMediaAdmin(): Promise<AuthorizedAdminResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        error: "Authentification requise.",
        status: 401,
      };
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        authorized: false,
        error: "Profil utilisateur introuvable.",
        status: 403,
      };
    }

    if (!profile.is_active) {
      return {
        authorized: false,
        error: "Compte utilisateur désactivé.",
        status: 403,
      };
    }

    if (!canManageMediaRole(profile.role, profile.is_active)) {
      return {
        authorized: false,
        error: "Accès refusé : droits administrateur ou éditeur requis.",
        status: 403,
      };
    }

    return {
      authorized: true,
      userId: user.id,
      role: profile.role,
    };
  } catch {
    return {
      authorized: false,
      error: "Erreur de vérification des autorisations.",
      status: 500,
    };
  }
}
