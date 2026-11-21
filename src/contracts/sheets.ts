import { z } from "zod";
import { isoDate, optionalText, pageOf, paginationQuery, uuid } from "./common";
import { patientInputSchema, patientSchema, speciesSchema } from "./patients";

/**
 * Current version of the `content` document stored in treatment_sheets.content.
 * Bump it (and migrate stored documents) when the shape changes incompatibly.
 */
export const SHEET_SCHEMA_VERSION = 1;

const text = (max: number) => z.string().max(max).default("");
const mm = z.number().min(0).max(30).nullable().default(null);

export const toothEntrySchema = z.object({
  /** Finding codes such as T1, G2, PD3, FX-C (validated against the tooth catalogue in a later phase). */
  codes: z.array(z.string().max(16)).max(32).default([]),
  /** Treatment codes such as U, POL, CURE, EXT-S. */
  treatments: z.array(z.string().max(16)).max(32).default([]),
  pocketMm: z
    .object({ mesial: mm, buccal: mm, distal: mm, palatolingual: mm })
    .prefault({}),
  note: text(2000),
});
export type ToothEntry = z.infer<typeof toothEntrySchema>;

export const sheetContentSchema = z.object({
  anamnesis: z
    .object({
      complaints: z.array(z.string().max(64)).max(32).default([]),
      otherAnamnesis: text(4000),
      homeHygiene: text(1000),
      diet: text(1000),
      lastFeeding: text(200),
      preoperativeBlood: text(200),
      assistant: text(160),
    })
    .prefault({}),
  /** Keyed by modified Triadan number, e.g. "108". */
  teeth: z.record(z.string().regex(/^\d{3}$/), toothEntrySchema).default({}),
  periodontal: z
    .object({
      stage: z.enum(["normal", "1", "2", "3", "4"]).nullable().default(null),
      calculusIndex: text(200),
      gingivitisIndex: text(200),
      occlusion: text(200),
      stomatitis: text(500),
    })
    .prefault({}),
  nerveBlocks: z
    .array(
      z.object({
        nerve: text(120),
        side: text(40),
        anesthetic: text(120),
        amountMl: z.number().min(0).max(50).nullable().default(null),
      }),
    )
    .max(20)
    .default([]),
  surgery: z.object({ suture: text(200), stitchType: text(200), description: text(8000) }).prefault({}),
  radiology: z
    .object({
      imageCount: z.number().int().min(0).max(200).nullable().default(null),
      findings: text(8000),
      intraoperative: text(8000),
    })
    .prefault({}),
  medications: z
    .array(
      z.object({
        name: text(200),
        dose: text(200),
        frequency: text(200),
        durationDays: z.number().int().min(0).max(365).nullable().default(null),
        instructions: text(2000),
      }),
    )
    .max(30)
    .default([]),
  homecare: z
    .object({
      feeding: text(2000),
      chewingRestrictions: text(2000),
      oralHygiene: text(2000),
      closingNote: text(2000),
    })
    .prefault({}),
  followUp: z.object({ date: isoDate.nullable().default(null), purpose: text(500) }).prefault({}),
});
export type SheetContent = z.infer<typeof sheetContentSchema>;

export const asaSchema = z.enum(["I", "II", "III", "IV", "V"]);

const sheetFields = {
  treatmentDate: isoDate,
  treatingVet: optionalText(160),
  ageYears: z.number().int().min(0).max(40).nullish().transform((v) => v ?? null),
  ageMonths: z.number().int().min(0).max(11).nullish().transform((v) => v ?? null),
  weightKg: z.number().positive().max(200).nullish().transform((v) => v ?? null),
  asa: asaSchema.nullish().transform((v) => v ?? null),
  content: sheetContentSchema.prefault({}),
};

/** Create a sheet for an existing patient (`patientId`) or for a new one (`patient`), exactly one of them. */
export const createSheetRequestSchema = z
  .object({
    ...sheetFields,
    patientId: uuid.optional(),
    patient: patientInputSchema.optional(),
  })
  .refine((v) => (v.patientId === undefined) !== (v.patient === undefined), {
    message: "patient_or_patient_id",
    path: ["patient"],
  });
export type CreateSheetRequest = z.output<typeof createSheetRequestSchema>;

/** Save: the `version` the client based its edit on; the optional patient card is saved together with the sheet. */
export const updateSheetRequestSchema = z.object({
  ...sheetFields,
  version: z.number().int().min(1),
  patient: patientInputSchema.optional(),
});
export type UpdateSheetRequest = z.output<typeof updateSheetRequestSchema>;

export const sheetSchema = z.object({
  id: uuid,
  clinicId: uuid,
  patientId: uuid,
  treatmentDate: z.string(),
  treatingVet: z.string().nullable(),
  ageYears: z.number().int().nullable(),
  ageMonths: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  asa: asaSchema.nullable(),
  content: sheetContentSchema,
  schemaVersion: z.number().int(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const sheetDetailSchema = sheetSchema.extend({ patient: patientSchema });
export type SheetDetail = z.infer<typeof sheetDetailSchema>;

export const sheetSummarySchema = z.object({
  id: uuid,
  patientId: uuid,
  patientName: z.string(),
  species: speciesSchema,
  ownerName: z.string(),
  treatmentDate: z.string(),
  treatingVet: z.string().nullable(),
  /** Distinct treatment codes used on the sheet, e.g. ["POL", "U"]. */
  procedures: z.array(z.string()),
  updatedAt: z.string(),
});
export type SheetSummary = z.infer<typeof sheetSummarySchema>;

export const sheetListQuery = paginationQuery;
export const sheetSummaryPageSchema = pageOf(sheetSummarySchema);
