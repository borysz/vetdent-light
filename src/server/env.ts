import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.url().optional(),
  /** Real Chrome used for the server-side PDF. */
  CHROME_PATH: z.string().min(1).optional(),
  /** Address by which Chrome reaches this very server to open the print page. */
  INTERNAL_BASE_URL: z.url().default("http://127.0.0.1:6438"),
});

let cached: z.output<typeof envSchema> | undefined;

/** Server-side configuration for request handling. The secret key is deliberately not part of it. */
export function serverEnv() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
