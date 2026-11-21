import { describe, expect, it } from "vitest";
import { todayInBudapest } from "./date";

describe("todayInBudapest", () => {
  it("uses the clinic's calendar day, not UTC", () => {
    // 23:30 UTC on 20 November is already 21 November in Budapest (UTC+1 in winter).
    expect(todayInBudapest(new Date("2026-11-20T23:30:00Z"))).toBe("2026-11-21");
    // 22:30 UTC on 20 June is already 21 June in Budapest (UTC+2 in summer).
    expect(todayInBudapest(new Date("2026-06-20T22:30:00Z"))).toBe("2026-06-21");
    expect(todayInBudapest(new Date("2026-11-21T12:00:00Z"))).toBe("2026-11-21");
  });
});
