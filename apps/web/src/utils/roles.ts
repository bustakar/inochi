import type { Roles } from "../types/globals";

// Client-side role checking helpers
export const getClientRole = (
  sessionClaims: { metadata?: { role?: Roles } } | null | undefined,
): Roles => {
  return sessionClaims?.metadata?.role ?? "user";
};

export const isClientAdminOrModerator = (
  sessionClaims: { metadata?: { role?: Roles } } | null | undefined,
): boolean => {
  const role = getClientRole(sessionClaims);
  return role === "admin" || role === "moderator";
};
