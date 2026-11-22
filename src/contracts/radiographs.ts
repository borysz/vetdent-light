import { z } from "zod";
import { uuid } from "./common";

/** Image types a radiograph may have (what browsers can show; dental sensor software exports these). */
export const RADIOGRAPH_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type RadiographType = (typeof RADIOGRAPH_TYPES)[number];

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
  /** The image itself: GET it with the same credentials (cookie or Bearer). */
  imageUrl: z.string(),
});
export type Radiograph = z.infer<typeof radiographSchema>;

export const radiographListSchema = z.object({ items: z.array(radiographSchema) });
export type RadiographList = z.infer<typeof radiographListSchema>;
