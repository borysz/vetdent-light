/**
 * Option lists of the anesthesia tab. Only what the sample sheet shows; every further entry needs
 * veterinary approval first (docs/SZAKMAI_ELLENORZES.md). Values are codes, the names are UI messages.
 */
export const NERVES = ["infraorbital", "mentalis"] as const;
export const SIDES = ["right", "left"] as const;
export const ANESTHETICS = ["bupivacaine_lidocaine", "lidocaine_2"] as const;

export type NerveBlock = {
  nerve: string;
  side: string;
  anesthetic: string;
  amountMl: number | null;
};

export const emptyNerveBlock = (): NerveBlock => ({ nerve: "", side: "", anesthetic: "", amountMl: null });
