import type { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

// Server-side role checking functions
export const checkRole = async (role: Roles): Promise<boolean> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    return false;
  }
  return sessionClaims.metadata.role === role;
};

export const getUserRole = async (): Promise<Roles> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    return "user";
  }
  const role = sessionClaims.metadata.role;
  return role ?? "user";
};

export const isAdminOrModerator = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin" || role === "moderator";
};
