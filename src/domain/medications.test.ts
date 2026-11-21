import { describe, expect, it } from "vitest";
import { emptyNerveBlock } from "./anesthesia";
import { emptyMedication, medicationFromTemplate, MEDICATION_TEMPLATES } from "./medications";

describe("medication templates", () => {
  it("fill the name, frequency, duration and instructions but never the dose", () => {
    for (const template of MEDICATION_TEMPLATES) {
      const medication = medicationFromTemplate(template, { name: "N", frequency: "F", instructions: "I" });
      expect(medication).toMatchObject({ name: "N", frequency: "F", instructions: "I", dose: "" });
      expect(medication.durationDays).toBeGreaterThan(0);
    }
  });

  it("start rows empty", () => {
    expect(emptyMedication()).toEqual({ name: "", dose: "", frequency: "", durationDays: null, instructions: "" });
    expect(emptyNerveBlock()).toEqual({ nerve: "", side: "", anesthetic: "", amountMl: null });
  });
});
