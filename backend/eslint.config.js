import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,js}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: { globals: globals.node },
  },
]);
