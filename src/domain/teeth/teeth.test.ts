import { describe, expect, it } from "vitest";
import { archRow, screenOrder, teethOf, toothOf } from "./catalog";
import { packChips, viewOf } from "./derive";
import {
  addFinding,
  addTreatment,
  emptyEntry,
  findingBlocked,
  resetToHealthy,
  setAllPockets,
  toggleFinding,
  toggleTreatment,
  treatmentBlocked,
  updateTeeth,
  validateTeeth,
  type ToothEntry,
} from "./entry";

const codes = (teeth: { code: string }[]) => teeth.map((tooth) => tooth.code).join(" ");
const dog = (code: string) => toothOf("dog", code)!;
const cat = (code: string) => toothOf("cat", code)!;
const entry = (over: Partial<ToothEntry> = {}): ToothEntry => ({ ...emptyEntry(), ...over });

describe("catalogue", () => {
  it("has 42 dog teeth and 30 cat teeth", () => {
    expect(teethOf("dog")).toHaveLength(42);
    expect(teethOf("cat")).toHaveLength(30);
  });

  it("orders the dog chart with the patient's right side on the left of the screen", () => {
    const upper = archRow("dog", "upper");
    expect(codes(upper.right)).toBe("110 109 108 107 106 105 104 103 102 101");
    expect(codes(upper.left)).toBe("201 202 203 204 205 206 207 208 209 210");
    const lower = archRow("dog", "lower");
    expect(codes(lower.right)).toBe("411 410 409 408 407 406 405 404 403 402 401");
    expect(codes(lower.left)).toBe("301 302 303 304 305 306 307 308 309 310 311");
  });

  it("orders the cat chart and skips the teeth cats do not have", () => {
    const upper = archRow("cat", "upper");
    expect(codes(upper.right)).toBe("109 108 107 106 104 103 102 101");
    expect(codes(upper.left)).toBe("201 202 203 204 206 207 208 209");
    const lower = archRow("cat", "lower");
    expect(codes(lower.right)).toBe("409 408 407 404 403 402 401");
    expect(codes(lower.left)).toBe("301 302 303 304 307 308 309");
    expect(toothOf("cat", "105")).toBeUndefined();
    expect(toothOf("cat", "310")).toBeUndefined();
  });

  it("maps quadrants to arch and side: 100 upper right, 200 upper left, 300 lower left, 400 lower right", () => {
    expect(dog("108")).toMatchObject({ quadrant: 1, arch: "upper", side: "right", kind: "premolar", index: 4 });
    expect(dog("204")).toMatchObject({ quadrant: 2, arch: "upper", side: "left", kind: "canine" });
    expect(dog("311")).toMatchObject({ quadrant: 3, arch: "lower", side: "left", kind: "molar", index: 3 });
    expect(dog("401")).toMatchObject({ quadrant: 4, arch: "lower", side: "right", kind: "incisor", index: 1 });
    expect(cat("307")).toMatchObject({ kind: "premolar", index: 3 });
  });

  it("lists every tooth once in screen order", () => {
    expect(new Set(screenOrder("dog").map((t) => t.code)).size).toBe(42);
    expect(screenOrder("cat")[0].code).toBe("109");
  });
});

describe("finding rules", () => {
  it("keeps one grade per group", () => {
    let e = addFinding(emptyEntry(), "T1", dog("104"), "dog");
    e = addFinding(e, "T3", dog("104"), "dog");
    e = addFinding(e, "G2", dog("104"), "dog");
    expect(e.codes).toEqual(["T3", "G2"]);
  });

  it("makes healthy (0) and pathology exclude each other", () => {
    let e = addFinding(emptyEntry(), "0", dog("104"), "dog");
    e = addFinding(e, "PD2", dog("104"), "dog");
    expect(e.codes).toEqual(["PD2"]);
    expect(addFinding(e, "0", dog("104"), "dog").codes).toEqual(["0"]);
  });

  it("allows tooth resorption (TR) only for cats", () => {
    expect(findingBlocked("TR2", dog("407"), "dog", emptyEntry())).toBe("cat_only");
    expect(addFinding(emptyEntry(), "TR2", dog("407"), "dog").codes).toEqual([]);
    expect(addFinding(emptyEntry(), "TR2", cat("407"), "cat").codes).toEqual(["TR2"]);
  });

  it("allows furcation only on multi-rooted teeth", () => {
    expect(findingBlocked("Fur1", dog("104"), "dog", emptyEntry())).toBe("single_root");
    expect(findingBlocked("Fur1", dog("409"), "dog", emptyEntry())).toBeNull();
  });

  it("lets a missing tooth take no other finding and only a radiograph as treatment", () => {
    const withTreatments = entry({ codes: ["T2"], treatments: ["U", "POL", "RX"] });
    const missing = addFinding(withTreatments, "M", dog("308"), "dog");
    expect(missing.codes).toEqual(["M"]);
    expect(missing.treatments).toEqual(["RX"]);
    expect(findingBlocked("T1", dog("308"), "dog", missing)).toBe("missing");
    expect(treatmentBlocked("U", missing)).toBe("missing");
    expect(treatmentBlocked("RX", missing)).toBeNull();
    expect(addTreatment(missing, "POL").treatments).toEqual(["RX"]);
  });

  it("toggles findings and treatments, and keeps one extraction type", () => {
    let e = toggleFinding(emptyEntry(), "FX-C", dog("108"), "dog");
    e = toggleFinding(e, "FX-C", dog("108"), "dog");
    expect(e.codes).toEqual([]);
    e = toggleTreatment(e, "EXT-S");
    e = toggleTreatment(e, "EXT-SURG");
    expect(e.treatments).toEqual(["EXT-SURG"]);
  });

  it("drops entries that become empty and resets to healthy", () => {
    const teeth = updateTeeth({}, ["101", "102"], (e) => addTreatment(e, "U"));
    expect(Object.keys(teeth)).toEqual(["101", "102"]);
    const cleared = updateTeeth(teeth, ["101"], (e) => toggleTreatment(e, "U"));
    expect(Object.keys(cleared)).toEqual(["102"]);
    expect(resetToHealthy().codes).toEqual(["0"]);
    expect(setAllPockets(emptyEntry(), 4).pocketMm).toEqual({ mesial: 4, buccal: 4, distal: 4, palatolingual: 4 });
  });

  it("validates a stored record against the species", () => {
    expect(validateTeeth("dog", { "108": entry({ codes: ["FX-C", "PE", "PD2"], treatments: ["RX", "EXT-SURG"] }) })).toEqual([]);
    expect(validateTeeth("cat", { "105": entry({ codes: ["T1"] }) })[0]).toContain("not a cat tooth");
    expect(validateTeeth("dog", { "407": entry({ codes: ["TR1"] }) })[0]).toContain("cat_only");
    expect(validateTeeth("dog", { "104": entry({ codes: ["T1", "T2"] }) })[0]).toContain("conflicting");
    expect(validateTeeth("dog", { "104": entry({ codes: ["0", "PD1"] }) })[0]).toContain("conflicting");
    expect(validateTeeth("dog", { "104": entry({ treatments: ["EXT-S", "EXT-SURG"] }) })[0]).toContain("two extraction");
    expect(validateTeeth("dog", { "104": entry({ treatments: ["NOPE"] }) })[0]).toContain("unknown");
  });
});

describe("chart view", () => {
  it("derives the sample dog tooth 108: findings, treatments, extraction", () => {
    const view = viewOf(entry({ codes: ["FX-C", "PE", "PD2"], treatments: ["RX", "EXT-SURG"] }));
    expect(view.chips.map((c) => c.label)).toEqual(["FX-C", "PE", "PD2", "RX", "X-S"]);
    expect(view.chips.map((c) => c.kind)).toEqual(["pathology", "pathology", "pathology", "treatment", "extraction"]);
    expect(view).toMatchObject({ cross: "extraction", fill: "extraction", ring: true, cellTone: "extraction" });
  });

  it("puts calculus, gingivitis and mobility grades in the index rows, not in the other cell", () => {
    const view = viewOf(entry({ codes: ["T2", "G2", "PD1", "Mob1"], treatments: ["U", "POL"] }));
    expect(view).toMatchObject({ calculus: 2, gingivitis: 2, mobility: 1, fill: "calculus", ring: false, cellTone: "pathology" });
    expect(view.chips.map((c) => c.label)).toEqual(["PD1", "U", "POL"]);
  });

  it("marks a missing tooth with a grey cross and a ring only for special treatments", () => {
    expect(viewOf(entry({ codes: ["M"] }))).toMatchObject({ cross: "missing", fill: "missing", ring: false });
    expect(viewOf(entry({ codes: ["T2", "Fur1"], treatments: ["U", "POL", "CURE"] })).ring).toBe(true);
    expect(viewOf(entry({ codes: ["0"], treatments: ["U", "POL"] }))).toMatchObject({ ring: false, fill: "none", pathological: false, cellTone: "plain" });
    expect(viewOf(entry({ codes: ["TR2"] })).fill).toBe("fracture");
    expect(viewOf(undefined).chips).toEqual([]);
  });

  it("packs chips into lines and summarises what does not fit", () => {
    const chips = viewOf(entry({ codes: ["FX-C", "PE", "PD2"], treatments: ["RX", "EXT-SURG", "U", "POL"] })).chips;
    const wide = packChips(chips, 8, 6);
    expect(wide.hidden).toBe(0);
    expect(wide.lines.map((line) => line.map((c) => c.label).join(" "))).toEqual(["FX-C PE", "PD2 RX", "X-S U", "POL"]);
    const tight = packChips(chips, 8, 2);
    expect(tight.lines).toHaveLength(2);
    expect(tight.lines[1].map((c) => c.label)).toEqual(["PD2", "+4"]);
    expect(packChips([{ label: "U", kind: "treatment" }, { label: "POL", kind: "treatment" }], 4, 3).lines).toHaveLength(2);
  });
});
