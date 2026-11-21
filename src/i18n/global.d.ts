import type { locales } from "./config";
import type messages from "../../messages/hu.json";

// Typed message keys: `hu.json` is the reference catalogue for all locales.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}
