import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@inochi/eslint-config/base";

export default defineConfig(baseConfig, restrictEnvAccess);
