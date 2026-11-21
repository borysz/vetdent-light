/**
 * Layout check with a real Chrome (puppeteer-core), against a running server (production build recommended):
 *
 *   npm run build && npm run start      (in another terminal; default http://localhost:6438)
 *   npm run check:layout
 *
 * It creates a marked test user (e2e-…@vetdent-light.test) with a few animals and sheets, signs in through the
 * login page, visits every main page and opens every dialog at every target size, and fails on:
 * horizontal page scroll, elements outside the screen, scrollable or clipped dialogs, touch targets under 44 px
 * (tablet sizes run as emulated touch devices, like the device mode of Chrome DevTools),
 * and for the dental chart: it must fit whole under the header, show every tooth, and keep its text at 11 px or more.
 * Screenshots go to SCREENSHOT_DIR (default "template pics/screenshots", local, not in git). Everything it
 * created is deleted at the end.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer, { type Page } from "puppeteer-core";
import messages from "../messages/hu.json";
import { teethOf } from "../src/domain/teeth/catalog";
import { createAdminClient } from "../src/server/admin";
import { insertDemoAnimals } from "./lib/demo";
import { createE2eUser } from "./lib/e2e";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6438";
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR ?? join("template pics", "screenshots");
const CHROME_PATH = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/**
 * Target sizes (usable browser area in CSS px) and secondary sizes where nothing may break either.
 * Phones are not a target: there nothing may stick out or scroll the page sideways, but the dental chart may
 * scroll sideways inside its own box, dialogs may scroll vertically and the home screen may be taller than one screen.
 */
const SIZES = [
  { name: "laptop-1280x580", width: 1280, height: 580, tablet: false, phone: false },
  { name: "ipad-820x1100", width: 820, height: 1100, tablet: true, phone: false },
  { name: "ipad9-810x1000", width: 810, height: 1000, tablet: true, phone: false },
  { name: "android-800x1150", width: 800, height: 1150, tablet: true, phone: false },
  { name: "secondary-768x1024", width: 768, height: 1024, tablet: true, phone: false },
  { name: "tablet-landscape-1180x820", width: 1180, height: 820, tablet: true, phone: false },
  { name: "desktop-1920x1080", width: 1920, height: 1080, tablet: false, phone: false },
  { name: "phone-402x874", width: 402, height: 874, tablet: true, phone: true },
  { name: "phone-360x780", width: 360, height: 780, tablet: true, phone: true },
];

/** An iPad's Safari identifies itself like this (iPadOS asks for the desktop site by default). */
const TABLET_USER_AGENT =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** An iPhone's Safari. */
const PHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

type Failure = { size: string; state: string; issue: string };
const failures: Failure[] = [];
let checks = 0;

/** Runs in the page: collects layout problems of the current state. */
function auditPage(phone: boolean): string[] {
  const issues: string[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const root = document.documentElement;
  if (root.scrollWidth > vw + 1) issues.push(`horizontal page scroll (scrollWidth ${root.scrollWidth} > ${vw})`);

  const visible = (el: Element) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && !el.closest(".sr-only");
  };
  const describe = (el: Element) => {
    const label = el.getAttribute("aria-label") ?? (el.textContent ?? "").trim().slice(0, 28);
    return `<${el.tagName.toLowerCase()}> "${label}"`;
  };

  const outside: string[] = [];
  // Content inside a box that scrolls sideways on its own (the chart on a phone) does not stick out of the page.
  const insideScroller = (el: Element) => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (["auto", "scroll"].includes(getComputedStyle(parent).overflowX)) return true;
    }
    return false;
  };
  for (const el of document.querySelectorAll("header *, main *, [role=dialog] *, [role=menu] *")) {
    if (!visible(el) || insideScroller(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.right > vw + 0.5 || rect.left < -0.5) outside.push(`${describe(el)} spans ${Math.round(rect.left)}..${Math.round(rect.right)} of ${vw}`);
  }
  issues.push(...outside.slice(0, 5).map((text) => `outside the screen: ${text}`));

  for (const dialog of document.querySelectorAll("[role=dialog]")) {
    const rect = dialog.getBoundingClientRect();
    if (rect.top < -0.5 || rect.bottom > vh + 0.5) issues.push(`dialog does not fit the screen height (${Math.round(rect.top)}..${Math.round(rect.bottom)} of ${vh})`);
    for (const el of [dialog, ...dialog.querySelectorAll("*")]) {
      if (el.closest(".sr-only")) continue; // visually hidden text for screen readers is clipped on purpose
      const style = getComputedStyle(el);
      if (!["auto", "scroll", "hidden"].includes(style.overflowY)) continue;
      if (phone && style.overflowY === "auto") continue; // on a phone a dialog may scroll vertically
      if (el.scrollHeight > el.clientHeight + 1) {
        issues.push(`dialog content is scrollable or clipped: ${describe(el)} (scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight})`);
        break;
      }
    }
  }

  const small: string[] = [];
  const targets = "button, a[href], select, textarea, input:not([type=hidden]), [role=menuitem], [role=tab]";
  for (const el of document.querySelectorAll(targets)) {
    if (!visible(el)) continue;
    const rect = el.getBoundingClientRect();
    const columnTarget = (el as HTMLElement).dataset.touch === "column";
    if ((!columnTarget && rect.width < 43.5) || rect.height < 43.5) small.push(`${describe(el)} is ${Math.round(rect.width)}x${Math.round(rect.height)}`);
  }
  issues.push(...small.slice(0, 8).map((text) => `touch target under 44 px: ${text}`));

  const chartSection = document.querySelector("[data-chart-section]");
  const chart = document.querySelector("[data-chart]");
  if (chartSection && chart) {
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const sectionHeight = chartSection.getBoundingClientRect().height;
    if (!phone && sectionHeight > vh - headerHeight + 0.5) {
      issues.push(`the whole chart does not fit under the header (${Math.round(sectionHeight)} px > ${Math.round(vh - headerHeight)} px available)`);
    }
    if (!phone && chart.scrollWidth > chart.clientWidth + 1) issues.push("the chart overflows horizontally");
    const tiny = new Set<string>();
    for (const el of chart.querySelectorAll("*")) {
      const ownText = [...el.childNodes].some((node) => node.nodeType === 3 && (node.textContent ?? "").trim() !== "");
      if (ownText && visible(el) && parseFloat(getComputedStyle(el).fontSize) < 11) tiny.add(describe(el));
    }
    issues.push(...[...tiny].slice(0, 5).map((text) => `chart text under 11 px: ${text}`));
    const teethShown = chart.querySelectorAll("[data-tooth]").length;
    const expected = Number((chartSection as HTMLElement).dataset.teeth ?? teethShown);
    if (teethShown !== expected) issues.push(`chart shows ${teethShown} teeth, expected ${expected}`);
    for (const cell of chart.querySelectorAll("[data-other-cell]")) {
      const cellRect = cell.getBoundingClientRect();
      for (const chip of cell.querySelectorAll("span > span")) {
        const chipRect = chip.getBoundingClientRect();
        if (chipRect.left < cellRect.left - 4 || chipRect.right > cellRect.right + 4) {
          issues.push(`code chip sticks out of its cell: "${chip.textContent}"`);
          break;
        }
      }
    }
  }

  const tabNav = document.querySelector("header nav");
  if (tabNav) {
    if (tabNav.scrollWidth > tabNav.clientWidth + 1) issues.push("tab names are clipped in the header (they do not fit next to the buttons)");
    const navRight = tabNav.getBoundingClientRect().right;
    for (const tab of tabNav.querySelectorAll("button")) {
      if (tab.getBoundingClientRect().right > navRight + 0.5) {
        issues.push(`a tab sticks out of the tab bar: "${tab.getAttribute("aria-label")}"`);
        break;
      }
    }
  }

  const header = document.querySelector("header");
  if (header) {
    const rect = header.getBoundingClientRect();
    if (!phone && rect.height > 140) issues.push(`header is unusually tall (${Math.round(rect.height)} px)`);
  }
  return issues;
}

async function inspect(page: Page, size: (typeof SIZES)[number], state: string, opts: { fitsScreen?: boolean } = {}) {
  checks += 1;
  for (const issue of await page.evaluate(auditPage, size.phone)) failures.push({ size: size.name, state, issue });
  if (opts.fitsScreen && !size.phone) {
    // Pages that must fit one screen (the home screen) may not need vertical scrolling.
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    if (overflow > 1) failures.push({ size: size.name, state, issue: `page needs vertical scrolling (${overflow} px too tall)` });
  }
  const dir = join(SCREENSHOT_DIR, size.name);
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${state}.png`) });
}

async function settle(page: Page) {
  await page.waitForNetworkIdle({ idleTime: 400, timeout: 30_000 }).catch(() => undefined);
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForSelector("[role=dialog]", { hidden: true, timeout: 5_000 }).catch(() => undefined);
}

async function clickByLabel(page: Page, label: string) {
  const handle = await page.waitForSelector(`[aria-label="${label}"]`, { timeout: 15_000 });
  await handle?.click();
}

/** Click the first enabled button whose text contains the given text. */
async function clickButtonText(page: Page, text: string) {
  await page.waitForFunction(
    (t) => [...document.querySelectorAll("button")].some((b) => (b.textContent ?? "").includes(t) && !b.disabled),
    {},
    text,
  );
  await page.evaluate((t) => {
    const button = [...document.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes(t) && !b.disabled);
    (button as HTMLButtonElement).click();
  }, text);
}

async function main() {
  const admin = createAdminClient();
  const e2e = await createE2eUser(admin, { clinicName: "e2e layout", displayName: "E2E Test" });
  const { email, password, clinicId } = e2e;

  try {

    // A handful of animals with sheets, so lists and paging have something to show.
    const animals = [
      ["dog", "Max", "Owner One"], ["cat", "Mia", "Owner Two"], ["dog", "Rex", "Owner Three"],
      ["cat", "Luna", "Owner Four"], ["dog", "Buddy", "Owner Five"], ["cat", "Kitty", "Owner Six"],
    ] as const;
    const scaled = (species: "dog" | "cat") => Object.fromEntries(teethOf(species).map((tooth) => [tooth.code, { treatments: ["U", "POL"] }]));
    // Worst case for the "other" cells: many codes on teeth of both blocks.
    const dogContent = {
      teeth: {
        ...scaled("dog"),
        "108": { codes: ["FX-C", "PE", "PD2"], treatments: ["RX", "EXT-SURG"], pocketMm: { mesial: 2, buccal: 4, distal: 2, palatolingual: 2 } },
        "104": { codes: ["T2", "G2", "PD1"], treatments: ["U", "POL"] },
        "204": { codes: ["T2", "G1"], treatments: ["U", "POL"] },
        "208": { codes: ["T3", "G3", "PD4", "Mob3", "Fur3", "FX-CR", "UCF"], treatments: ["U", "POL", "CURE", "RX", "ENDO", "FLAP", "BIO"] },
        "409": { codes: ["T2", "Fur1"], treatments: ["U", "POL", "CURE"] },
        "309": { codes: ["PD3", "Mob2", "Fur2", "FX-CR", "PE"], treatments: ["U", "POL", "CURE", "RX", "ENDO", "FLAP"] },
        "308": { codes: ["M"] },
      },
      periodontal: { stage: "2", calculusIndex: "T2", gingivitisIndex: "G1-G2", occlusion: "Normal" },
      nerveBlocks: [
        { nerve: "infraorbital", side: "right", anesthetic: "bupivacaine_lidocaine", amountMl: 1.2 },
        { nerve: "mentalis", side: "left", anesthetic: "lidocaine_2", amountMl: 0.5 },
        { nerve: "mentalis", side: "right", anesthetic: "lidocaine_2", amountMl: 0.5 },
      ],
      surgery: { suture: "Monocryl 4-0", stitchType: "Simple interrupted", description: "Sectioned and extracted. ".repeat(12) },
      radiology: { imageCount: 4, findings: "Pre- and post-extraction views. ".repeat(10), intraoperative: "None. ".repeat(8) },
      medications: [
        { name: "Meloxidyl 1.5 mg/ml oral suspension", dose: "Draw up to the 32 kg mark with the syringe", frequency: "Once daily in the morning with food", durationDays: 5, instructions: "Anti-inflammatory and painkiller. ".repeat(6) },
        { name: "Kesium 500 mg tablet", dose: "1 tablet", frequency: "Twice daily (every 12 hours)", durationDays: 7, instructions: "Antibiotic." },
        { name: "Stomodine oral gel", dose: "Pea-sized", frequency: "Twice daily in the evening", durationDays: 10, instructions: "Apply gently." },
      ],
      homecare: { feeding: "Soft food for 10 days. ".repeat(10), chewingRestrictions: "No chew toys for 14 days. ".repeat(8), oralHygiene: "Do not brush the wound.", closingNote: "Extraction of 108 went well." },
      followUp: { date: "2026-12-01", purpose: "Suture check" },
    };
    const catContent = {
      teeth: {
        ...scaled("cat"),
        "108": { codes: ["T2", "G1"], treatments: ["U", "POL"] },
        "407": { codes: ["TR2", "G2"], treatments: ["RX", "EXT-SURG"] },
        "307": { codes: ["TR3", "G3", "Mob2"], treatments: ["RX", "EXT-SURG"] },
      },
      periodontal: { stage: "2", stomatitis: "Mild" },
    };
    let firstSheetId = "";
    let firstPatientId = "";
    let catSheetId = "";
    for (const [index, [species, name, owner]] of animals.entries()) {
      const patient = await admin
        .from("patients")
        .insert({ clinic_id: clinicId, species, name, owner_name: owner, owner_phone: "+36 30 000 000" + index, sex: "male", breed: "Mixed", estimated_birth_month: "2019-11-01", last_weight_kg: 12.5 })
        .select("id")
        .single();
      if (patient.error) throw patient.error;
      for (let n = 0; n < (index === 0 ? 5 : 1); n++) {
        const sheet = await admin
          .from("treatment_sheets")
          .insert({
            clinic_id: clinicId,
            patient_id: patient.data.id,
            treatment_date: `2026-0${n + 1}-1${index}`,
            treating_vet: "Dr. Test",
            age_years: 6,
            age_months: 4,
            weight_kg: 12.5,
            asa: "II",
            content: index === 0 && n === 0 ? dogContent : index === 1 ? catContent : { teeth: { "108": { treatments: ["U", "POL"] } } },
          })
          .select("id")
          .single();
        if (sheet.error) throw sheet.error;
        if (!firstSheetId) {
          firstSheetId = sheet.data.id;
          firstPatientId = patient.data.id;
        }
        if (index === 1) catSheetId = sheet.data.id;
      }
    }

    // The two demo animals (Max, Mici): the screenshots of these are compared with the sample images.
    const demo = await insertDemoAnimals(admin, clinicId);
    const demoMax = demo.find((animal) => animal.name === "Max");
    const demoMici = demo.find((animal) => animal.name === "Mici");
    if (!demoMax || !demoMici) throw new Error("demo animals were not created");

    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ["--no-sandbox"] });
    const desktopUserAgent = await browser.userAgent();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(30_000);
      // tsx wraps named functions in a __name() helper; define it in the page so audit code can run there.
      await page.evaluateOnNewDocument("window.__name = (target) => target;");

      const emulate = (size: (typeof SIZES)[number]) =>
        // Tablets are emulated as real devices (mobile viewport, touch, 2x pixels, tablet browser), like the
        // device mode of Chrome DevTools; laptops and desktops as plain windows.
        page.emulate({
          userAgent: size.phone ? PHONE_USER_AGENT : size.tablet ? TABLET_USER_AGENT : desktopUserAgent,
          viewport: { width: size.width, height: size.height, deviceScaleFactor: size.tablet ? 2 : 1, isMobile: size.tablet, hasTouch: size.tablet },
        });

      // Signed-out pages first.
      for (const size of SIZES) {
        await emulate(size);
        for (const [path, state] of [["/login", "login"], ["/forgot-password", "forgot-password"]] as const) {
          await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle2" });
          await page.waitForSelector("form button[type=submit]");
          await inspect(page, size, state, { fitsScreen: true });
        }
      }

      await page.setViewport({ width: SIZES[0].width, height: SIZES[0].height });
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
      await page.type("#email", email);
      await page.type("#password", password);
      await Promise.all([page.waitForFunction(() => window.location.pathname === "/"), page.click("button[type=submit]")]);
      await settle(page);

      const h = messages.header;
      for (const size of SIZES) {
        await emulate(size);

        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
        await page.waitForSelector("main ul li");
        await inspect(page, size, "home", { fitsScreen: true });

        await clickByLabel(page, h.newSheet);
        await page.waitForSelector("[role=dialog]");
        await settle(page);
        await inspect(page, size, "dialog-new-sheet");
        await closeDialog(page);

        await clickByLabel(page, h.sheets);
        await page.waitForSelector("[role=dialog] ul button");
        await page.click("[role=dialog] ul button");
        await settle(page);
        await inspect(page, size, "dialog-sheets");
        await closeDialog(page);

        await clickByLabel(page, h.userMenu);
        await page.waitForSelector("[role=menu]");
        await inspect(page, size, "user-menu");
        const clinicItem = await page.$("[role=menuitem]");
        await clinicItem?.click();
        await page.waitForSelector("[role=dialog] form");
        await inspect(page, size, "dialog-clinic");
        await closeDialog(page);

        await page.goto(`${BASE_URL}/sheets/new?species=dog`, { waitUntil: "networkidle2" });
        await page.waitForSelector("#email, main h2", { timeout: 30_000 });
        await page.waitForSelector("input[type=date]");
        await inspect(page, size, "sheet-new-card-open");

        await page.goto(`${BASE_URL}/sheets/${firstSheetId}?tab=1`, { waitUntil: "networkidle2" });
        await page.waitForSelector("main h2");
        for (const tab of [1, 2, 3, 4]) {
          await page.goto(`${BASE_URL}/sheets/${firstSheetId}?tab=${tab}`, { waitUntil: "networkidle2" });
          await page.waitForSelector("main h2");
          await inspect(page, size, `sheet-tab-${tab}`);
        }

        for (const [species, sheetId] of [["dog", firstSheetId], ["cat", catSheetId]] as const) {
          await page.goto(`${BASE_URL}/sheets/${sheetId}?tab=1`, { waitUntil: "networkidle2" });
          await page.waitForSelector("[data-chart] [data-tooth]");
          await page.evaluate(() => document.querySelector("[data-chart-section]")?.scrollIntoView({ block: "end" }));
          await inspect(page, size, `chart-${species}`);

          await page.click(`[data-tooth="${species === "dog" ? "108" : "307"}"]`);
          await page.waitForSelector("[role=dialog] [role=tab]");
          await inspect(page, size, `dialog-tooth-findings-${species}`);
          const tabs = await page.$$("[role=dialog] [role=tab]");
          await tabs[1].click();
          await inspect(page, size, `dialog-tooth-treatment-${species}`);
          await clickButtonText(page, messages.toothEditor.tabQuick);
          await page.waitForFunction((t) => (document.querySelector("[role=dialog]")?.textContent ?? "").includes(t), {}, messages.quick.diagnostic);
          await inspect(page, size, `dialog-tooth-quick-${species}`);
          await closeDialog(page);

          await clickButtonText(page, messages.chart.selectAll);
          await clickButtonText(page, messages.chart.quickFor.split(" ")[0]);
          await page.waitForSelector("[role=dialog]");
          await inspect(page, size, `dialog-quick-entry-${species}`);
          await closeDialog(page);
        }

        await page.goto(`${BASE_URL}/sheets/${firstSheetId}?tab=1`, { waitUntil: "networkidle2" });
        await page.waitForSelector("main h2");
        await clickByLabel(page, h.reset);
        await page.waitForSelector("[role=dialog]");
        await inspect(page, size, "dialog-reset-confirm");
        await closeDialog(page);

        for (const [label, ref, tabs] of [["max", demoMax, [1, 2, 3, 4]], ["mici", demoMici, [1, 4]]] as const) {
          for (const tab of tabs) {
            await page.goto(`${BASE_URL}/sheets/${ref.sheetId}?tab=${tab}`, { waitUntil: "networkidle2" });
            await page.waitForSelector(tab === 4 ? "[data-report]" : "main h2");
            if (tab === 1) {
              await page.waitForSelector("[data-chart] [data-tooth]");
              await page.evaluate(() => {
                document.querySelector("[data-chart-section]")?.scrollIntoView({ block: "start" });
                window.scrollBy(0, -72);
              });
            }
            await inspect(page, size, `demo-${label}-tab-${tab}`);
          }
        }

        await page.goto(`${BASE_URL}/sheets/new?patient=${firstPatientId}`, { waitUntil: "networkidle2" });
        await page.waitForSelector("input[type=date]");
        await inspect(page, size, "sheet-new-for-patient");

        await page.goto(`${BASE_URL}/reset-password`, { waitUntil: "networkidle2" });
        await page.waitForSelector("#new-password");
        await inspect(page, size, "reset-password", { fitsScreen: true });

        await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
        // Signed in users are redirected from /login; that redirect target is the home screen.
      }
    } finally {
      await browser.close();
    }
  } finally {
    await e2e.remove();
  }

  if (failures.length > 0) {
    console.error(`\ncheck:layout FAILED: ${failures.length} problem(s) in ${checks} checked states\n`);
    for (const f of failures) console.error(`  [${f.size}] ${f.state}: ${f.issue}`);
    process.exit(1);
  }
  console.log(`check:layout OK: ${checks} states at ${SIZES.length} sizes. Screenshots: ${SCREENSHOT_DIR}`);
}

main().catch((error) => {
  console.error("check:layout crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
