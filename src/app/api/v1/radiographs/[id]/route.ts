import { authenticate } from "@/server/auth";
import { handler, noContent, parseId } from "@/server/http";
import { deleteRadiograph } from "@/server/services/radiographs";

/** Delete a radiograph image. */
export const DELETE = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  await deleteRadiograph(ctx, parseId(params.id));
  return noContent();
});
