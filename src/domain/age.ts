/**
 * Age handling: the sheet stores the age given at a visit; the patient stores the estimated birth
 * month (first day, YYYY-MM-01), so that the age on the next sheet grows by itself.
 */

function parseYmd(value: string): { y: number; m: number } {
  const [y, m] = value.split("-").map(Number);
  return { y, m };
}

/** Estimated birth month (YYYY-MM-01) from the age given on a visit date (YYYY-MM-DD). */
export function estimateBirthMonth(visitDate: string, ageYears: number, ageMonths: number): string {
  const { y, m } = parseYmd(visitDate);
  const total = y * 12 + (m - 1) - (ageYears * 12 + ageMonths);
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

/** Age in whole years and months on a given date; never negative. */
export function ageOn(birthMonth: string, onDate: string): { years: number; months: number } {
  const birth = parseYmd(birthMonth);
  const on = parseYmd(onDate);
  const total = Math.max(0, on.y * 12 + (on.m - 1) - (birth.y * 12 + (birth.m - 1)));
  return { years: Math.floor(total / 12), months: total % 12 };
}
