#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

// Get environment variables
const isProduction = process.env.NODE_ENV === "production";
const isMainBranch = process.env.VERCEL_GIT_COMMIT_REF === "main";
const isVercel = process.env.VERCEL === "1";

console.log("Build script starting...");
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
  VERCEL: process.env.VERCEL,
  isProduction,
  isMainBranch,
  isVercel,
});

// Check if we should run migrations
const shouldRunMigrations = isVercel && isMainBranch && isProduction;

if (shouldRunMigrations) {
  console.log("🚀 Running database migrations before build...");
  try {
    // Run migrations
    execSync("pnpm db:migrate", {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error.message);
    process.exit(1);
  }
} else {
  console.log("⏭️  Skipping database migrations");
  console.log("   Reasons:", {
    notVercel: !isVercel,
    notMainBranch: !isMainBranch,
    notProduction: !isProduction,
  });
}

// Always run the build
console.log("🔨 Building project...");
try {
  execSync("pnpm build", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  console.log("✅ Build completed successfully");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
