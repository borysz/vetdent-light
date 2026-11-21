/** Text helpers shared by the search and the PDF file name. */

/** Combining accent marks (U+0300 to U+036F), written by code point so the source stays plain ASCII. */
export const COMBINING_ACCENTS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g");

/** Remove accents (o with double acute becomes o, a with acute becomes a) and lower-case: the search compares these forms. */
export function foldForSearch(text: string): string {
  return text.normalize("NFD").replace(COMBINING_ACCENTS, "").toLowerCase().trim();
}

/**
 * The digits of a typed phone number, in the stored international form: a Hungarian "06..." becomes "36...".
 * Returns "" when there are fewer than 3 digits (too short to look for a phone number).
 */
export function phoneSearchDigits(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (digits.length < 3) return "";
  return digits.startsWith("06") ? `36${digits.slice(2)}` : digits;
}
