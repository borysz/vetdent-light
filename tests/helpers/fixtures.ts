import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/server/admin";
import type { Database } from "@/server/db/database.types";

/** Marker for every row created by tests; also the e-mail domain required by the project rules. */
export const TEST_DOMAIN = "vetdent-light.test";

export type TestUser = { id: string; email: string; token: string; clinicId: string | null };

let adminClient: ReturnType<typeof createAdminClient> | undefined;
const getAdmin = () => (adminClient ??= createAdminClient());
const createdUsers: string[] = [];
const createdClinics: string[] = [];

export const runId = randomBytes(4).toString("hex");

function publishableClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A confirmed test user (random password, never printed) with a fresh clinic, or without any when `clinic` is false. */
export async function createTestUser(label: string, opts: { clinic?: boolean } = {}): Promise<TestUser> {
  const email = `itest-${runId}-${label}@${TEST_DOMAIN}`;
  const password = randomBytes(24).toString("base64url");

  const created = await getAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error("createUser failed");
  const id = created.data.user.id;
  createdUsers.push(id);

  let clinicId: string | null = null;
  if (opts.clinic !== false) {
    const clinic = await getAdmin().from("clinics").insert({ name: `itest ${runId} ${label}` }).select("id").single();
    if (clinic.error) throw clinic.error;
    clinicId = clinic.data.id;
    createdClinics.push(clinicId);
    const member = await getAdmin()
      .from("clinic_members")
      .insert({ clinic_id: clinicId, user_id: id, display_name: `Dr. Test ${label}` });
    if (member.error) throw member.error;
  }

  const signedIn = await publishableClient().auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw signedIn.error ?? new Error("sign-in failed");
  return { id, email, token: signedIn.data.session.access_token, clinicId };
}

/** Whether the e-mail and password sign in. */
export async function signIn(email: string, password: string): Promise<boolean> {
  const { data, error } = await publishableClient().auth.signInWithPassword({ email, password });
  return !error && Boolean(data.session);
}

/** A Supabase client acting as the given user (RLS applies). */
export function clientFor(user: TestUser) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${user.token}` } },
  });
}

/** Delete everything the tests created: clinics (cascading to patients, sheets and images), then users. */
export async function cleanup() {
  for (const id of createdClinics) await getAdmin().from("clinics").delete().eq("id", id);
  for (const id of createdUsers) await getAdmin().auth.admin.deleteUser(id);
  createdClinics.length = 0;
  createdUsers.length = 0;
}

type Handler = (req: Request, ctx: { params: Promise<never> }) => Promise<Response>;

/** Call a route handler directly with a Request, the way Next would. */
export async function call(
  handlerFn: unknown,
  path: string,
  opts: {
    token?: string;
    method?: string;
    body?: unknown;
    rawBody?: string;
    /** A multipart/form-data body (file uploads); the boundary header is set by Request. */
    form?: FormData;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper: bodies are asserted field by field
): Promise<{ status: number; body: any; contentType: string | null; bytes: Uint8Array }> {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const hasJsonBody = opts.body !== undefined || opts.rawBody !== undefined;
  if (hasJsonBody && !headers["content-type"]) headers["content-type"] = "application/json";
  const request = new Request(`http://localhost${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.form ?? opts.rawBody ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const response = await (handlerFn as Handler)(request, { params: Promise.resolve((opts.params ?? {}) as never) });
  const contentType = response.headers.get("content-type");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const isJson = contentType?.includes("application/json") ?? false;
  const text = isJson ? new TextDecoder().decode(bytes) : "";
  return { status: response.status, body: text ? JSON.parse(text) : null, contentType, bytes };
}
