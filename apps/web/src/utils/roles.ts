import type { Role } from "../types/globals";

// Client-side role checking helpers
export const getClientRole = (
  sessionClaims: { role?: Role } | null | undefined,
): Role => {
  return sessionClaims?.role ?? "user";
};

export const isClientAdminOrModerator = (
  sessionClaims: { role?: Role } | null | undefined,
): boolean => {
  const role = getClientRole(sessionClaims);
  return role === "admin" || role === "moderator";
};
