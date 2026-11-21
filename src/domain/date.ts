/** Calendar dates in the clinic's time zone (the one place that knows it). */

export const CLINIC_TIME_ZONE = "Europe/Budapest";

/** Today's date in the clinic's time zone, YYYY-MM-DD. */
export function todayInBudapest(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: CLINIC_TIME_ZONE }).format(now);
}
