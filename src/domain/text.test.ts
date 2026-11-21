import { describe, expect, it } from "vitest";
import { foldForSearch, phoneSearchDigits } from "./text";

// Accented letters are built from code points (project rule: no accented letters in code).
const ch = (code: number) => String.fromCharCode(code);

describe("foldForSearch", () => {
  it("removes Hungarian accents, including the double acute, and lower-cases", () => {
    expect(foldForSearch("Kov" + ch(0xe1) + "cs")).toBe("kovacs");
    expect(foldForSearch(ch(0x150) + "rs" + ch(0xe9) + "g")).toBe("orseg");
    expect(foldForSearch("T" + ch(0x171) + "z")).toBe("tuz");
    expect(foldForSearch("  MICI ")).toBe("mici");
  });
});

describe("phoneSearchDigits", () => {
  it("keeps only digits and turns a leading 06 into 36", () => {
    expect(phoneSearchDigits("+36 30 142 1042")).toBe("36301421042");
    expect(phoneSearchDigits("06 30 142 1042")).toBe("36301421042");
    expect(phoneSearchDigits("142-1042")).toBe("1421042");
  });

  it("ignores text with fewer than 3 digits", () => {
    expect(phoneSearchDigits("Bodri")).toBe("");
    expect(phoneSearchDigits("R2")).toBe("");
  });
});
