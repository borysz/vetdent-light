import { describe, expect, it } from "vitest";
import { ageOn, estimateBirthMonth } from "./age";

describe("estimateBirthMonth", () => {
  it("subtracts years and months from the visit month", () => {
    expect(estimateBirthMonth("2026-11-21", 6, 4)).toBe("2020-07-01");
  });

  it("crosses a year boundary", () => {
    expect(estimateBirthMonth("2026-02-10", 0, 5)).toBe("2025-09-01");
    expect(estimateBirthMonth("2026-01-01", 1, 0)).toBe("2025-01-01");
  });
});

describe("ageOn", () => {
  it("is the inverse of estimateBirthMonth on the same date", () => {
    expect(ageOn("2020-07-01", "2026-11-21")).toEqual({ years: 6, months: 4 });
  });

  it("grows by itself on a later date", () => {
    expect(ageOn("2020-07-01", "2027-01-05")).toEqual({ years: 6, months: 6 });
  });

  it("never goes negative", () => {
    expect(ageOn("2030-01-01", "2026-11-21")).toEqual({ years: 0, months: 0 });
  });
});
