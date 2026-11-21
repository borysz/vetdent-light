import { clinicUpdateSchema } from "@/contracts/clinic";
import { authenticate } from "@/server/auth";
import { handler, json, readJson } from "@/server/http";
import { getClinic, updateClinic } from "@/server/services/clinic";

export const GET = handler(async (req) => {
  const ctx = await authenticate(req);
  return json(await getClinic(ctx));
});

export const PUT = handler(async (req) => {
  const ctx = await authenticate(req);
  const input = await readJson(req, clinicUpdateSchema);
  return json(await updateClinic(ctx, input));
});
