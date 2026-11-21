import type { Clinic } from "@/contracts/clinic";
import type { Sex, Species } from "@/contracts/patients";
import type { SheetContent, SheetDetail } from "@/contracts/sheets";
import { parseDecimal, type SheetDraft } from "@/client/sheet-draft";

/** Everything the A4 report shows; built from a saved sheet (print page, PDF) or from the draft (live preview). */
export type ReportData = {
  clinic: Clinic | null;
  species: Species;
  patientName: string;
  breed: string;
  sex: Sex | null;
  ownerName: string;
  ownerEmail: string;
  age: { years: number; months: number } | null;
  weightKg: number | null;
  asa: string;
  treatingVet: string;
  treatmentDate: string;
  content: SheetContent;
};

export function reportFromSheet(sheet: SheetDetail, clinic: Clinic | null): ReportData {
  return {
    clinic,
    species: sheet.patient.species,
    patientName: sheet.patient.name,
    breed: sheet.patient.breed ?? "",
    sex: sheet.patient.sex,
    ownerName: sheet.patient.ownerName,
    ownerEmail: sheet.patient.ownerEmail ?? "",
    age: sheet.ageYears !== null || sheet.ageMonths !== null ? { years: sheet.ageYears ?? 0, months: sheet.ageMonths ?? 0 } : null,
    weightKg: sheet.weightKg,
    asa: sheet.asa ?? "",
    treatingVet: sheet.treatingVet ?? "",
    treatmentDate: sheet.treatmentDate,
    content: sheet.content,
  };
}

export function reportFromDraft(draft: SheetDraft, clinic: Clinic | null): ReportData {
  const weight = parseDecimal(draft.weightKg);
  return {
    clinic,
    species: draft.species,
    patientName: draft.patientName.trim(),
    breed: draft.breed.trim(),
    sex: draft.sex === "" ? null : draft.sex,
    ownerName: draft.ownerName.trim(),
    ownerEmail: draft.ownerEmail.trim(),
    age:
      draft.ageYears.trim() !== "" || draft.ageMonths.trim() !== ""
        ? { years: Number(draft.ageYears) || 0, months: Number(draft.ageMonths) || 0 }
        : null,
    weightKg: weight === null || Number.isNaN(weight) ? null : weight,
    asa: draft.asa,
    treatingVet: draft.treatingVet.trim(),
    treatmentDate: draft.treatmentDate,
    content: draft.content,
  };
}
