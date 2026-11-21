import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookie } from "./config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const fromCookie = store.get(localeCookie)?.value;
  const locale = isLocale(fromCookie) ? fromCookie : defaultLocale;

  return {
    locale,
    timeZone: "Europe/Budapest",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
