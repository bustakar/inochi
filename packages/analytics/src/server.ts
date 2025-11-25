import { PostHog } from "posthog-node";

import "server-only";

import { env } from "./env";

// PostHog requires a non-empty key, so we provide a fallback
// The key is validated at runtime by PostHog itself
export const analytics = new PostHog(
  env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_placeholder",
  {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,

    // Don't batch events and flush immediately - we're running in a serverless environment
    flushAt: 1,
    flushInterval: 0,
  },
);
