import type { RadiographList } from "@/contracts/radiographs";
import { authenticate } from "@/server/auth";
import { ApiError } from "@/server/errors";
import { handler, json, parseId } from "@/server/http";
import { addRadiograph, listRadiographs } from "@/server/services/radiographs";

/** The radiograph images of a sheet, oldest first. */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const items = await listRadiographs(ctx, parseId(params.id));
  return json<RadiographList>({ items });
});

/** Attach one image (multipart/form-data, field "file"). */
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const sheetId = parseId(params.id);
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
    throw new ApiError("bad_request", "Content-Type must be multipart/form-data");
  }
  const form = await req.formData().catch(() => {
    throw new ApiError("bad_request", "Malformed form data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError("validation_failed", "A file is required", { file: "required" });
  return json(await addRadiograph(ctx, sheetId, file), 201);
});
