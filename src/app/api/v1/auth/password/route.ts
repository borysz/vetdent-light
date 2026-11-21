import { passwordChangeSchema } from "@/contracts/auth";
import { accessTokenOf, authenticate } from "@/server/auth";
import { handler, noContent, readJson } from "@/server/http";
import { changePassword } from "@/server/services/password";

/** Set a new password for the signed-in user. */
export const PUT = handler(async (req) => {
  const ctx = await authenticate(req);
  const body = await readJson(req, passwordChangeSchema);
  await changePassword(ctx, await accessTokenOf(req, ctx), body.password);
  return noContent();
});
