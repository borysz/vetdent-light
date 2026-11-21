import { sheetListQuery } from "@/contracts/sheets";
import { authenticate } from "@/server/auth";
import { handler, json, parseId, readQuery } from "@/server/http";
import { getPatient } from "@/server/services/patients";
import { listPatientSheets } from "@/server/services/sheets";

/** The patient's sheets, newest treatment first. */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const id = parseId(params.id);
  await getPatient(ctx, id);
  const query = readQuery(req, sheetListQuery);
  return json(await listPatientSheets(ctx, id, query));
});
