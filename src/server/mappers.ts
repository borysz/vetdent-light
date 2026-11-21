import { ageOn } from "@/domain/age";
import type { Clinic } from "@/contracts/clinic";
import type { Patient } from "@/contracts/patients";
import { sheetContentSchema, type SheetDetail, type SheetSummary } from "@/contracts/sheets";
import type { Database } from "./db/database.types";

type Tables = Database["public"]["Tables"];
export type PatientRow = Tables["patients"]["Row"];
export type SheetRow = Tables["treatment_sheets"]["Row"];
export type ClinicRow = Tables["clinics"]["Row"];

/** Today's date in the clinic's time zone, YYYY-MM-DD. */
export function todayInBudapest(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(now);
}

export function toPatient(row: PatientRow, today = todayInBudapest()): Patient {
  return {
    id: row.id,
    species: row.species as Patient["species"],
    name: row.name,
    breed: row.breed,
    sex: row.sex as Patient["sex"],
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    ownerPhone: row.owner_phone,
    estimatedBirthMonth: row.estimated_birth_month ? row.estimated_birth_month.slice(0, 7) : null,
    age: row.estimated_birth_month ? ageOn(row.estimated_birth_month, today) : null,
    lastWeightKg: row.last_weight_kg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function parseContent(raw: unknown) {
  const parsed = sheetContentSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    // Stored documents are written through the same schema; a mismatch means a schema_version migration is missing.
    throw new Error("Stored sheet content does not match the content schema");
  }
  return parsed.data;
}

export function toSheetDetail(row: SheetRow, patient: PatientRow): SheetDetail {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    treatmentDate: row.treatment_date,
    treatingVet: row.treating_vet,
    ageYears: row.age_years,
    ageMonths: row.age_months,
    weightKg: row.weight_kg,
    asa: row.asa as SheetDetail["asa"],
    content: parseContent(row.content),
    schemaVersion: row.schema_version,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patient: toPatient(patient),
  };
}

export function toSheetSummary(
  row: Pick<SheetRow, "id" | "patient_id" | "treatment_date" | "treating_vet" | "content" | "updated_at">,
  patient: Pick<PatientRow, "name" | "species" | "owner_name">,
): SheetSummary {
  const content = parseContent(row.content);
  const procedures = [...new Set(Object.values(content.teeth).flatMap((tooth) => tooth.treatments))].sort();
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: patient.name,
    species: patient.species as SheetSummary["species"],
    ownerName: patient.owner_name,
    treatmentDate: row.treatment_date,
    treatingVet: row.treating_vet,
    procedures,
    updatedAt: row.updated_at,
  };
}

export function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    name: row.name,
    postalCode: row.postal_code,
    city: row.city,
    street: row.street,
    phone: row.phone,
    email: row.email,
  };
}
