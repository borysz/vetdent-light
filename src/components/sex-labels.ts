import type { Sex } from "@/contracts/patients";

/** Message keys (namespace "card") of the animal's sex values, shared by the patient card and the report. */
export const SEX_MESSAGE_KEYS: Record<Sex, "sexMale" | "sexFemale" | "sexNeuteredMale" | "sexSpayedFemale"> = {
  male: "sexMale",
  female: "sexFemale",
  neutered_male: "sexNeuteredMale",
  spayed_female: "sexSpayedFemale",
};
