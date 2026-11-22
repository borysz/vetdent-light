import { authenticate } from "@/server/auth";
import { handler, parseId } from "@/server/http";
import { radiographImage } from "@/server/services/radiographs";

/** The image file itself (only for members of the sheet's clinic). */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const { body, contentType } = await radiographImage(ctx, parseId(params.id));
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      // Private: the browser may keep it for a while, shared caches never.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
