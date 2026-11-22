import { z } from "zod";
import { uuid } from "./common";

/**
 * File types a radiograph may have: the clinic's X-ray software exports JPEG and PDF; PNG and WebP are allowed
 * too (e.g. a photo from a tablet). Images are shown in the app, PDFs open in the browser's PDF viewer.
 */
export const RADIOGRAPH_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type RadiographType = (typeof RADIOGRAPH_TYPES)[number];

/** File name endings the file picker offers (some systems give no type for a file, only its name). */
export const RADIOGRAPH_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"] as const;

export const isImageType = (type: RadiographType) => type.startsWith("image/");

/** At most this large one image (15 MB), and this many images on one sheet. */
export const RADIOGRAPH_MAX_BYTES = 15 * 1024 * 1024;
export const RADIOGRAPH_MAX_PER_SHEET = 30;

export const radiographSchema = z.object({
  id: uuid,
  sheetId: uuid,
  fileName: z.string(),
  contentType: z.enum(RADIOGRAPH_TYPES),
  sizeBytes: z.number().int(),
  createdAt: z.string(),
  /** The file itself: GET it with the same credentials (cookie or Bearer). */
  fileUrl: z.string(),
});
export type Radiograph = z.infer<typeof radiographSchema>;

export const radiographListSchema = z.object({ items: z.array(radiographSchema) });
export type RadiographList = z.infer<typeof radiographListSchema>;
