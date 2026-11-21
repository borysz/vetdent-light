/** Pure helpers of the final report (A4 preview, print and PDF). */
import { teethOf, type Species, type Tooth } from "./teeth/catalog";
import type { PocketSite } from "./teeth/codes";
import { isEmptyEntry, type TeethRecord, type ToothEntry } from "./teeth/entry";
import { COMBINING_ACCENTS } from "./text";

/**
 * File name of the downloaded PDF: `fogaszati-lap_<animal name>_<date>.pdf`, ASCII only
 * (a name starting with an O with double acute becomes "o..."; accents are removed, anything else becomes a hyphen).
 */
export function pdfFileName(patientName: string, date: string): string {
  const slug = patientName
    .normalize("NFD")
    .replace(COMBINING_ACCENTS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `fogaszati-lap_${slug || "allat"}_${date}.pdf`;
}

const POCKET_LETTER: Record<PocketSite, string> = { mesial: "M", buccal: "B", distal: "D", palatolingual: "L" };

/** Pocket depths as "M:2 B:4 D:2 L:2"; sites without a value are left out, no value at all gives an empty string. */
export function pocketText(pocketMm: ToothEntry["pocketMm"]): string {
  return (Object.keys(POCKET_LETTER) as PocketSite[])
    .filter((site) => pocketMm[site] !== null)
    .map((site) => `${POCKET_LETTER[site]}:${String(pocketMm[site]).replace(".", ",")}`)
    .join(" ");
}

/** Teeth that have a finding, a treatment, a pocket depth or a note, in ascending Triadan order. */
export function affectedTeeth(species: Species, teeth: TeethRecord): { tooth: Tooth; entry: ToothEntry }[] {
  const known = new Map(teethOf(species).map((tooth) => [tooth.code, tooth]));
  return Object.entries(teeth)
    .filter(([code, entry]) => known.has(code) && !isEmptyEntry(entry))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([code, entry]) => ({ tooth: known.get(code)!, entry }));
}

/** True when a required advice field of the home-care tab is empty (the PDF then warns, but is still made). */
export function missingAdvice(homecare: { feeding: string; chewingRestrictions: string }): boolean {
  return homecare.feeding.trim() === "" || homecare.chewingRestrictions.trim() === "";
}
