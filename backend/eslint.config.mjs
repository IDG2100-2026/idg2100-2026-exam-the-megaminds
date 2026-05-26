//same eslint config as used in-class code from : idg-2100-backend.lt
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node },
    rules: {
      "semi": "warn",
      "comma-dangle": "warn",
      "no-unused-vars": "warn"
    }
  }
]);
