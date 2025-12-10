import { auth } from "@clerk/nextjs/server";

import type { Role } from "../types/globals";

// Server-side role checking functions
export const checkRole = async (role: Role): Promise<boolean> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return false;
  const userRole = sessionClaims.role;
  return userRole === role;
};

export const getUserRole = async (): Promise<Role> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return "user";
  return (sessionClaims.role as Role | undefined) ?? "user";
};

export const isAdminOrModerator = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin" || role === "moderator";
};
