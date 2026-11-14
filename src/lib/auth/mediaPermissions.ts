export const MEDIA_AUTHORIZED_ROLES = [
  "super_admin",
  "owner",
  "admin",
  "manager",
  "content_editor",
] as const;

export type MediaAuthorizedRole = (typeof MEDIA_AUTHORIZED_ROLES)[number];

/**
 * Pure server/test-safe check verifying whether a user profile has active media admin permissions.
 */
export function canManageMediaRole(
  role?: string | null,
  isActive?: boolean | null
): boolean {
  if (!role || isActive === false) return false;
  return (MEDIA_AUTHORIZED_ROLES as readonly string[]).includes(role);
}
