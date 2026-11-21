/**
 * Set a new password for an existing user. Run it in your own terminal:
 *
 *   npm run user:password -- --email vet@example.com
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
  const email = arg("email")?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run user:password -- --email <email>");
    process.exit(2);
  }

  const admin = createAdminClient();
  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const list = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (list.error) throw list.error;
    userId = list.data.users.find((user) => user.email?.toLowerCase() === email)?.id;
    if (list.data.users.length < 200) break;
  }
  if (!userId) {
    console.error(`No user with this email: ${email}`);
    process.exit(1);
  }

  const password = await promptNewPassword();
  const updated = await admin.auth.admin.updateUserById(userId, { password });
  if (updated.error) throw updated.error;
  console.log(`Password changed: ${email}`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
