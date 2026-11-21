import { z } from "zod";
import { teethOf } from "@/domain/teeth/catalog";
import { COMPLAINTS, FINDINGS, TREATMENTS } from "@/domain/teeth/codes";
import { sexValues, speciesValues } from "./patients";

/**
 * Reference data served by GET /reference-data. Only codes: their Hungarian (or other) names are
 * UI messages (messages/<locale>.json) and need veterinary review. The tooth catalogue and the
 * finding/treatment code lists are added in phase 4.
 */
export const referenceDataSchema = z.object({
  species: z.array(z.string()),
  sexes: z.array(z.string()),
  asaClasses: z.array(z.string()),
  stages: z.array(z.string()),
  complaints: z.array(z.string()),
  findings: z.array(z.object({ code: z.string(), group: z.string(), grade: z.number().int().optional() })),
  treatments: z.array(z.string()),
  /** Tooth catalogue per species (modified Triadan). */
  teeth: z.record(
    z.string(),
    z.array(
      z.object({
        code: z.string(),
        quadrant: z.number().int(),
        arch: z.string(),
        side: z.string(),
        kind: z.string(),
        index: z.number().int(),
        roots: z.number().int(),
      }),
    ),
  ),
});
export type ReferenceData = z.infer<typeof referenceDataSchema>;

export const referenceData: ReferenceData = {
  species: [...speciesValues],
  sexes: [...sexValues],
  asaClasses: ["I", "II", "III", "IV", "V"],
  stages: ["normal", "1", "2", "3", "4"],
  complaints: [...COMPLAINTS],
  findings: FINDINGS,
  treatments: [...TREATMENTS],
  teeth: Object.fromEntries(
    speciesValues.map((species) => [
      species,
      teethOf(species).map(({ code, quadrant, arch, side, kind, index, roots }) => ({ code, quadrant, arch, side, kind, index, roots })),
    ]),
  ),
};
