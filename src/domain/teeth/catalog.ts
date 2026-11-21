/**
 * Tooth catalogue (modified Triadan numbering) for the permanent dentition of dogs (42) and cats (30).
 * Data, not UI: names are message keys, drawings are picked by `shape`.
 * Root counts drive the furcation rule and still need veterinary sign-off (docs/SZAKMAI_ELLENORZES.md).
 */

export type Species = "dog" | "cat";
export type ToothKind = "incisor" | "canine" | "premolar" | "molar";
/** Outline used for the drawing, in the style of the sample charts. */
export type ToothShape = "incisor" | "canine" | "twoRoot" | "threeRoot" | "roundTwoRoot" | "wideTwoRoot";
export type Arch = "upper" | "lower";
export type Side = "right" | "left";

export type Tooth = {
  /** Triadan number, e.g. "108". */
  code: string;
  /** 1 = upper right, 2 = upper left, 3 = lower left, 4 = lower right (the patient's sides). */
  quadrant: 1 | 2 | 3 | 4;
  arch: Arch;
  side: Side;
  kind: ToothKind;
  /** Index within its kind: I1–I3, PM1–PM4, M1–M3 (1 for canines). */
  index: number;
  roots: 1 | 2 | 3;
  shape: ToothShape;
  /** Relative drawing width (1 = widest). */
  width: number;
};

type Spec = [position: number, kind: ToothKind, index: number, roots: 1 | 2 | 3, shape: ToothShape, width: number];

const DOG_UPPER: Spec[] = [
  [1, "incisor", 1, 1, "incisor", 0.5],
  [2, "incisor", 2, 1, "incisor", 0.5],
  [3, "incisor", 3, 1, "incisor", 0.6],
  [4, "canine", 1, 1, "canine", 0.75],
  [5, "premolar", 1, 1, "twoRoot", 0.6],
  [6, "premolar", 2, 2, "twoRoot", 0.8],
  [7, "premolar", 3, 2, "twoRoot", 0.9],
  [8, "premolar", 4, 3, "threeRoot", 1],
  [9, "molar", 1, 3, "threeRoot", 1],
  [10, "molar", 2, 3, "threeRoot", 0.8],
];
const DOG_LOWER: Spec[] = [
  [1, "incisor", 1, 1, "incisor", 0.5],
  [2, "incisor", 2, 1, "incisor", 0.5],
  [3, "incisor", 3, 1, "incisor", 0.6],
  [4, "canine", 1, 1, "canine", 0.75],
  [5, "premolar", 1, 1, "twoRoot", 0.65],
  [6, "premolar", 2, 2, "twoRoot", 0.75],
  [7, "premolar", 3, 2, "twoRoot", 0.8],
  [8, "premolar", 4, 2, "twoRoot", 0.9],
  [9, "molar", 1, 2, "wideTwoRoot", 1],
  [10, "molar", 2, 2, "roundTwoRoot", 0.85],
  [11, "molar", 3, 1, "roundTwoRoot", 0.7],
];
// Cats have no 105/205, 110/210 above and no 305/306, 310/311 (and the mirrored 4xx) below.
const CAT_UPPER: Spec[] = [
  [1, "incisor", 1, 1, "incisor", 0.5],
  [2, "incisor", 2, 1, "incisor", 0.5],
  [3, "incisor", 3, 1, "incisor", 0.6],
  [4, "canine", 1, 1, "canine", 0.75],
  [6, "premolar", 2, 1, "twoRoot", 0.6],
  [7, "premolar", 3, 2, "twoRoot", 0.85],
  [8, "premolar", 4, 3, "threeRoot", 1],
  [9, "molar", 1, 2, "twoRoot", 0.6],
];
const CAT_LOWER: Spec[] = [
  [1, "incisor", 1, 1, "incisor", 0.5],
  [2, "incisor", 2, 1, "incisor", 0.5],
  [3, "incisor", 3, 1, "incisor", 0.6],
  [4, "canine", 1, 1, "canine", 0.75],
  [7, "premolar", 3, 2, "twoRoot", 0.8],
  [8, "premolar", 4, 2, "twoRoot", 0.85],
  [9, "molar", 1, 2, "wideTwoRoot", 1],
];

function build(quadrant: 1 | 2 | 3 | 4, specs: Spec[]): Tooth[] {
  return specs.map(([position, kind, index, roots, shape, width]) => ({
    code: `${quadrant}${String(position).padStart(2, "0")}`,
    quadrant,
    arch: quadrant <= 2 ? "upper" : "lower",
    side: quadrant === 1 || quadrant === 4 ? "right" : "left",
    kind,
    index,
    roots,
    shape,
    width,
  }));
}

function catalogFor(upper: Spec[], lower: Spec[]): Tooth[] {
  return [...build(1, upper), ...build(2, upper), ...build(3, lower), ...build(4, lower)];
}

const CATALOG: Record<Species, Tooth[]> = {
  dog: catalogFor(DOG_UPPER, DOG_LOWER),
  cat: catalogFor(CAT_UPPER, CAT_LOWER),
};

const BY_CODE: Record<Species, Map<string, Tooth>> = {
  dog: new Map(CATALOG.dog.map((tooth) => [tooth.code, tooth])),
  cat: new Map(CATALOG.cat.map((tooth) => [tooth.code, tooth])),
};

export function teethOf(species: Species): Tooth[] {
  return CATALOG[species];
}

export function toothOf(species: Species, code: string): Tooth | undefined {
  return BY_CODE[species].get(code);
}

/**
 * Screen order of one arch, left to right. The patient's right side is on the left half of the screen:
 * upper 110 → 101 | 201 → 210, lower 411 → 401 | 301 → 311 (cats skip the missing positions).
 */
export function archRow(species: Species, arch: Arch): { right: Tooth[]; left: Tooth[] } {
  const quadrants = arch === "upper" ? ([1, 2] as const) : ([4, 3] as const);
  const of = (quadrant: number) => CATALOG[species].filter((tooth) => tooth.quadrant === quadrant);
  return { right: [...of(quadrants[0])].reverse(), left: of(quadrants[1]) };
}

/** All teeth in screen reading order (upper row, then lower row); used for previous/next stepping. */
export function screenOrder(species: Species): Tooth[] {
  const upper = archRow(species, "upper");
  const lower = archRow(species, "lower");
  return [...upper.right, ...upper.left, ...lower.right, ...lower.left];
}
