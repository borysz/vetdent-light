/**
 * What the chart shows for a tooth, derived from its record (pending veterinary review):
 * - index rows: the grade of the T (calculus), G (gingivitis) and Mob (mobility) code;
 * - "other" cell: the remaining findings, then the treatments (X / X-S for extractions);
 * - drawing marks: red X = extraction, grey X = missing, blue ring = radiograph or special treatment,
 *   orange fill = calculus or gingivitis, purple = fracture or tooth resorption.
 */
import { EXTRACTIONS, FINDING_BY_CODE, isTreatment, TREATMENT_CHART_LABEL } from "./codes";
import type { ToothEntry } from "./entry";

export type ChipKind = "pathology" | "treatment" | "extraction";
export type Chip = { label: string; kind: ChipKind };
export type ToothFill = "none" | "calculus" | "fracture" | "extraction" | "missing";

export type ToothView = {
  calculus: number | null;
  gingivitis: number | null;
  mobility: number | null;
  chips: Chip[];
  fill: ToothFill;
  cross: "none" | "extraction" | "missing";
  ring: boolean;
  /** Tint of the "other" cell. */
  cellTone: "plain" | "pathology" | "extraction";
  /** Has any finding other than "0" (used by the "pathological teeth" selection). */
  pathological: boolean;
};

/** Treatments marked with the blue ring: radiograph and everything beyond routine scaling and polishing. */
const RING_TREATMENTS = new Set(["RX", "CURE", "ENDO", "FLAP", "BIO"]);
const INDEX_GROUPS = new Set(["calculus", "gingivitis", "mobility"]);

const EMPTY_VIEW: ToothView = {
  calculus: null,
  gingivitis: null,
  mobility: null,
  chips: [],
  fill: "none",
  cross: "none",
  ring: false,
  cellTone: "plain",
  pathological: false,
};

export function viewOf(entry: ToothEntry | undefined): ToothView {
  if (!entry) return EMPTY_VIEW;
  const gradeOf = (group: string) =>
    entry.codes.map((code) => FINDING_BY_CODE.get(code)).find((finding) => finding?.group === group)?.grade ?? null;

  const groups = new Set(entry.codes.map((code) => FINDING_BY_CODE.get(code)?.group));
  const extracted = entry.treatments.some((t) => EXTRACTIONS.includes(t));
  const missing = groups.has("missing");

  const chips: Chip[] = [
    ...entry.codes
      .filter((code) => {
        const group = FINDING_BY_CODE.get(code)?.group;
        return group !== undefined && group !== "healthy" && !INDEX_GROUPS.has(group);
      })
      .map((code): Chip => ({ label: code, kind: "pathology" })),
    ...entry.treatments.filter(isTreatment).map(
      (code): Chip => ({ label: TREATMENT_CHART_LABEL[code], kind: EXTRACTIONS.includes(code) ? "extraction" : "treatment" }),
    ),
  ];

  let fill: ToothFill = "none";
  if (missing) fill = "missing";
  else if (extracted) fill = "extraction";
  else if (groups.has("fracture") || groups.has("resorption")) fill = "fracture";
  else if (groups.has("calculus") || groups.has("gingivitis")) fill = "calculus";

  return {
    calculus: gradeOf("calculus"),
    gingivitis: gradeOf("gingivitis"),
    mobility: gradeOf("mobility"),
    chips,
    fill,
    cross: missing ? "missing" : extracted ? "extraction" : "none",
    ring: entry.treatments.some((t) => RING_TREATMENTS.has(t)),
    cellTone: extracted ? "extraction" : chips.some((chip) => chip.kind === "pathology") ? "pathology" : "plain",
    pathological: entry.codes.some((code) => code !== "0"),
  };
}

/**
 * Lay chips out in lines of a cell `charsPerLine` characters wide (monospace), at most `maxLines` lines.
 * When they do not fit, the last place shows "+n" for the hidden ones, so the chart keeps its height.
 */
export function packChips(chips: Chip[], charsPerLine: number, maxLines: number): { lines: Chip[][]; hidden: number } {
  const CHIP_PADDING = 1; // chip padding and gap, in character widths
  const widthOf = (chip: Chip) => chip.label.length + CHIP_PADDING;
  const lines: Chip[][] = [];
  let used = 0;
  let placed = 0;
  for (const chip of chips) {
    const width = widthOf(chip);
    const current = lines[lines.length - 1];
    if (current && used + width <= charsPerLine) {
      current.push(chip);
      used += width;
    } else if (lines.length < maxLines) {
      lines.push([chip]);
      used = width;
    } else {
      break;
    }
    placed += 1;
  }
  let hidden = chips.length - placed;
  if (hidden > 0) {
    // Make room for the "+n" marker by dropping the last shown chip.
    const last = lines[lines.length - 1];
    last.pop();
    hidden += 1;
    last.push({ label: `+${hidden}`, kind: "pathology" });
  }
  return { lines, hidden };
}
