import { env } from "./env";

export default {
  providers: [
    {
      domain: env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
