import { updateSheetRequestSchema } from "@/contracts/sheets";
import { authenticate } from "@/server/auth";
import { handler, json, parseId, readJson } from "@/server/http";
import { getSheet, updateSheet } from "@/server/services/sheets";

export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  return json(await getSheet(ctx, parseId(params.id)));
});

/** Save; a stale `version` answers 409 version_conflict. */
export const PUT = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const input = await readJson(req, updateSheetRequestSchema);
  return json(await updateSheet(ctx, parseId(params.id), input));
});
