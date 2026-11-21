import { loginRequestSchema, type LoginResponse } from "@/contracts/auth";
import { cookieClient, loadMembership } from "@/server/auth";
import { ApiError } from "@/server/errors";
import { assertSameOrigin, handler, json, readJson } from "@/server/http";

export const POST = handler(async (req) => {
  assertSameOrigin(req, { allowMissing: true });
  const body = await readJson(req, loginRequestSchema);

  const db = await cookieClient(req);
  const { data, error } = await db.auth.signInWithPassword({ email: body.email, password: body.password });
  if (error || !data.session) throw new ApiError("invalid_credentials", "Invalid e-mail or password");

  let membership;
  try {
    membership = await loadMembership(db, data.user.id);
  } catch (e) {
    await db.auth.signOut();
    throw e;
  }

  const response: LoginResponse = {
    user: { id: data.user.id, email: data.user.email ?? null },
    member: membership.member,
    clinic: { id: membership.clinicId, name: membership.clinicName },
    ...(body.returnTokens
      ? {
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at ?? null,
          },
        }
      : {}),
  };
  return json(response);
});
