/**
 * The headless Chrome of the browser checks (layout, flow, PDF, volume): found the same way as the server's
 * PDF Chrome (CHROME_PATH, `.chrome/` from `npm run chrome:install`, or the system Chrome), on any computer.
 */
import puppeteer from "puppeteer-core";
import { chromeArgs, resolveChromePath } from "../../src/server/chrome";

export async function launchBrowser() {
  const executablePath = await resolveChromePath();
  if (!executablePath) {
    throw new Error("No Chrome found: install Google Chrome, set CHROME_PATH in .env.local, or run npm run chrome:install");
  }
  // --no-sandbox: the checks also run in containers and sandboxes (e.g. Linux without user namespaces).
  return puppeteer.launch({ executablePath, headless: true, args: [...chromeArgs(), "--no-sandbox"] });
}
