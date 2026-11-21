import { z } from "zod";
import { optionalText, requiredText, uuid, pageOf, paginationQuery } from "./common";

export const speciesValues = ["dog", "cat"] as const;
export const sexValues = ["male", "female", "neutered_male", "spayed_female"] as const;
export const speciesSchema = z.enum(speciesValues);
export const sexSchema = z.enum(sexValues);
export type Species = z.infer<typeof speciesSchema>;

const ownerEmail = optionalText(254).refine(
  (value) => value === null || z.email().safeParse(value).success,
  "invalid_email",
);

/** Patient card as entered by the user. Age lives on the sheet; the birth month is derived from it. */
export const patientInputSchema = z.object({
  species: speciesSchema,
  name: requiredText(120),
  breed: optionalText(120),
  sex: sexSchema.nullish().transform((v) => v ?? null),
  ownerName: requiredText(160),
  ownerEmail,
  ownerPhone: optionalText(40),
});
export type PatientInput = z.output<typeof patientInputSchema>;

export const patientPatchSchema = z
  .object({
    species: speciesSchema,
    name: requiredText(120),
    breed: optionalText(120),
    sex: sexSchema.nullish().transform((v) => v ?? null),
    ownerName: requiredText(160),
    ownerEmail,
    ownerPhone: optionalText(40),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "empty_patch");
export type PatientPatch = z.output<typeof patientPatchSchema>;

export const patientSchema = z.object({
  id: uuid,
  species: speciesSchema,
  name: z.string(),
  breed: z.string().nullable(),
  sex: sexSchema.nullable(),
  ownerName: z.string(),
  ownerEmail: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  /** YYYY-MM, estimated from the age given at the last visit. */
  estimatedBirthMonth: z.string().nullable(),
  /** Age today, derived from estimatedBirthMonth. */
  age: z.object({ years: z.number().int(), months: z.number().int() }).nullable(),
  lastWeightKg: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Patient = z.infer<typeof patientSchema>;

export const patientListQuery = paginationQuery.extend({
  q: z.string().trim().max(120).optional(),
  species: speciesSchema.optional(),
});
export const patientPageSchema = pageOf(patientSchema);
