import { z } from "zod";
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
});
export type ReferenceData = z.infer<typeof referenceDataSchema>;

export const referenceData: ReferenceData = {
  species: [...speciesValues],
  sexes: [...sexValues],
  asaClasses: ["I", "II", "III", "IV", "V"],
  stages: ["normal", "1", "2", "3", "4"],
};
