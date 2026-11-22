import { existsSync } from "node:fs";
import { join } from "node:path";
import { getInstalledBrowsers } from "@puppeteer/browsers";
import { serverEnv } from "./env";

/** Where `npm run chrome:install` puts the browser (inside the project, so a build step can install it). */
export const CHROME_CACHE_DIR = join(process.cwd(), ".chrome");

/** The usual places of an installed Chrome or Chromium, per operating system. */
const SYSTEM_CHROME: Partial<Record<NodeJS.Platform, string[]>> = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
};

/**
 * The Chrome used for the server-side PDF and the browser checks, in this order: `CHROME_PATH` when it is set,
 * the browser `npm run chrome:install` downloaded into `.chrome/` (e.g. on a hosting service), then a Chrome
 * installed in the usual place of the operating system. Null when there is none.
 */
export async function resolveChromePath(): Promise<string | null> {
  const env = serverEnv();
  if (env.CHROME_PATH) return env.CHROME_PATH;
  const installed = await getInstalledBrowsers({ cacheDir: CHROME_CACHE_DIR }).catch(() => []);
  const preferred = ["chrome-headless-shell", "chrome"];
  const found = installed
    .filter((browser) => preferred.includes(browser.browser))
    .sort((a, b) => preferred.indexOf(a.browser) - preferred.indexOf(b.browser))[0];
  if (found) return found.executablePath;
  return (SYSTEM_CHROME[process.platform] ?? []).find((path) => existsSync(path)) ?? null;
}

/** Launch flags: always without a GPU, plus `CHROME_ARGS` (e.g. "--no-sandbox --disable-dev-shm-usage" in a container). */
export function chromeArgs(): string[] {
  const extra = serverEnv().CHROME_ARGS?.split(/\s+/).filter(Boolean) ?? [];
  return ["--disable-gpu", ...extra];
}
