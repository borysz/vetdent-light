import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import { serverEnv } from "./env";
import { ApiError, fromDb } from "./errors";
import { assertSameOrigin, isHttps } from "./http";

export type Db = SupabaseClient<Database>;

export type AuthContext = {
  /** Supabase client acting as the signed-in user: row level security always applies. */
  db: Db;
  userId: string;
  email: string | null;
  clinicId: string;
  clinicName: string;
  member: { displayName: string; title: string | null };
};

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

function bearerClient(token: string): Db {
  const env = serverEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Client bound to the httpOnly session cookies of the browser. */
export async function cookieClient(req: Request): Promise<Db> {
  const store = await cookies();
  const env = serverEnv();
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: isHttps(req) });
          }
        } catch {
          // Cookies cannot be written in some render contexts; the proxy refreshes the session instead.
        }
      },
    },
  }) as unknown as Db;
}

export async function loadMembership(db: Db, userId: string) {
  const { data, error } = await db
    .from("clinic_members")
    .select("clinic_id, display_name, title, clinics(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_a_member", "The user is not a member of any clinic");
  return {
    clinicId: data.clinic_id,
    clinicName: data.clinics?.name ?? "",
    member: { displayName: data.display_name, title: data.title },
  };
}

/**
 * Authenticate a request: `Authorization: Bearer <access token>` or the httpOnly session cookie.
 * The token is verified (JWKS) by Supabase Auth; the user must belong to a clinic.
 * Cookie sessions get the CSRF origin check on state-changing methods.
 */
export async function authenticate(req: Request): Promise<AuthContext> {
  const token = bearerToken(req);
  let db: Db;
  let claims: { sub?: string; email?: string } | null | undefined;

  if (token) {
    db = bearerClient(token);
    const { data, error } = await db.auth.getClaims(token);
    if (error) throw new ApiError("unauthenticated", "Invalid or expired token");
    claims = data?.claims;
  } else {
    assertSameOrigin(req);
    db = await cookieClient(req);
    const { data, error } = await db.auth.getClaims();
    if (error) throw new ApiError("unauthenticated", "Not signed in");
    claims = data?.claims;
  }

  if (!claims?.sub) throw new ApiError("unauthenticated", "Not signed in");
  const membership = await loadMembership(db, claims.sub);
  return { db, userId: claims.sub, email: claims.email ?? null, ...membership };
}
