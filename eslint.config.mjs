import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "contracts/**",
      "storage/**",
      ".tmp/**",
      "tmp/**",
      "temp/**",
      ".cache/**",
      ".nyc_output/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}", ".sequelizerc"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      // This rollout preserves existing contracts; no blanket migration of any.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // Keep required callback/contract parameters explicitly marked unused.
          argsIgnorePattern: "^_",
          // Rest projections intentionally exclude internal/sensitive fields.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: [".sequelizerc", "**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
  },
  prettier,
);
