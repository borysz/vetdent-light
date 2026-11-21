import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "./config";

describe("i18n config", () => {
  it("defaults to Hungarian and lists it as supported", () => {
    expect(defaultLocale).toBe("hu");
    expect(locales).toContain("hu");
  });

  it("recognises only supported locales", () => {
    expect(isLocale("hu")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
