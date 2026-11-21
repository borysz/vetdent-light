/**
 * Create a confirmed Auth user and a clinic membership. Run it in your own terminal:
 *
 *   npm run user:create -- --email vet@example.com --name "Jane Doe" --title "Dr." [--clinic "Clinic name"]
 *
 * The password is asked for hidden, twice (or read once from stdin when piped); it is never a command-line argument.
 */
import { createAdminClient } from "../src/server/admin";
import { promptNewPassword } from "./lib/password-prompt";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const displayName = arg("name");
  const title = arg("title") ?? null;
  const clinicName = arg("clinic") ?? "Demo clinic";
  if (!email || !displayName) {
    console.error('Usage: npm run user:create -- --email <email> --name "<display name>" [--title "Dr."] [--clinic "<clinic>"]');
    process.exit(2);
  }

  const password = await promptNewPassword();

  const admin = createAdminClient();

  let clinicId: string;
  const existing = await admin.from("clinics").select("id").eq("name", clinicName).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    clinicId = existing.data.id;
  } else {
    const created = await admin.from("clinics").insert({ name: clinicName }).select("id").single();
    if (created.error) throw created.error;
    clinicId = created.data.id;
    console.log(`Clinic created: ${clinicName}`);
  }

  const user = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (user.error || !user.data.user) throw user.error ?? new Error("User was not created");

  const member = await admin
    .from("clinic_members")
    .insert({ clinic_id: clinicId, user_id: user.data.user.id, display_name: displayName, title });
  if (member.error) {
    await admin.auth.admin.deleteUser(user.data.user.id);
    throw member.error;
  }
  console.log(`User created: ${email} (${clinicName})`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
