import { defineConfig } from "eslint/config";

import { baseConfig } from "@inochi/eslint-config/base";
import { nextjsConfig } from "@inochi/eslint-config/nextjs";
import { reactConfig } from "@inochi/eslint-config/react";

export default defineConfig(baseConfig, reactConfig, nextjsConfig);
