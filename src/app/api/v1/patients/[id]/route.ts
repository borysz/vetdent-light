import { patientPatchSchema } from "@/contracts/patients";
import { authenticate } from "@/server/auth";
import { handler, json, parseId, readJson } from "@/server/http";
import { getPatient, updatePatient } from "@/server/services/patients";

export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  return json(await getPatient(ctx, parseId(params.id)));
});

export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const patch = await readJson(req, patientPatchSchema);
  return json(await updatePatient(ctx, parseId(params.id), patch));
});
