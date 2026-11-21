import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Layer boundary (docs/DONTESEK.md): UI code never touches the server layer or Supabase.
  {
    files: ["src/app/(app)/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/client/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/server/*", "@/server"], message: "UI code must go through the API (src/client), not src/server." },
            { group: ["@supabase/*"], message: "UI code must not use Supabase directly; use the /api/v1 API." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool-generated folders (Impeccable, Codex) are not project source.
    ".agents/**",
    ".codex/**",
    ".claude/**",
    ".impeccable/**",
  ]),
]);

export default eslintConfig;
