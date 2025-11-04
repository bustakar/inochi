import { defineConfig } from "eslint/config";

import { baseConfig } from "@inochi/eslint-config/base";
import { reactConfig } from "@inochi/eslint-config/react";

export default defineConfig(baseConfig, reactConfig, {
  rules: {
    // Allow require() for React Native asset imports
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    // Disable rules that require strictNullChecks to be detected properly
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/prefer-nullish-coalescing": [
      "warn",
      {
        ignoreConditionalTests: true,
        ignorePrimitives: {
          string: true,
        },
      },
    ],
  },
});
