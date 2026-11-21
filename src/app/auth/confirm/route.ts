import { redeemResetLink } from "@/server/services/password";

/**
 * Target of the password reset e-mail link. Turns the link into a session cookie and sends the user to set a new
 * password; an invalid or expired link goes back to the request form with a notice.
 * The redirect is relative: behind a proxy (or bound to 0.0.0.0) the request URL's host is not the public one.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const ok = await redeemResetLink(req, {
    tokenHash: params.get("token_hash"),
    type: params.get("type"),
    code: params.get("code"),
  }).catch(() => false);
  const target = ok ? "/reset-password" : "/forgot-password?error=link";
  return new Response(null, { status: 303, headers: { location: target, "cache-control": "no-store" } });
}
