import type { Page } from "@/contracts/common";
import type { Patient, PatientInput, PatientPatch, Species } from "@/contracts/patients";
import type { AuthContext } from "../auth";
import { ApiError, fromDb } from "../errors";
import type { Database } from "../db/database.types";
import { toPatient } from "../mappers";

/** Escape LIKE wildcards, then quote for use inside a PostgREST or() filter. */
function likeFilterValue(term: string): string {
  const pattern = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return `"${pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function listPatients(
  ctx: AuthContext,
  opts: { q?: string; species?: Species; page: number; pageSize: number },
): Promise<Page<Patient>> {
  let query = ctx.db
    .from("patients")
    .select("*", { count: "exact" })
    .eq("clinic_id", ctx.clinicId)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize - 1);

  if (opts.species) query = query.eq("species", opts.species);
  if (opts.q) {
    const value = likeFilterValue(opts.q);
    query = query.or(`name.ilike.${value},owner_name.ilike.${value},owner_phone.ilike.${value}`);
  }

  const { data, error, count } = await query;
  if (error) throw fromDb(error);
  return { items: data.map((row) => toPatient(row)), page: opts.page, pageSize: opts.pageSize, total: count ?? 0 };
}

export async function getPatient(ctx: AuthContext, id: string): Promise<Patient> {
  const { data, error } = await ctx.db
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", ctx.clinicId)
    .maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Patient not found");
  return toPatient(data);
}

/** Create a patient without a sheet (sheets create their patient atomically via POST /sheets). */
export async function createPatient(ctx: AuthContext, input: PatientInput): Promise<Patient> {
  const { data, error } = await ctx.db
    .from("patients")
    .insert({
      clinic_id: ctx.clinicId,
      species: input.species,
      name: input.name,
      breed: input.breed,
      sex: input.sex,
      owner_name: input.ownerName,
      owner_email: input.ownerEmail,
      owner_phone: input.ownerPhone,
    })
    .select("*")
    .single();
  if (error) throw fromDb(error);
  return toPatient(data);
}

export async function updatePatient(ctx: AuthContext, id: string, patch: PatientPatch): Promise<Patient> {
  const update: Database["public"]["Tables"]["patients"]["Update"] = {};
  if (patch.species !== undefined) update.species = patch.species;
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.breed !== undefined) update.breed = patch.breed;
  if (patch.sex !== undefined) update.sex = patch.sex;
  if (patch.ownerName !== undefined) update.owner_name = patch.ownerName;
  if (patch.ownerEmail !== undefined) update.owner_email = patch.ownerEmail;
  if (patch.ownerPhone !== undefined) update.owner_phone = patch.ownerPhone;

  const { data, error } = await ctx.db
    .from("patients")
    .update(update)
    .eq("id", id)
    .eq("clinic_id", ctx.clinicId)
    .select("*")
    .maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Patient not found");
  return toPatient(data);
}
