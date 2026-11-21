/**
 * Service-role client. ONLY for server-side scripts (user:create, seed) and tests; request handlers
 * must never import this file (they act as the user, so row level security always applies).
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "./db/database.types";

const adminEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export function createAdminClient() {
  const env = adminEnvSchema.parse(process.env);
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
