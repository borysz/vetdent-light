import { estimateBirthMonth } from "@/domain/age";
import type { Page } from "@/contracts/common";
import type { PatientInput } from "@/contracts/patients";
import {
  SHEET_SCHEMA_VERSION,
  type CreateSheetRequest,
  type SheetDetail,
  type SheetSummary,
  type UpdateSheetRequest,
} from "@/contracts/sheets";
import type { Json } from "../db/database.types";
import type { AuthContext } from "../auth";
import { ApiError, fromDb } from "../errors";
import { toSheetDetail, toSheetSummary, type PatientRow, type SheetRow } from "../mappers";

type SheetFields = Pick<
  CreateSheetRequest,
  "treatmentDate" | "treatingVet" | "ageYears" | "ageMonths" | "weightKg" | "asa" | "content"
>;

function sheetJson(fields: SheetFields): Json {
  return {
    treatmentDate: fields.treatmentDate,
    treatingVet: fields.treatingVet,
    ageYears: fields.ageYears,
    ageMonths: fields.ageMonths,
    weightKg: fields.weightKg,
    asa: fields.asa,
    content: fields.content as unknown as Json,
    schemaVersion: SHEET_SCHEMA_VERSION,
  };
}

/** The birth month follows the age given on the sheet; without an age it stays unknown/unchanged. */
function birthMonthFor(fields: SheetFields): string | null {
  return fields.ageYears !== null || fields.ageMonths !== null
    ? estimateBirthMonth(fields.treatmentDate, fields.ageYears ?? 0, fields.ageMonths ?? 0)
    : null;
}

function patientJson(patient: PatientInput, fields: SheetFields): Json {
  return {
    species: patient.species,
    name: patient.name,
    breed: patient.breed,
    sex: patient.sex,
    ownerName: patient.ownerName,
    ownerEmail: patient.ownerEmail,
    ownerPhone: patient.ownerPhone,
    estimatedBirthMonth: birthMonthFor(fields),
    lastWeightKg: fields.weightKg,
  };
}

export async function getSheet(ctx: AuthContext, id: string): Promise<SheetDetail> {
  const { data, error } = await ctx.db
    .from("treatment_sheets")
    .select("*, patients(*)")
    .eq("id", id)
    .eq("clinic_id", ctx.clinicId)
    .maybeSingle();
  if (error) throw fromDb(error);
  if (!data || !data.patients) throw new ApiError("not_found", "Sheet not found");
  const { patients, ...sheet } = data;
  return toSheetDetail(sheet as SheetRow, patients as PatientRow);
}

export async function createSheet(ctx: AuthContext, input: CreateSheetRequest): Promise<SheetDetail> {
  if (input.patient) {
    // New patient and first sheet in one database transaction.
    const { data, error } = await ctx.db.rpc("create_patient_with_sheet", {
      p_clinic_id: ctx.clinicId,
      p_patient: patientJson(input.patient, input),
      p_sheet: sheetJson(input),
    });
    if (error) throw fromDb(error);
    return getSheet(ctx, (data as { sheetId: string }).sheetId);
  }

  const patientId = input.patientId as string;
  const { data: patient, error: patientError } = await ctx.db
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("clinic_id", ctx.clinicId)
    .maybeSingle();
  if (patientError) throw fromDb(patientError);
  if (!patient) throw new ApiError("not_found", "Patient not found");

  const { data: sheet, error } = await ctx.db
    .from("treatment_sheets")
    .insert({
      clinic_id: ctx.clinicId,
      patient_id: patientId,
      treatment_date: input.treatmentDate,
      treating_vet: input.treatingVet,
      age_years: input.ageYears,
      age_months: input.ageMonths,
      weight_kg: input.weightKg,
      asa: input.asa,
      content: input.content as unknown as Json,
      schema_version: SHEET_SCHEMA_VERSION,
    })
    .select("id")
    .single();
  if (error) throw fromDb(error);

  // Keep the patient's estimated birth month and last weight in step with the new sheet.
  const birthMonth = birthMonthFor(input);
  const patientUpdate: { estimated_birth_month?: string; last_weight_kg?: number } = {};
  if (birthMonth) patientUpdate.estimated_birth_month = birthMonth;
  if (input.weightKg !== null) patientUpdate.last_weight_kg = input.weightKg;
  if (Object.keys(patientUpdate).length > 0) {
    const { error: updateError } = await ctx.db.from("patients").update(patientUpdate).eq("id", patientId);
    if (updateError) throw fromDb(updateError);
  }
  return getSheet(ctx, sheet.id);
}

/** Save with optimistic locking; a stale `version` raises version_conflict (409). */
export async function updateSheet(ctx: AuthContext, id: string, input: UpdateSheetRequest): Promise<SheetDetail> {
  // Make sure the sheet belongs to the caller's clinic (404 otherwise) before writing.
  await getSheet(ctx, id);
  const { error } = await ctx.db.rpc("save_sheet", {
    p_sheet_id: id,
    p_expected_version: input.version,
    p_sheet: sheetJson(input),
    p_patient: input.patient ? patientJson(input.patient, input) : null,
  } as never);
  if (error) throw fromDb(error);
  return getSheet(ctx, id);
}

type SummaryRow = Pick<SheetRow, "id" | "patient_id" | "treatment_date" | "treating_vet" | "content" | "updated_at"> & {
  patients: Pick<PatientRow, "name" | "species" | "owner_name"> | null;
};

const summarySelect = "id, patient_id, treatment_date, treating_vet, content, updated_at, patients(name, species, owner_name)";

async function listSummaries(
  ctx: AuthContext,
  opts: { patientId?: string; page: number; pageSize: number },
): Promise<Page<SheetSummary>> {
  let query = ctx.db
    .from("treatment_sheets")
    .select(summarySelect, { count: "exact" })
    .eq("clinic_id", ctx.clinicId)
    // Newest treatment first; within a day the most recently created sheet first.
    .order("treatment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize - 1);
  if (opts.patientId) query = query.eq("patient_id", opts.patientId);

  const { data, error, count } = await query;
  if (error) throw fromDb(error);
  const items = (data as unknown as SummaryRow[]).flatMap((row) =>
    row.patients ? [toSheetSummary(row, row.patients)] : [],
  );
  return { items, page: opts.page, pageSize: opts.pageSize, total: count ?? 0 };
}

export function listRecentSheets(ctx: AuthContext, opts: { page: number; pageSize: number }) {
  return listSummaries(ctx, opts);
}

export function listPatientSheets(ctx: AuthContext, patientId: string, opts: { page: number; pageSize: number }) {
  return listSummaries(ctx, { ...opts, patientId });
}
