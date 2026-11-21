/**
 * Supported UI locales. Adding a language = add the code here, add
 * `messages/<code>.json` and `messages/review/<code>.json` (see docs/I18N.md).
 */
export const locales = ["hu"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "hu";

/** Cookie that stores the user's chosen locale (no locale in the URL). */
export const localeCookie = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}
