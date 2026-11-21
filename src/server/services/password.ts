import type { EmailOtpType } from "@supabase/supabase-js";
import { cookieClient, type AuthContext } from "../auth";
import { serverEnv } from "../env";
import { ApiError } from "../errors";

/** Where the link in the e-mail points: our confirm route, on the origin the user asked from. */
export function confirmUrl(origin: string): string {
  return new URL("/auth/confirm", origin).toString();
}

/**
 * Ask Supabase Auth to e-mail a password reset link. The answer never says whether the address has an account.
 * The link either carries a `token_hash` (custom e-mail template, works on any device) or, with the default
 * template, a PKCE `code` that only the browser that asked can redeem; /auth/confirm accepts both.
 */
export async function requestPasswordReset(req: Request, email: string, origin: string): Promise<void> {
  const db = await cookieClient(req);
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: confirmUrl(origin) });
  if (!error) return;
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    throw new ApiError("rate_limited", "Too many e-mails; try again later");
  }
  console.error("password reset e-mail failed", error.code, error.message);
  throw new ApiError("internal_error", "The e-mail could not be sent");
}

/**
 * Redeem a reset link into a signed-in session (written to the session cookies). Returns false when the link
 * is invalid, expired or already used.
 */
export async function redeemResetLink(
  req: Request,
  params: { tokenHash: string | null; type: string | null; code: string | null },
): Promise<boolean> {
  const db = await cookieClient(req);
  if (params.tokenHash && params.type === "recovery") {
    const { error } = await db.auth.verifyOtp({ token_hash: params.tokenHash, type: params.type as EmailOtpType });
    return !error;
  }
  if (params.code) {
    const { error } = await db.auth.exchangeCodeForSession(params.code);
    return !error;
  }
  return false;
}

const passwordErrors: Record<string, ApiError> = {
  weak_password: new ApiError("weak_password", "The password is too weak"),
  same_password: new ApiError("same_password", "The new password must differ from the old one"),
  over_request_rate_limit: new ApiError("rate_limited", "Too many requests"),
};

/** Set a new password for the signed-in user (after a reset link, or any time while signed in). */
export async function changePassword(ctx: AuthContext, accessToken: string, password: string): Promise<void> {
  const env = serverEnv();
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return;
  const body = (await response.json().catch(() => null)) as { error_code?: string; code?: string | number } | null;
  const code = body?.error_code ?? (typeof body?.code === "string" ? body.code : undefined);
  if (code && passwordErrors[code]) throw passwordErrors[code];
  if (response.status === 401 || response.status === 403) throw new ApiError("unauthenticated", "Not signed in");
  console.error("password change failed", ctx.userId, response.status, code);
  throw new ApiError("internal_error", "The password could not be changed");
}
