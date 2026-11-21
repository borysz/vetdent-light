import { createSheetRequestSchema, sheetListQuery } from "@/contracts/sheets";
import { authenticate } from "@/server/auth";
import { handler, json, readJson, readQuery } from "@/server/http";
import { createSheet, listRecentSheets } from "@/server/services/sheets";

/** Most recent sheets of the clinic. */
export const GET = handler(async (req) => {
  const ctx = await authenticate(req);
  const query = readQuery(req, sheetListQuery);
  return json(await listRecentSheets(ctx, query));
});

export const POST = handler(async (req) => {
  const ctx = await authenticate(req);
  const input = await readJson(req, createSheetRequestSchema);
  return json(await createSheet(ctx, input), 201);
});
