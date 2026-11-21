/**
 * Finding and treatment codes as they appear on the sample sheets. Only codes: their names are UI
 * messages (messages/<locale>.json, codes.* and treatments.*) and need veterinary review.
 */

export type FindingGroup = "healthy" | "calculus" | "gingivitis" | "periodontitis" | "mobility" | "furcation" | "fracture" | "resorption" | "missing" | "other";

export type Finding = { code: string; group: FindingGroup; grade?: number };

const graded = (prefix: string, group: FindingGroup, max: number): Finding[] =>
  Array.from({ length: max }, (_, i) => ({ code: `${prefix}${i + 1}`, group, grade: i + 1 }));

/** In the order of the tooth editor on the sample sheet. */
export const FINDINGS: Finding[] = [
  { code: "0", group: "healthy" },
  ...graded("T", "calculus", 3),
  ...graded("G", "gingivitis", 3),
  ...graded("PD", "periodontitis", 4),
  ...graded("Mob", "mobility", 3),
  ...graded("Fur", "furcation", 3),
  { code: "FX-C", group: "fracture" },
  { code: "FX-CR", group: "fracture" },
  { code: "PE", group: "fracture" },
  { code: "UCF", group: "fracture" },
  ...graded("TR", "resorption", 5),
  { code: "M", group: "missing" },
  // "U" appears among the status codes on the sample; its meaning there is not confirmed (see SZAKMAI_ELLENORZES).
  { code: "U", group: "other" },
];

export const FINDING_BY_CODE = new Map(FINDINGS.map((finding) => [finding.code, finding]));

export const TREATMENTS = ["U", "POL", "CURE", "EXT-S", "EXT-SURG", "RX", "ENDO", "FLAP", "BIO"] as const;
export type Treatment = (typeof TREATMENTS)[number];

/** Short form shown in the chart's "other" cell: extractions are X (simple) and X-S (surgical). */
export const TREATMENT_CHART_LABEL: Record<Treatment, string> = {
  U: "U",
  POL: "POL",
  CURE: "CURE",
  "EXT-S": "X",
  "EXT-SURG": "X-S",
  RX: "RX",
  ENDO: "ENDO",
  FLAP: "FLAP",
  BIO: "BIO",
};

export const EXTRACTIONS: readonly string[] = ["EXT-S", "EXT-SURG"];
export const isTreatment = (code: string): code is Treatment => (TREATMENTS as readonly string[]).includes(code);

export const COMPLAINTS = [
  "halitosis",
  "calculus",
  "pain_chewing",
  "hypersalivation",
  "feeding_difficulty",
  "broken_tooth",
  "gum_bleeding",
  "face_rubbing",
] as const;
export type Complaint = (typeof COMPLAINTS)[number];

/** Pocket depth at or above this (mm) is highlighted as a periodontal pocket. */
export const POCKET_ALERT_MM = 4;
export const POCKET_QUICK_VALUES = [1, 2, 3, 4, 5, 6, 8] as const;
export const POCKET_SITES = ["mesial", "buccal", "distal", "palatolingual"] as const;
export type PocketSite = (typeof POCKET_SITES)[number];
