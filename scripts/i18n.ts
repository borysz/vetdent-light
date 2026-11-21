/**
 * i18n catalogue + terminology review manifest tool (see docs/I18N.md).
 *
 *   tsx scripts/i18n.ts check   fail on missing/stale/unsynced keys, list `pending` texts
 *   tsx scripts/i18n.ts sync    add new keys as `pending`, reset changed `approved` texts to `pending`
 *
 * Only a veterinarian may set a manifest entry to `approved` (edit the JSON by hand);
 * this tool never does.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { defaultLocale, locales } from "../src/i18n/config";

type Json = string | { [key: string]: Json };
type ReviewEntry = {
  status: "pending" | "approved";
  reviewer: string | null;
  reviewedAt: string | null;
  note: string;
  textHash: string;
};
type Manifest = Record<string, ReviewEntry>;

const root = join(__dirname, "..");
const catalogPath = (l: string) => join(root, "messages", `${l}.json`);
const manifestPath = (l: string) => join(root, "messages", "review", `${l}.json`);

const hash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

function flatten(node: Json, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function writeManifest(locale: string, manifest: Manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(manifestPath(locale)), { recursive: true });
  writeFileSync(manifestPath(locale), JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

const command = process.argv[2];
const errors: string[] = [];
const warnings: string[] = [];
const reference = flatten(readJson<Json>(catalogPath(defaultLocale), {}));

for (const locale of locales) {
  if (!existsSync(catalogPath(locale))) {
    errors.push(`[${locale}] missing catalogue messages/${locale}.json`);
    continue;
  }
  const catalog = flatten(readJson<Json>(catalogPath(locale), {}));
  const manifest = readJson<Manifest>(manifestPath(locale), {});

  if (command === "sync") {
    for (const [key, text] of Object.entries(catalog)) {
      const entry = manifest[key];
      if (!entry) {
        manifest[key] = { status: "pending", reviewer: null, reviewedAt: null, note: "", textHash: hash(text) };
      } else if (entry.textHash !== hash(text)) {
        manifest[key] = { ...entry, status: "pending", textHash: hash(text) };
      }
    }
    for (const key of Object.keys(manifest)) if (!(key in catalog)) delete manifest[key];
    writeManifest(locale, manifest);
    console.log(`[${locale}] synced: ${Object.keys(catalog).length} keys`);
    continue;
  }

  for (const key of Object.keys(reference)) {
    if (!(key in catalog)) errors.push(`[${locale}] key missing from catalogue: ${key}`);
  }
  for (const [key, text] of Object.entries(catalog)) {
    if (!(key in reference)) errors.push(`[${locale}] key not in reference catalogue (${defaultLocale}): ${key}`);
    const entry = manifest[key];
    if (!entry) {
      errors.push(`[${locale}] key missing from review manifest (run npm run i18n:sync): ${key}`);
      continue;
    }
    if (entry.textHash !== hash(text)) {
      errors.push(`[${locale}] text changed since last sync (run npm run i18n:sync): ${key}`);
    } else if (entry.status === "approved") {
      if (!entry.reviewer || !entry.reviewedAt) errors.push(`[${locale}] approved without reviewer/date: ${key}`);
    } else {
      warnings.push(`[${locale}] pending review: ${key} = "${text}"`);
    }
  }
  for (const key of Object.keys(manifest)) {
    if (!(key in catalog)) errors.push(`[${locale}] stale manifest entry (run npm run i18n:sync): ${key}`);
  }
}

if (command === "check") {
  const pending = warnings.length;
  if (pending > 0) {
    console.warn(`${pending} text(s) pending veterinary terminology review (see docs/I18N.md):`);
    for (const w of warnings.slice(0, 20)) console.warn("  " + w);
    if (pending > 20) console.warn(`  ... and ${pending - 20} more`);
  }
  if (errors.length > 0) {
    console.error(`\ni18n check failed:`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log(`i18n check OK (${locales.join(", ")}; ${pending} pending review)`);
} else if (command !== "sync") {
  console.error("usage: tsx scripts/i18n.ts <check|sync>");
  process.exit(2);
}
