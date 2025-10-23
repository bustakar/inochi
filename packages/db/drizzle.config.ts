import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

// In CI/production: use the pooler URL (port 6543) for IPv4 compatibility
// In local dev: convert to direct connection (port 5432) for full features
const connectionUrl =
  process.env.CI || process.env.VERCEL
    ? process.env.POSTGRES_URL // Keep pooler in CI/Vercel
    : process.env.POSTGRES_URL.includes(":6543")
      ? process.env.POSTGRES_URL.replace(":6543", ":5432")
      : process.env.POSTGRES_URL; // Use as-is if already 5432 (local)

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: connectionUrl },
  casing: "snake_case",
  out: "./src/migrations",
} satisfies Config;
