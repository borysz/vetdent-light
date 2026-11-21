import type { Clinic, ClinicUpdate } from "@/contracts/clinic";
import type { AuthContext } from "../auth";
import { ApiError, fromDb } from "../errors";
import { toClinic } from "../mappers";

export async function getClinic(ctx: AuthContext): Promise<Clinic> {
  const { data, error } = await ctx.db.from("clinics").select("*").eq("id", ctx.clinicId).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Clinic not found");
  return toClinic(data);
}

export async function updateClinic(ctx: AuthContext, input: ClinicUpdate): Promise<Clinic> {
  const { data, error } = await ctx.db
    .from("clinics")
    .update({
      name: input.name,
      postal_code: input.postalCode,
      city: input.city,
      street: input.street,
      phone: input.phone,
      email: input.email,
    })
    .eq("id", ctx.clinicId)
    .select("*")
    .maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Clinic not found");
  return toClinic(data);
}
