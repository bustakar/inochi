import { defineConfig } from "eslint/config";

import { baseConfig } from "@inochi/eslint-config/base";
import { reactConfig } from "@inochi/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
