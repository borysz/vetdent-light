/**
 * Is this computer ready to continue the project? Run it first on a new device and at the start of a session:
 *
 *   npm run setup:check
 *
 * Checks Node, the installed packages, .env.local (names only; values are never printed), the Supabase
 * project, Chrome for the PDF and the browser checks, and whether the local Git copy is up to date with
 * origin/main. Exit code 1 when something required is missing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const root = join(__dirname, "..");
const lines: string[] = [];
let failed = false;
const pass = (what: string, detail = "") => lines.push(`OK       ${what}${detail ? ` - ${detail}` : ""}`);
const fail = (what: string, fix: string) => {
  failed = true;
  lines.push(`MISSING  ${what} - ${fix}`);
};
const warn = (what: string, fix: string) => lines.push(`NOTE     ${what} - ${fix}`);

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_JWKS_URL", "SUPABASE_SECRET_KEY"];

async function main() {
  // Node
  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 24) pass("Node.js", process.versions.node);
  else fail("Node.js 24 or newer", `this is ${process.versions.node}; install the current LTS from nodejs.org`);

  // Packages
  if (existsSync(join(root, "node_modules", "next"))) pass("packages installed");
  else fail("packages", "run npm ci");

  // .env.local: names only
  const envFile = join(root, ".env.local");
  let env: Record<string, string | undefined> = {};
  if (!existsSync(envFile)) {
    fail(".env.local", "copy it from your other computer or password manager (template: .env.example; values in the Supabase dashboard, Project settings > API)");
  } else {
    env = parseEnv(readFileSync(envFile, "utf8"));
    const missing = REQUIRED_ENV.filter((name) => !env[name]);
    if (missing.length === 0) pass(".env.local", "all required values present");
    else fail(".env.local", `empty or missing: ${missing.join(", ")}`);
  }

  // Supabase project reachable with the publishable key
  if (env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) {
    try {
      const response = await fetch(`${env.SUPABASE_URL}/auth/v1/health`, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY } });
      if (response.ok) pass("Supabase project reachable");
      else fail("Supabase project", `answered ${response.status}; check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY`);
    } catch (error) {
      fail("Supabase project", `not reachable (${error instanceof Error ? error.message : error}); check the network`);
    }
  }

  // Chrome (server-side PDF and the check:* scripts)
  try {
    Object.assign(process.env, env);
    const { resolveChromePath } = await import("../src/server/chrome");
    const chrome = await resolveChromePath();
    if (chrome) pass("Chrome", chrome);
    else fail("Chrome", "install Google Chrome, or run npm run chrome:install");
  } catch {
    warn("Chrome", "could not be looked up before .env.local is complete");
  }

  // Git: up to date with origin/main?
  try {
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    git("fetch", "--quiet", "origin");
    // Merge commits are not counted: a work branch merged into main misses only main's merge commits.
    const [behind, ahead] = git("rev-list", "--left-right", "--count", "--no-merges", "origin/main...HEAD").split(/\s+/).map(Number);
    const dirty = git("status", "--porcelain") !== "";
    if (behind > 0) fail("Git", `${behind} commit(s) behind origin/main: run git pull (on main) or merge origin/main`);
    else pass("Git", `branch ${branch}, up to date with origin/main${ahead > 0 ? `, ${ahead} commit(s) not yet on main` : ""}`);
    if (dirty) warn("Git", "there are uncommitted changes");
    // Write access: a dry-run push to a branch that does not exist (GitHub checks the permission, nothing is sent).
    try {
      git("push", "--dry-run", "--porcelain", "origin", "HEAD:refs/heads/deploy-key-check");
      pass("GitHub write access (push)");
    } catch {
      fail("GitHub write access (push)", "run npm run setup:deploy-key (this device needs its own deploy key with write access)");
    }
  } catch (error) {
    fail("Git", `the repository is not reachable (${error instanceof Error ? error.message.split("\n")[0] : error}); run npm run setup:deploy-key`);
  }

  console.log(lines.join("\n"));
  console.log(failed ? "\nNot ready yet: fix the MISSING lines above." : "\nReady. Read the last entry of docs/MUNKANAPLO.md and TODO.md, then continue.");
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error("setup check crashed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
