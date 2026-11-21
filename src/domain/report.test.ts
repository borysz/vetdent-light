import { describe, expect, it } from "vitest";

// Hungarian letters are built from code points, so the source code stays free of them.
const C = String.fromCharCode;
import { affectedTeeth, missingAdvice, pdfFileName, pocketText } from "./report";
import { emptyEntry, type ToothEntry } from "./teeth/entry";

const entry = (over: Partial<ToothEntry>): ToothEntry => ({ ...emptyEntry(), ...over });

describe("pdfFileName", () => {
  it("is ASCII only and keeps the date", () => {
    expect(pdfFileName("Max", "2026-11-21")).toBe("fogaszati-lap_max_2026-11-21.pdf");
    expect(pdfFileName(`${C(0x150)}zike ${C(0x170)}rhaj${C(0xf3)}s`, "2026-11-21")).toBe("fogaszati-lap_ozike-urhajos_2026-11-21.pdf");
    expect(pdfFileName(`${C(0xc1)}rv${C(0xed)}zt${C(0x171)}r${C(0x151)} t${C(0xfc)}k${C(0xf6)}rf${C(0xfa)}r${C(0xf3)}g${C(0xe9)}p`, "2026-01-02")).toBe("fogaszati-lap_arvizturo-tukorfurogep_2026-01-02.pdf");
  });

  it("never produces an empty or unsafe name part", () => {
    expect(pdfFileName("  ", "2026-11-21")).toBe("fogaszati-lap_allat_2026-11-21.pdf");
    expect(pdfFileName('../"x"; rm', "2026-11-21")).toBe("fogaszati-lap_x-rm_2026-11-21.pdf");
  });
});

describe("pocketText", () => {
  it("lists only the measured sites, with a decimal comma", () => {
    expect(pocketText({ mesial: 2, buccal: 4, distal: 2, palatolingual: 2 })).toBe("M:2 B:4 D:2 L:2");
    expect(pocketText({ mesial: null, buccal: 3.5, distal: null, palatolingual: null })).toBe("B:3,5");
    expect(pocketText(emptyEntry().pocketMm)).toBe("");
  });
});

describe("affectedTeeth", () => {
  it("returns only teeth with something recorded, in numeric order, and ignores teeth the species does not have", () => {
    const rows = affectedTeeth("cat", {
      "401": entry({ treatments: ["U"] }),
      "108": entry({ codes: ["T2"] }),
      "105": entry({ codes: ["T1"] }),
      "109": entry({}),
      "204": entry({ note: "x" }),
    });
    expect(rows.map((row) => row.tooth.code)).toEqual(["108", "204", "401"]);
  });
});

describe("missingAdvice", () => {
  it("flags an empty feeding or chewing field", () => {
    expect(missingAdvice({ feeding: "soft", chewingRestrictions: "no toys" })).toBe(false);
    expect(missingAdvice({ feeding: " ", chewingRestrictions: "no toys" })).toBe(true);
    expect(missingAdvice({ feeding: "soft", chewingRestrictions: "" })).toBe(true);
  });
});
