import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.url().optional(),
  /** Chrome for the server-side PDF; when empty, the one `npm run chrome:install` put into .chrome/ is used. */
  CHROME_PATH: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  /** Extra Chrome flags, space separated (e.g. "--no-sandbox --disable-dev-shm-usage" in a container). */
  CHROME_ARGS: z.string().optional(),
  /** Address by which Chrome reaches this very server to open the print page. */
  INTERNAL_BASE_URL: z.url().default("http://127.0.0.1:6438"),
});

let cached: z.output<typeof envSchema> | undefined;

/** Server-side configuration for request handling. The secret key is deliberately not part of it. */
export function serverEnv() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
