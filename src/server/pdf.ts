import puppeteer from "puppeteer-core";
import { chromeArgs, resolveChromePath } from "./chrome";
import { serverEnv } from "./env";
import { ApiError } from "./errors";

/** At most this many Chrome instances at once; further requests wait their turn. */
const MAX_CONCURRENT = 2;
let running = 0;
const queue: (() => void)[] = [];

async function inTurn<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => queue.push(resolve));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    queue.shift()?.();
  }
}

/** "a=b; c=d" as cookies for the page's own origin. */
function parseCookies(header: string, url: string) {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const at = part.indexOf("=");
      return { name: part.slice(0, at), value: part.slice(at + 1), url };
    })
    .filter((cookie) => cookie.name !== "");
}

/**
 * Renders the print view of a sheet (`/print/sheets/<id>`, the same React report component as the
 * preview) to an A4 PDF with a headless Chrome. The caller's credentials are passed on, so the page
 * reads the sheet through the API as that user (row level security applies). Chrome embeds the fonts
 * the page uses, so Hungarian letters with a double acute accent are correct.
 */
export async function renderSheetPdf(opts: { sheetId: string; authorization: string | null; cookie: string | null }): Promise<Uint8Array> {
  const env = serverEnv();
  const executablePath = await resolveChromePath();
  if (!executablePath) {
    console.error("PDF: no Chrome (set CHROME_PATH or run npm run chrome:install)");
    throw new ApiError("internal_error", "PDF generation is not configured");
  }
  const base = env.INTERNAL_BASE_URL;

  return inTurn(async () => {
    const browser = await puppeteer.launch({ executablePath, headless: true, args: chromeArgs() });
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(30_000);
      // Same width as the A4 page content, so the chart is laid out exactly as it is printed.
      await page.setViewport({ width: 794, height: 1123 });
      await page.emulateMediaType("print");
      if (opts.authorization) await page.setExtraHTTPHeaders({ authorization: opts.authorization });
      if (opts.cookie) await page.setCookie(...parseCookies(opts.cookie, base));

      await page.goto(`${base}/print/sheets/${opts.sheetId}`, { waitUntil: "networkidle0" });
      await page.waitForSelector("[data-report-ready]");
      // Let the chart finish measuring its columns after the fonts are in.
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await page.pdf({ printBackground: true, preferCSSPageSize: true });
    } catch (error) {
      console.error("PDF generation failed", error instanceof Error ? error.message : error);
      throw new ApiError("internal_error", "PDF generation failed");
    } finally {
      await browser.close();
    }
  });
}
