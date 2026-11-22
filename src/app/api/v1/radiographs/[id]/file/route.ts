import { authenticate } from "@/server/auth";
import { handler, parseId } from "@/server/http";
import { radiographFile } from "@/server/services/radiographs";

/** The radiograph file itself, image or PDF, shown inline (only for members of the sheet's clinic). */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const { body, contentType, fileName } = await radiographFile(ctx, parseId(params.id));
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      // The original name, encoded (RFC 6266), so a saved PDF keeps it.
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      // Private: the browser may keep it for a while, shared caches never.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
