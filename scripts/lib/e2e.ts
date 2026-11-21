/**
 * A throwaway signed-in user with its own clinic for the browser, flow and PDF checks.
 * The e-mail ends in @vetdent-light.test, the password is random and never printed; `remove()` deletes
 * the clinic (and with it its animals and sheets) and the user again.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "../../src/server/admin";
import type { Database } from "../../src/server/db/database.types";

type Admin = ReturnType<typeof createAdminClient>;
type ClinicFields = Partial<Pick<Database["public"]["Tables"]["clinics"]["Insert"], "postal_code" | "city" | "street" | "phone" | "email">>;

export type E2eUser = {
  id: string;
  email: string;
  password: string;
  clinicId: string;
  remove: () => Promise<void>;
};

export async function createE2eUser(
  admin: Admin,
  opts: { clinicName: string; displayName: string; title?: string; clinicFields?: ClinicFields },
): Promise<E2eUser> {
  const email = `e2e-${randomBytes(4).toString("hex")}@vetdent-light.test`;
  const password = randomBytes(24).toString("base64url");

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error("createUser failed");
  const id = created.data.user.id;

  let clinicId: string | undefined;
  const remove = async () => {
    if (clinicId) await admin.from("clinics").delete().eq("id", clinicId);
    await admin.auth.admin.deleteUser(id);
  };

  try {
    const clinic = await admin.from("clinics").insert({ name: opts.clinicName, ...opts.clinicFields }).select("id").single();
    if (clinic.error) throw clinic.error;
    clinicId = clinic.data.id;
    const member = await admin
      .from("clinic_members")
      .insert({ clinic_id: clinicId, user_id: id, display_name: opts.displayName, title: opts.title ?? "Dr." });
    if (member.error) throw member.error;
  } catch (error) {
    await remove();
    throw error;
  }
  return { id, email, password, clinicId, remove };
}
