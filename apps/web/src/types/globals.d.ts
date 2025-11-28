export {};

export type Role = "admin" | "moderator" | "user";

declare global {
  interface CustomJwtSessionClaims {
    role: Role;
  }
}
