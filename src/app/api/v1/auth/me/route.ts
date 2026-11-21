import type { Me } from "@/contracts/auth";
import { authenticate } from "@/server/auth";
import { handler, json } from "@/server/http";

export const GET = handler(async (req) => {
  const ctx = await authenticate(req);
  const me: Me = {
    user: { id: ctx.userId, email: ctx.email },
    member: ctx.member,
    clinic: { id: ctx.clinicId, name: ctx.clinicName },
  };
  return json(me);
});
