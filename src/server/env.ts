import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.url().optional(),
});

let cached: z.output<typeof envSchema> | undefined;

/** Server-side configuration for request handling. The secret key is deliberately not part of it. */
export function serverEnv() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
