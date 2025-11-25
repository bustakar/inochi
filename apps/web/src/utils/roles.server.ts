import { auth } from "@clerk/nextjs/server";

import type { Roles } from "../types/globals";

// Server-side role checking functions
export const checkRole = async (role: Roles): Promise<boolean> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return false;
  const metadata = sessionClaims.metadata;
  return (metadata.role ?? null) === role;
};

export const getUserRole = async (): Promise<Roles> => {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return "user";
  const metadata = sessionClaims.metadata;
  return metadata.role ?? "user";
};

export const isAdminOrModerator = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin" || role === "moderator";
};
