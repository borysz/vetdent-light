import { describe, expect, it } from "vitest";
import { demoContent, loadDemoData } from "../scripts/lib/demo";
import { viewOf } from "@/domain/teeth/derive";
import { validateTeeth, type TeethRecord } from "@/domain/teeth/entry";

const [max, mici] = loadDemoData().animals;

describe("demo data (the two examples of the sample sheets)", () => {
  it("uses neutral example addresses only", () => {
    for (const animal of [max, mici]) expect(animal.owner.email.endsWith("@example.com")).toBe(true);
    expect(loadDemoData().clinic.email.endsWith("@example.com")).toBe(true);
  });

  it("gives Max a full 42-tooth dog chart that follows the rules and the sample", () => {
    const content = demoContent(max);
    const teeth = content.teeth as TeethRecord;
    expect(max.species).toBe("dog");
    expect(Object.keys(teeth)).toHaveLength(42);
    expect(validateTeeth("dog", teeth)).toEqual([]);
    expect(viewOf(teeth["108"])).toMatchObject({ cross: "extraction", ring: true });
    expect(viewOf(teeth["108"]).chips.map((chip) => chip.label)).toEqual(["FX-C", "PE", "PD2", "RX", "X-S"]);
    expect(viewOf(teeth["104"])).toMatchObject({ calculus: 2, gingivitis: 2 });
    expect(viewOf(teeth["204"])).toMatchObject({ calculus: 2, gingivitis: 1 });
    expect(viewOf(teeth["409"])).toMatchObject({ calculus: 2, ring: true });
    expect(viewOf(teeth["308"]).cross).toBe("missing");
    expect(teeth["110"].treatments).toEqual(["U", "POL"]);
    expect(content.periodontal.stage).toBe("2");
    expect(content.medications).toHaveLength(3);
  });

  it("gives Mici a 30-tooth cat chart with tooth resorption, which only cats may have", () => {
    const teeth = demoContent(mici).teeth as TeethRecord;
    expect(mici.species).toBe("cat");
    expect(Object.keys(teeth)).toHaveLength(30);
    expect(validateTeeth("cat", teeth)).toEqual([]);
    expect(viewOf(teeth["307"])).toMatchObject({ gingivitis: 3, mobility: 2, cross: "extraction" });
    expect(viewOf(teeth["407"]).chips.map((chip) => chip.label)).toEqual(["TR2", "RX", "X-S"]);
    expect(demoContent(mici).periodontal.stomatitis).not.toBe("");
  });
});
