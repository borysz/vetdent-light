import { z } from "zod";
import { sheetContentSchema } from "@/contracts/sheets";
import type { SheetDraft } from "./sheet-draft";

/** Unsaved edits kept in the browser so a closed tab or a crash does not lose them. */
export type StoredDraft = { draft: SheetDraft; savedAt: string; baseVersion: number | null };

const PREFIX = "vetdent:draft:";

const storedSchema = z.object({
  draft: z.object({
    species: z.enum(["dog", "cat"]),
    patientName: z.string(),
    breed: z.string(),
    sex: z.string(),
    ownerName: z.string(),
    ownerEmail: z.string(),
    ownerPhone: z.string(),
    treatmentDate: z.string(),
    treatingVet: z.string(),
    ageYears: z.string(),
    ageMonths: z.string(),
    weightKg: z.string(),
    asa: z.string(),
    content: sheetContentSchema,
  }),
  savedAt: z.string(),
  baseVersion: z.number().int().nullable(),
});

/** Storage key of a draft: the sheet's id, or what a new sheet was started from. */
export function draftKey(parts: { sheetId: string | null; patientId: string | null; species: string }): string {
  if (parts.sheetId) return `${PREFIX}sheet:${parts.sheetId}`;
  if (parts.patientId) return `${PREFIX}new-for-patient:${parts.patientId}`;
  return `${PREFIX}new:${parts.species}`;
}

// Browser storage can be unavailable or full (private windows, blocked site data): never let it break editing.
export function readDraft(key: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as StoredDraft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, value: StoredDraft): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: the draft is a convenience.
  }
}

export function removeDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
