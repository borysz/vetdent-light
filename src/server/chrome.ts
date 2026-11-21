import { join } from "node:path";
import { getInstalledBrowsers } from "@puppeteer/browsers";
import { serverEnv } from "./env";

/** Where `npm run chrome:install` puts the browser (inside the project, so a build step can install it). */
export const CHROME_CACHE_DIR = join(process.cwd(), ".chrome");

/**
 * The Chrome used for the server-side PDF: `CHROME_PATH` when it is set (a locally installed Chrome),
 * otherwise the browser `npm run chrome:install` downloaded into `.chrome/` (e.g. on a hosting service
 * without Chrome, where the version-specific path is not known in advance). Null when there is none.
 */
export async function resolveChromePath(): Promise<string | null> {
  const env = serverEnv();
  if (env.CHROME_PATH) return env.CHROME_PATH;
  const installed = await getInstalledBrowsers({ cacheDir: CHROME_CACHE_DIR }).catch(() => []);
  const preferred = ["chrome-headless-shell", "chrome"];
  const found = installed
    .filter((browser) => preferred.includes(browser.browser))
    .sort((a, b) => preferred.indexOf(a.browser) - preferred.indexOf(b.browser))[0];
  return found?.executablePath ?? null;
}

/** Launch flags: always without a GPU, plus `CHROME_ARGS` (e.g. "--no-sandbox --disable-dev-shm-usage" in a container). */
export function chromeArgs(): string[] {
  const extra = serverEnv().CHROME_ARGS?.split(/\s+/).filter(Boolean) ?? [];
  return ["--disable-gpu", ...extra];
}
