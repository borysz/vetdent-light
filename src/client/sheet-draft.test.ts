import { describe, expect, it } from "vitest";
import type { Patient } from "@/contracts/patients";
import {
  draftsEqual,
  formatDecimal,
  memberName,
  newDraft,
  parseDecimal,
  toCreateBody,
  toUpdateBody,
  validateDraft,
} from "./sheet-draft";

const patient: Patient = {
  id: "7f1c2a40-0000-4000-8000-000000000001",
  species: "cat",
  name: "Mici",
  breed: "European shorthair",
  sex: "spayed_female",
  ownerName: "Owner",
  ownerEmail: null,
  ownerPhone: null,
  estimatedBirthMonth: "2019-09",
  age: { years: 7, months: 2 },
  lastWeightKg: 4.1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("decimals", () => {
  it("accepts a comma or a dot and shows a comma", () => {
    expect(parseDecimal("32,5")).toBe(32.5);
    expect(parseDecimal("32.5")).toBe(32.5);
    expect(parseDecimal("  ")).toBeNull();
    expect(parseDecimal("abc")).toBeNaN();
    expect(formatDecimal(32.5)).toBe("32,5");
    expect(formatDecimal(null)).toBe("");
  });
});

describe("newDraft", () => {
  it("starts empty with today's date for a new animal", () => {
    const draft = newDraft("dog", undefined, "2026-11-21");
    expect(draft.species).toBe("dog");
    expect(draft.treatmentDate).toBe("2026-11-21");
    expect(draft.patientName).toBe("");
  });

  it("defaults the treating vet to the signed-in user", () => {
    expect(newDraft("dog", undefined, "2026-11-21", "Dr. Jane Doe").treatingVet).toBe("Dr. Jane Doe");
    expect(newDraft("dog", patient, "2026-11-21", "Dr. Jane Doe").treatingVet).toBe("Dr. Jane Doe");
    expect(newDraft("dog", undefined, "2026-11-21").treatingVet).toBe("");
  });

  it("formats a member name with the title when there is one", () => {
    expect(memberName({ displayName: "Dr. Jane Doe" })).toBe("Dr. Jane Doe");
    expect(memberName({ displayName: " Jane Doe " })).toBe("Jane Doe");
  });

  it("pre-fills the card of an existing patient, with the grown age and last weight", () => {
    const draft = newDraft("dog", patient, "2026-11-21");
    expect(draft.species).toBe("cat");
    expect(draft.patientName).toBe("Mici");
    expect(draft.ageYears).toBe("7");
    expect(draft.ageMonths).toBe("2");
    expect(draft.weightKg).toBe("4,1");
  });
});

describe("validateDraft", () => {
  it("requires the animal name, owner name and a date", () => {
    const errors = validateDraft({ ...newDraft("dog", undefined, "2026-11-21"), treatmentDate: "" });
    expect(Object.keys(errors).sort()).toEqual(["ownerName", "patientName", "treatmentDate"]);
  });

  it("checks e-mail format, numbers and age ranges, but does not require the e-mail", () => {
    const ok = { ...newDraft("dog", undefined, "2026-11-21"), patientName: "Max", ownerName: "Owner" };
    expect(validateDraft(ok)).toEqual({});
    const bad = validateDraft({ ...ok, ownerEmail: "nope", weightKg: "x", ageYears: "41", ageMonths: "12" });
    expect(Object.keys(bad).sort()).toEqual(["ageMonths", "ageYears", "ownerEmail", "weightKg"]);
  });
});

describe("request bodies", () => {
  const draft = {
    ...newDraft("dog", undefined, "2026-11-21"),
    patientName: " Max ",
    ownerName: "Owner",
    ageYears: "6",
    ageMonths: "4",
    weightKg: "32,5",
    asa: "II" as const,
  };

  it("creates a new patient together with the sheet", () => {
    const body = toCreateBody(draft);
    expect(body).toMatchObject({ treatmentDate: "2026-11-21", ageYears: 6, ageMonths: 4, weightKg: 32.5, asa: "II" });
    expect("patient" in body && body.patient?.name).toBe("Max");
    expect("patientId" in body).toBe(false);
  });

  it("attaches a sheet to an existing patient", () => {
    const body = toCreateBody(draft, patient.id);
    expect("patientId" in body && body.patientId).toBe(patient.id);
    expect("patient" in body).toBe(false);
  });

  it("sends the version and the patient card on save", () => {
    const body = toUpdateBody(draft, 3);
    expect(body.version).toBe(3);
    expect(body.patient?.ownerName).toBe("Owner");
    expect(body.treatingVet).toBeNull();
  });
});

describe("draftsEqual", () => {
  it("detects edits", () => {
    const a = newDraft("dog", undefined, "2026-11-21");
    expect(draftsEqual(a, { ...a })).toBe(true);
    expect(draftsEqual(a, { ...a, breed: "x" })).toBe(false);
  });
});
