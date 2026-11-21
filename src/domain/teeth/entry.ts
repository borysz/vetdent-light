/**
 * One tooth's record and the rules for changing it. Pure functions: the UI and the API both use them.
 * The rules (all pending veterinary review): "0" (healthy) excludes pathology; grades of one group exclude
 * each other; TR only for cats; furcation only on multi-rooted teeth; a missing tooth takes no other
 * finding and no treatment except a radiograph; the two extraction types exclude each other.
 */
import { toothOf, type Species, type Tooth } from "./catalog";
import { EXTRACTIONS, FINDING_BY_CODE, isTreatment, type PocketSite } from "./codes";

export type ToothEntry = {
  codes: string[];
  treatments: string[];
  pocketMm: Record<PocketSite, number | null>;
  note: string;
};

export function emptyEntry(): ToothEntry {
  return { codes: [], treatments: [], pocketMm: { mesial: null, buccal: null, distal: null, palatolingual: null }, note: "" };
}

export function isEmptyEntry(entry: ToothEntry): boolean {
  return (
    entry.codes.length === 0 &&
    entry.treatments.length === 0 &&
    entry.note.trim() === "" &&
    Object.values(entry.pocketMm).every((value) => value === null)
  );
}

export const isMissing = (entry: ToothEntry | undefined): boolean => Boolean(entry?.codes.includes("M"));

/** Why a finding cannot be set on this tooth, or null when it can. */
export function findingBlocked(code: string, tooth: Tooth, species: Species, entry: ToothEntry): "cat_only" | "single_root" | "missing" | "unknown" | null {
  const finding = FINDING_BY_CODE.get(code);
  if (!finding) return "unknown";
  if (finding.group === "resorption" && species !== "cat") return "cat_only";
  if (finding.group === "furcation" && tooth.roots < 2) return "single_root";
  if (isMissing(entry) && code !== "M") return "missing";
  return null;
}

/** Why a treatment cannot be set on this tooth, or null when it can. */
export function treatmentBlocked(code: string, entry: ToothEntry): "missing" | "unknown" | null {
  if (!isTreatment(code)) return "unknown";
  if (isMissing(entry) && code !== "RX") return "missing";
  return null;
}

/** Add a finding (removing what it excludes); a blocked code leaves the entry unchanged. */
export function addFinding(entry: ToothEntry, code: string, tooth: Tooth, species: Species): ToothEntry {
  if (findingBlocked(code, tooth, species, entry) || entry.codes.includes(code)) return entry;
  const finding = FINDING_BY_CODE.get(code)!;
  if (finding.group === "healthy") return { ...entry, codes: ["0"] };
  if (finding.group === "missing") return { ...entry, codes: ["M"], treatments: entry.treatments.filter((t) => t === "RX") };
  const kept = entry.codes.filter((existing) => {
    const other = FINDING_BY_CODE.get(existing);
    if (!other || other.group === "healthy") return false;
    // Graded groups hold one grade at a time.
    return !(finding.grade !== undefined && other.group === finding.group);
  });
  return { ...entry, codes: [...kept, code] };
}

export function removeFinding(entry: ToothEntry, code: string): ToothEntry {
  return entry.codes.includes(code) ? { ...entry, codes: entry.codes.filter((c) => c !== code) } : entry;
}

export function toggleFinding(entry: ToothEntry, code: string, tooth: Tooth, species: Species): ToothEntry {
  return entry.codes.includes(code) ? removeFinding(entry, code) : addFinding(entry, code, tooth, species);
}

export function addTreatment(entry: ToothEntry, code: string): ToothEntry {
  if (treatmentBlocked(code, entry) || entry.treatments.includes(code)) return entry;
  const kept = EXTRACTIONS.includes(code) ? entry.treatments.filter((t) => !EXTRACTIONS.includes(t)) : entry.treatments;
  return { ...entry, treatments: [...kept, code] };
}

export function removeTreatment(entry: ToothEntry, code: string): ToothEntry {
  return entry.treatments.includes(code) ? { ...entry, treatments: entry.treatments.filter((t) => t !== code) } : entry;
}

export function toggleTreatment(entry: ToothEntry, code: string): ToothEntry {
  return entry.treatments.includes(code) ? removeTreatment(entry, code) : addTreatment(entry, code);
}

export function setPocket(entry: ToothEntry, site: PocketSite, value: number | null): ToothEntry {
  return { ...entry, pocketMm: { ...entry.pocketMm, [site]: value } };
}

export function setAllPockets(entry: ToothEntry, value: number | null): ToothEntry {
  return { ...entry, pocketMm: { mesial: value, buccal: value, distal: value, palatolingual: value } };
}

/** Back to a healthy tooth: status 0, nothing else. */
export function resetToHealthy(): ToothEntry {
  return { ...emptyEntry(), codes: ["0"] };
}

export type TeethRecord = Record<string, ToothEntry>;

/** Apply a change to several teeth; entries that end up empty are dropped so an untouched sheet stays clean. */
export function updateTeeth(teeth: TeethRecord, codes: Iterable<string>, change: (entry: ToothEntry, code: string) => ToothEntry): TeethRecord {
  const next: TeethRecord = { ...teeth };
  for (const code of codes) {
    const updated = change(teeth[code] ?? emptyEntry(), code);
    if (isEmptyEntry(updated)) delete next[code];
    else next[code] = updated;
  }
  return next;
}

/** Problems that make a stored teeth record invalid for a species (used by the API). */
export function validateTeeth(species: Species, teeth: TeethRecord): string[] {
  const problems: string[] = [];
  for (const [code, entry] of Object.entries(teeth)) {
    const tooth = toothOf(species, code);
    if (!tooth) {
      problems.push(`${code}: not a ${species} tooth`);
      continue;
    }
    // Replaying the findings through the rules must reproduce them: anything blocked or excluded is a conflict.
    let replay = emptyEntry();
    let accepted = 0;
    for (const finding of entry.codes) {
      const blocked = findingBlocked(finding, tooth, species, replay);
      if (blocked) {
        problems.push(`${code}: ${finding} (${blocked})`);
      } else {
        replay = addFinding(replay, finding, tooth, species);
        accepted += 1;
      }
    }
    if (replay.codes.length !== accepted) problems.push(`${code}: conflicting findings`);
    for (const treatment of entry.treatments) {
      const blocked = treatmentBlocked(treatment, entry);
      if (blocked) problems.push(`${code}: ${treatment} (${blocked})`);
    }
    if (entry.treatments.filter((t) => EXTRACTIONS.includes(t)).length > 1) problems.push(`${code}: two extraction types`);
  }
  return problems;
}

/** Keep what still applies after switching species: teeth that exist there, findings that are allowed there. */
export function adaptTeethToSpecies(teeth: TeethRecord, species: Species): TeethRecord {
  const next: TeethRecord = {};
  for (const [code, entry] of Object.entries(teeth)) {
    const tooth = toothOf(species, code);
    if (!tooth) continue;
    let replay: ToothEntry = { ...entry, codes: [] };
    for (const finding of entry.codes) replay = addFinding(replay, finding, tooth, species);
    if (!isEmptyEntry(replay)) next[code] = replay;
  }
  return next;
}
