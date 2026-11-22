/**
 * Set the Supabase Auth settings the forgotten password flow needs, through the Supabase Management API.
 * Run it in your own terminal; it asks for a personal access token (hidden, never stored or printed):
 *
 *   npm run supabase:auth-config                       site URL https://vetdent.hu + redirect URLs
 *   npm run supabase:auth-config -- --site https://example.org
 *   npm run supabase:auth-config -- --smtp             own e-mail server (SMTP) instead of the built-in one
 *   npm run supabase:auth-config -- --dry-run          only show what would change
 *
 * Only the named fields are sent; everything else (e.g. the disabled self sign-up, the e-mail templates) stays.
 * Personal access token: supabase.com -> Account -> Access Tokens.
 */
import {
  describeChanges,
  projectRefOf,
  smtpChanges,
  urlChanges,
  type AuthConfig,
} from "./lib/auth-config";
import { askLine, readHidden } from "./lib/password-prompt";

const API = "https://api.supabase.com/v1";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function api<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 401) throw new Error("The access token was refused (401). Create a new one and try again.");
    if (response.status === 403) throw new Error("This token has no access to the project (403).");
    throw new Error(`Supabase Management API ${method} ${path}: ${response.status} ${text.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing (.env.local)");
  const ref = projectRefOf(supabaseUrl);
  const siteUrl = arg("site") ?? "https://vetdent.hu";
  const dryRun = flag("dry-run");

  const token = await readHidden("Supabase personal access token: ");
  if (!token) throw new Error("No token given.");

  const current = await api<AuthConfig>(token, "GET", `/projects/${ref}/config/auth`);
  console.log(`Project: ${ref}`);
  console.log(`  site_url: ${current.site_url ?? "(empty)"}`);
  console.log(`  uri_allow_list: ${current.uri_allow_list || "(empty)"}`);
  console.log(`  self sign-up: ${current.disable_signup ? "disabled" : "ENABLED (consider disabling it on the dashboard)"}`);
  console.log(`  e-mail server: ${current.smtp_host ? `own SMTP (${current.smtp_host})` : "built-in Supabase e-mail (only reaches members of the organization)"}`);

  let changes: Record<string, unknown>;
  if (flag("smtp")) {
    const host = await askLine("SMTP host (e.g. smtp.resend.com): ");
    const port = Number((await askLine("SMTP port [465]: ")) || "465");
    const user = await askLine("SMTP user name: ");
    const pass = await readHidden("SMTP password / API key: ");
    const senderEmail = await askLine("Sender address (e.g. noreply@vetdent.hu): ");
    const senderName = (await askLine("Sender name [VetDent]: ")) || "VetDent";
    if (!host || !user || !pass || !senderEmail || !Number.isInteger(port)) throw new Error("Every SMTP field is required.");
    changes = smtpChanges({ host, port, user, pass, senderEmail, senderName });
  } else {
    changes = urlChanges(current, siteUrl);
  }

  if (Object.keys(changes).length === 0) {
    console.log("Nothing to change: the settings are already in place.");
    return;
  }
  console.log("Changes:");
  for (const line of describeChanges(changes)) console.log(line);
  if (dryRun) {
    console.log("Dry run: nothing was changed.");
    return;
  }
  if ((await askLine("Apply these changes? (y/N) ")).toLowerCase() !== "y") {
    console.log("Nothing was changed.");
    return;
  }
  await api(token, "PATCH", `/projects/${ref}/config/auth`, changes);
  console.log("Done: the settings are saved.");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  // exitCode instead of exit(): exiting while stdin is still open trips an assertion in Node on Windows.
  process.exitCode = 1;
});
