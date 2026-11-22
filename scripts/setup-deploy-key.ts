/**
 * Give this device its own deploy key for the GitHub repository and check that it can read and write:
 *
 *   npm run setup:deploy-key            (in your own terminal, in the project folder)
 *   npm run setup:deploy-key -- --check (only check, change nothing)
 *
 * 1. Creates ~/.ssh/vetdent_light_deploy_ed25519 if it does not exist (no passphrase: the key opens only this repo).
 * 2. Adds GitHub's official SSH host keys (from https://api.github.com/meta, over HTTPS) to ~/.ssh/known_hosts.
 * 3. Points this repository at the key (git config core.sshCommand) and at the SSH remote.
 * 4. If the key is not yet on GitHub: adds it with the GitHub CLI when that is signed in, otherwise prints the
 *    public key and the page where to add it (Settings > Deploy keys, "Allow write access").
 * 5. Checks read access (git ls-remote) and write access (a dry-run push, which sends nothing).
 * The private key is never printed; only the public key is.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { join } from "node:path";
import { askLine } from "./lib/password-prompt";

const REPO = "borysz/vetdent-light";
const SSH_REMOTE = `git@github.com:${REPO}.git`;
const root = join(__dirname, "..");
const sshDir = join(homedir(), ".ssh");
const keyPath = join(sshDir, "vetdent_light_deploy_ed25519");
const checkOnly = process.argv.includes("--check");

/** Git runs core.sshCommand through a shell: forward slashes work on every system. */
const posix = (path: string) => path.replace(/\\/g, "/");
const sshCommand = `ssh -i "${posix(keyPath)}" -o IdentitiesOnly=yes -o BatchMode=yes`;

function run(cmd: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: "utf8", env: { ...process.env, ...env }, timeout: 30_000 });
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}
const git = (...args: string[]) => run("git", args, { GIT_SSH_COMMAND: sshCommand });

function createKey() {
  mkdirSync(sshDir, { recursive: true });
  const comment = `vetdent-light deploy ${hostname()} ${new Date().toISOString().slice(0, 10)}`;
  execFileSync("ssh-keygen", ["-t", "ed25519", "-N", "", "-C", comment, "-f", keyPath], { stdio: "ignore" });
  console.log(`Created a new key for this device: ${keyPath}`);
}

async function trustGitHubHostKeys() {
  const known = join(sshDir, "known_hosts");
  if (existsSync(known) && run("ssh-keygen", ["-F", "github.com", "-f", known]).ok) return;
  const meta = (await (await fetch("https://api.github.com/meta")).json()) as { ssh_keys?: string[] };
  if (!meta.ssh_keys?.length) throw new Error("Could not read GitHub's SSH host keys from api.github.com/meta");
  mkdirSync(sshDir, { recursive: true });
  appendFileSync(known, meta.ssh_keys.map((key) => `github.com ${key}`).join("\n") + "\n");
  console.log("Added GitHub's official SSH host keys to ~/.ssh/known_hosts.");
}

function canRead() {
  return git("ls-remote", "origin", "HEAD").ok;
}

/** A dry-run push to a branch that does not exist: GitHub checks the write permission, nothing is sent. */
function canWrite() {
  const result = git("push", "--dry-run", "--porcelain", "origin", "HEAD:refs/heads/deploy-key-check");
  return result.ok;
}

function ghSignedIn() {
  return run("gh", ["auth", "status"]).ok;
}

async function main() {
  if (!existsSync(join(root, ".git"))) {
    throw new Error("This folder is not a Git clone (a ZIP download cannot sync). Clone the repository: see docs/TOBB_ESZKOZ.md");
  }

  if (!existsSync(keyPath)) {
    if (checkOnly) throw new Error(`No deploy key on this device (${keyPath}). Run npm run setup:deploy-key`);
    createKey();
  } else {
    console.log(`Deploy key of this device: ${keyPath}`);
  }

  if (!checkOnly) {
    await trustGitHubHostKeys();
    run("git", ["config", "core.sshCommand", sshCommand]);
    const remote = run("git", ["remote", "get-url", "origin"]).out;
    if (remote !== SSH_REMOTE) {
      run("git", ["remote", "set-url", "origin", SSH_REMOTE]);
      console.log(`The remote now uses SSH: ${SSH_REMOTE}`);
    }
  }

  if (!canRead()) {
    if (checkOnly) throw new Error("The key cannot reach the repository: it is not added on GitHub yet, or the network blocks SSH.");
    const publicKey = readFileSync(`${keyPath}.pub`, "utf8").trim();
    if (ghSignedIn() && (await askLine("The GitHub CLI is signed in. Add this key to the repository with it? (Y/n) ")).toLowerCase() !== "n") {
      const added = run("gh", ["repo", "deploy-key", "add", `${keyPath}.pub`, "--repo", REPO, "--allow-write", "--title", `vetdent-light ${hostname()}`]);
      console.log(added.ok ? "Added on GitHub." : `The GitHub CLI could not add it: ${added.out}`);
    } else {
      console.log("\nAdd this public key on GitHub (it is safe to show; the private key stays on this device):\n");
      console.log(publicKey);
      console.log(`\n  1. Open https://github.com/${REPO}/settings/keys/new`);
      console.log(`  2. Title: vetdent-light ${hostname()}`);
      console.log("  3. Key: paste the line above");
      console.log('  4. Tick "Allow write access", then "Add key"\n');
      await askLine("Press Enter when it is added... ");
    }
    if (!canRead()) throw new Error("Still no access. Check that the key was added to this repository, then run this again.");
  }
  console.log("OK  read access to the repository");

  if (!canWrite()) {
    throw new Error(`The key can read but not write. On GitHub (https://github.com/${REPO}/settings/keys) delete it and add it again with "Allow write access" ticked.`);
  }
  console.log("OK  write access (push) to the repository");
  console.log("\nThis device is ready to pull and push. Next: npm run setup:check");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
