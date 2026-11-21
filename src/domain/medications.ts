/**
 * Quick templates of the home medication plan (from the sample sheet). The dose is deliberately never
 * filled in: the app does not calculate doses, the vet types them. Template content is professional
 * data and needs veterinary approval (docs/SZAKMAI_ELLENORZES.md).
 */
export type Medication = {
  name: string;
  dose: string;
  frequency: string;
  durationDays: number | null;
  instructions: string;
};

export const MEDICATION_TEMPLATES = ["painkiller", "antibiotic", "oralGel"] as const;
export type MedicationTemplate = (typeof MEDICATION_TEMPLATES)[number];

export const emptyMedication = (): Medication => ({ name: "", dose: "", frequency: "", durationDays: null, instructions: "" });

/** Texts of a template, already translated (the dose stays empty). */
export type TemplateTexts = { name: string; frequency: string; instructions: string };

const DURATION_DAYS: Record<MedicationTemplate, number> = { painkiller: 5, antibiotic: 7, oralGel: 10 };

export function medicationFromTemplate(template: MedicationTemplate, texts: TemplateTexts): Medication {
  return { name: texts.name, dose: "", frequency: texts.frequency, durationDays: DURATION_DAYS[template], instructions: texts.instructions };
}
