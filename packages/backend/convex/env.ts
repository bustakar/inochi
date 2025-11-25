import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    OPENROUTER_API_KEY: z.string().optional(),
    CLERK_ISSUER_URL: z.string().url().optional(),
    CONVEX_CLOUD_URL: z.string().url().optional(),
  },
  /**
   * You can't destruct `process.env` as a regular object in Convex, so we need to destruct manually.
   */
  runtimeEnv: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    CLERK_ISSUER_URL: process.env.CLERK_ISSUER_URL,
    CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
