/**
 * Demo data: the two examples of the sample sheets (Max the dog, Mici the cat) with a neutral demo clinic
 * and `example.com` addresses. The Hungarian texts live in supabase/seed/demo-data.json (data, not code).
 * Used by `npm run seed:demo` and by the layout check.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sheetContentSchema, SHEET_SCHEMA_VERSION } from "../../src/contracts/sheets";
import { estimateBirthMonth } from "../../src/domain/age";
import { teethOf, type Species } from "../../src/domain/teeth/catalog";
import { validateTeeth, type TeethRecord } from "../../src/domain/teeth/entry";
import type { createAdminClient } from "../../src/server/admin";

type Admin = ReturnType<typeof createAdminClient>;

export type DemoAnimal = {
  species: Species;
  name: string;
  breed: string;
  sex: string;
  owner: { name: string; email: string; phone: string };
  sheet: {
    treatmentDate: string;
    treatingVet: string;
    ageYears: number;
    ageMonths: number;
    weightKg: number;
    asa: string;
    healthyTeethScaledAndPolished: boolean;
    content: Record<string, unknown> & { teeth?: TeethRecord };
  };
};
type DemoData = {
  clinic: { name: string; postalCode: string; city: string; street: string; phone: string; email: string };
  animals: DemoAnimal[];
};

export type DemoRef = { species: Species; name: string; patientId: string; sheetId: string };

export function loadDemoData(): DemoData {
  return JSON.parse(readFileSync(join(__dirname, "..", "..", "supabase", "seed", "demo-data.json"), "utf8")) as DemoData;
}

/** The sheet content: every tooth recorded healthy (0) and scaled and polished, then the listed teeth on top. */
export function demoContent(animal: DemoAnimal) {
  const base: TeethRecord = {};
  if (animal.sheet.healthyTeethScaledAndPolished) {
    for (const tooth of teethOf(animal.species)) {
      base[tooth.code] = {
        codes: ["0"],
        treatments: ["U", "POL"],
        pocketMm: { mesial: null, buccal: null, distal: null, palatolingual: null },
        note: "",
      };
    }
  }
  const content = sheetContentSchema.parse({
    ...animal.sheet.content,
    teeth: { ...base, ...(animal.sheet.content.teeth ?? {}) },
  });
  const problems = validateTeeth(animal.species, content.teeth as TeethRecord);
  if (problems.length > 0) throw new Error(`Demo data for ${animal.name} breaks the tooth rules: ${problems.join("; ")}`);
  return content;
}

/** Add the demo animals to a clinic. Animals that are already there (same owner e-mail) are left alone. */
export async function insertDemoAnimals(admin: Admin, clinicId: string): Promise<DemoRef[]> {
  const created: DemoRef[] = [];
  for (const animal of loadDemoData().animals) {
    const existing = await admin.from("patients").select("id").eq("clinic_id", clinicId).eq("owner_email", animal.owner.email).limit(1);
    if (existing.error) throw existing.error;
    if (existing.data.length > 0) continue;

    const { sheet } = animal;
    const patient = await admin
      .from("patients")
      .insert({
        clinic_id: clinicId,
        species: animal.species,
        name: animal.name,
        breed: animal.breed,
        sex: animal.sex,
        owner_name: animal.owner.name,
        owner_email: animal.owner.email,
        owner_phone: animal.owner.phone,
        estimated_birth_month: estimateBirthMonth(sheet.treatmentDate, sheet.ageYears, sheet.ageMonths),
        last_weight_kg: sheet.weightKg,
      })
      .select("id")
      .single();
    if (patient.error) throw patient.error;

    const saved = await admin
      .from("treatment_sheets")
      .insert({
        clinic_id: clinicId,
        patient_id: patient.data.id,
        treatment_date: sheet.treatmentDate,
        treating_vet: sheet.treatingVet,
        age_years: sheet.ageYears,
        age_months: sheet.ageMonths,
        weight_kg: sheet.weightKg,
        asa: sheet.asa,
        content: demoContent(animal) as never,
        schema_version: SHEET_SCHEMA_VERSION,
      })
      .select("id")
      .single();
    if (saved.error) throw saved.error;
    created.push({ species: animal.species, name: animal.name, patientId: patient.data.id, sheetId: saved.data.id });
  }
  return created;
}

/** Remove the demo animals (and with them their sheets) from a clinic. */
export async function removeDemoAnimals(admin: Admin, clinicId: string): Promise<number> {
  const emails = loadDemoData().animals.map((animal) => animal.owner.email);
  const removed = await admin.from("patients").delete().eq("clinic_id", clinicId).in("owner_email", emails).select("id");
  if (removed.error) throw removed.error;
  return removed.data.length;
}

/** Fill the clinic's letterhead with the neutral demo data, but only the fields that are still empty. */
export async function fillDemoClinic(admin: Admin, clinicId: string): Promise<void> {
  const { clinic } = loadDemoData();
  const current = await admin.from("clinics").select("postal_code, city, street, phone, email").eq("id", clinicId).single();
  if (current.error) throw current.error;
  const update = {
    ...(current.data.postal_code ? {} : { postal_code: clinic.postalCode }),
    ...(current.data.city ? {} : { city: clinic.city }),
    ...(current.data.street ? {} : { street: clinic.street }),
    ...(current.data.phone ? {} : { phone: clinic.phone }),
    ...(current.data.email ? {} : { email: clinic.email }),
  };
  if (Object.keys(update).length === 0) return;
  const result = await admin.from("clinics").update(update).eq("id", clinicId);
  if (result.error) throw result.error;
}
