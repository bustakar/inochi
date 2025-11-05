import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@inochi/eslint-config/base";
import { nextjsConfig } from "@inochi/eslint-config/nextjs";
import { reactConfig } from "@inochi/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
