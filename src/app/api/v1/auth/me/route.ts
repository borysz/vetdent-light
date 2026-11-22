import { profileUpdateSchema, type Me } from "@/contracts/auth";
import { authenticate, type AuthContext } from "@/server/auth";
import { handler, json, readJson } from "@/server/http";
import { updateDisplayName } from "@/server/services/profile";

function meOf(ctx: AuthContext, displayName = ctx.member.displayName): Me {
  return {
    user: { id: ctx.userId, email: ctx.email },
    member: { displayName },
    clinic: { id: ctx.clinicId, name: ctx.clinicName },
  };
}

export const GET = handler(async (req) => {
  const ctx = await authenticate(req);
  return json(meOf(ctx));
});

/** Change the signed-in user's own profile (display name, title included). */
export const PATCH = handler(async (req) => {
  const ctx = await authenticate(req);
  const body = await readJson(req, profileUpdateSchema);
  await updateDisplayName(ctx, body.displayName);
  return json(meOf(ctx, body.displayName));
});
