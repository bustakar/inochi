import { Auth } from "convex/server";

export const getUserId = async (ctx: { auth: Auth }) => {
  return (await ctx.auth.getUserIdentity())?.subject;
};

export const getUserRole = async (ctx: {
  auth: Auth;
}): Promise<"admin" | "moderator" | "user"> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return "user";
  const role = identity.role;
  if (role === "admin" || role === "moderator") return role;
  return "user";
};

export const isAdminOrModerator = async (ctx: {
  auth: Auth;
}): Promise<boolean> => {
  const role = await getUserRole(ctx);
  return role === "admin" || role === "moderator";
};
