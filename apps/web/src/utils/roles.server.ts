import { auth } from "@clerk/nextjs/server";

import { Roles } from "../types/globals";

// Server-side role checking functions
export const checkRole = async (role: Roles): Promise<boolean> => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

export const getUserRole = async (): Promise<Roles> => {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata?.role as Roles) || "user";
};

export const isAdminOrModerator = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin" || role === "moderator";
};
