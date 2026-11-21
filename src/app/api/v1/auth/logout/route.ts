import { cookieClient } from "@/server/auth";
import { assertSameOrigin, handler, noContent } from "@/server/http";

export const POST = handler(async (req) => {
  assertSameOrigin(req, { allowMissing: true });
  const db = await cookieClient(req);
  await db.auth.signOut();
  return noContent();
});
