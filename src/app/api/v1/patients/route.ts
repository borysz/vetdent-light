import { patientInputSchema, patientListQuery } from "@/contracts/patients";
import { authenticate } from "@/server/auth";
import { handler, json, readJson, readQuery } from "@/server/http";
import { createPatient, listPatients } from "@/server/services/patients";

export const GET = handler(async (req) => {
  const ctx = await authenticate(req);
  const query = readQuery(req, patientListQuery);
  return json(await listPatients(ctx, query));
});

export const POST = handler(async (req) => {
  const ctx = await authenticate(req);
  const input = await readJson(req, patientInputSchema);
  return json(await createPatient(ctx, input), 201);
});
