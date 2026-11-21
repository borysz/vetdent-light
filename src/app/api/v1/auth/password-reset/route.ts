import { passwordResetRequestSchema } from "@/contracts/auth";
import { ApiError } from "@/server/errors";
import { assertSameOrigin, handler, readJson } from "@/server/http";
import { requestPasswordReset } from "@/server/services/password";

/** E-mail a password reset link. 202 whether or not the address has an account. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const origin = req.headers.get("origin");
  if (!origin) throw new ApiError("origin_not_allowed", "Missing Origin header");
  const body = await readJson(req, passwordResetRequestSchema);
  await requestPasswordReset(req, body.email, origin);
  return new Response(null, { status: 202 });
});
