import { z } from "zod";
import type { Patient, Sex, Species } from "@/contracts/patients";
import { sheetContentSchema, type SheetContent, type SheetDetail } from "@/contracts/sheets";
import type { CreateSheetBody, UpdateSheetBody } from "./api";

type Asa = "I" | "II" | "III" | "IV" | "V";

/** The sheet as the user edits it: form fields are strings, the rest of the sheet is the content document. */
export type SheetDraft = {
  species: Species;
  patientName: string;
  breed: string;
  sex: "" | Sex;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  treatmentDate: string;
  treatingVet: string;
  ageYears: string;
  ageMonths: string;
  weightKg: string;
  asa: "" | Asa;
  content: SheetContent;
};

/** Today's date in the clinic's time zone, YYYY-MM-DD. */
export function todayInBudapest(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(now);
}

/** Decimal with a comma or a dot; null for empty, NaN for garbage. */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** Display with a decimal comma (hu-HU), e.g. 32,5. */
export function formatDecimal(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

/** Display name of a clinic member, e.g. "Dr. Jane Doe". */
export function memberName(member: { displayName: string; title: string | null }): string {
  return [member.title, member.displayName].filter(Boolean).join(" ");
}

export function emptyContent(): SheetContent {
  return sheetContentSchema.parse({});
}

/**
 * A new sheet; an existing patient pre-fills the card, and the age grows from the estimated birth month.
 * The treating vet defaults to the signed-in user (`treatingVet`).
 */
export function newDraft(
  species: Species,
  patient?: Patient,
  today = todayInBudapest(),
  treatingVet = "",
): SheetDraft {
  return {
    species: patient?.species ?? species,
    patientName: patient?.name ?? "",
    breed: patient?.breed ?? "",
    sex: patient?.sex ?? "",
    ownerName: patient?.ownerName ?? "",
    ownerEmail: patient?.ownerEmail ?? "",
    ownerPhone: patient?.ownerPhone ?? "",
    treatmentDate: today,
    treatingVet,
    ageYears: patient?.age ? String(patient.age.years) : "",
    ageMonths: patient?.age ? String(patient.age.months) : "",
    weightKg: formatDecimal(patient?.lastWeightKg ?? null),
    asa: "",
    content: emptyContent(),
  };
}

export function draftFromSheet(sheet: SheetDetail): SheetDraft {
  return {
    species: sheet.patient.species,
    patientName: sheet.patient.name,
    breed: sheet.patient.breed ?? "",
    sex: sheet.patient.sex ?? "",
    ownerName: sheet.patient.ownerName,
    ownerEmail: sheet.patient.ownerEmail ?? "",
    ownerPhone: sheet.patient.ownerPhone ?? "",
    treatmentDate: sheet.treatmentDate,
    treatingVet: sheet.treatingVet ?? "",
    ageYears: sheet.ageYears === null ? "" : String(sheet.ageYears),
    ageMonths: sheet.ageMonths === null ? "" : String(sheet.ageMonths),
    weightKg: formatDecimal(sheet.weightKg),
    asa: sheet.asa ?? "",
    content: sheet.content,
  };
}

export type DraftErrorKey = "required" | "invalidDate" | "invalidEmail" | "invalidNumber";
export type DraftErrors = Partial<
  Record<"patientName" | "ownerName" | "ownerEmail" | "treatmentDate" | "ageYears" | "ageMonths" | "weightKg", DraftErrorKey>
>;

/** Client-side checks for the fields needed to save; the server validates again. Values are error keys (messages: card.*). */
export function validateDraft(draft: SheetDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.patientName.trim() === "") errors.patientName = "required";
  if (draft.ownerName.trim() === "") errors.ownerName = "required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.treatmentDate)) errors.treatmentDate = "invalidDate";
  if (draft.ownerEmail.trim() !== "" && !z.email().safeParse(draft.ownerEmail.trim()).success) errors.ownerEmail = "invalidEmail";
  if (Number.isNaN(parseDecimal(draft.weightKg))) errors.weightKg = "invalidNumber";
  const years = draft.ageYears.trim();
  if (years !== "" && !(/^\d+$/.test(years) && Number(years) <= 40)) errors.ageYears = "invalidNumber";
  const months = draft.ageMonths.trim();
  if (months !== "" && !(/^\d+$/.test(months) && Number(months) <= 11)) errors.ageMonths = "invalidNumber";
  return errors;
}

function sheetFields(draft: SheetDraft) {
  const text = (value: string) => (value.trim() === "" ? null : value.trim());
  const int = (value: string) => (value.trim() === "" ? null : Number(value.trim()));
  return {
    treatmentDate: draft.treatmentDate,
    treatingVet: text(draft.treatingVet),
    ageYears: int(draft.ageYears),
    ageMonths: int(draft.ageMonths),
    weightKg: parseDecimal(draft.weightKg),
    asa: draft.asa === "" ? null : draft.asa,
    content: draft.content,
  };
}

function patientCard(draft: SheetDraft) {
  const text = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    species: draft.species,
    name: draft.patientName.trim(),
    breed: text(draft.breed),
    sex: draft.sex === "" ? null : draft.sex,
    ownerName: draft.ownerName.trim(),
    ownerEmail: text(draft.ownerEmail),
    ownerPhone: text(draft.ownerPhone),
  };
}

/** New sheet for an existing patient (`patientId`) or, without it, for a new patient created together. */
export function toCreateBody(draft: SheetDraft, patientId?: string): CreateSheetBody {
  return patientId
    ? { ...sheetFields(draft), patientId }
    : { ...sheetFields(draft), patient: patientCard(draft) };
}

export function toUpdateBody(draft: SheetDraft, version: number): UpdateSheetBody {
  return { ...sheetFields(draft), version, patient: patientCard(draft) };
}

export function draftsEqual(a: SheetDraft, b: SheetDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
