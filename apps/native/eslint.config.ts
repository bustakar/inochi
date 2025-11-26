import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@inochi/eslint-config/base";
import { reactConfig } from "@inochi/eslint-config/react";

export default defineConfig(
  {
    ignores: [
      "ios/**",
      "android/**",
      "node_modules/**",
      "babel.config.js",
      "metro.config.js",
    ],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // React Native uses require() for asset imports - disable for image assets
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
