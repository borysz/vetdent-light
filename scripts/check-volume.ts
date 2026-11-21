/**
 * Volume check with a real Chrome against a running server (production build recommended):
 * a clinic with hundreds of dogs and cats, owners and sheets. Checks what the home screen shows (paged lists,
 * never everything at once), paging to the end, the search (animal, owner, phone, case, part of a word, no hit),
 * the sheets of one animal, and the response times. Uses a marked test user (e2e-...@vetdent-light.test) and
 * deletes everything it created.
 *
 *   npm run check:volume              (default 300 animals)
 *   npm run check:volume -- --animals 600
 */
import puppeteer, { type Page } from "puppeteer-core";
import messages from "../messages/hu.json";
import { createAdminClient } from "../src/server/admin";
import { createE2eUser } from "./lib/e2e";

const BASE = process.env.BASE_URL ?? "http://localhost:6438";
const CHROME_PATH = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const argIndex = process.argv.indexOf("--animals");
const ANIMALS = argIndex >= 0 ? Number(process.argv[argIndex + 1]) : 300;
/** Slowest acceptable answer for one list or search request, in ms. */
const MAX_API_MS = 1500;

const results: string[] = [];
const ok = (name: string, pass: boolean, extra = "") =>
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? " - " + extra : ""}`);
const info = (name: string, extra: string) => results.push(`INFO  ${name} - ${extra}`);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Accented letters are built from code points (project rule: no accented letters in code).
const a = String.fromCharCode(0xe1);
const o2 = String.fromCharCode(0x151);
const DOG_NAMES = ["Bodri", "Buksi", "Rex", "Luna", "Bella", "Morzsa", "Pajti", "Cezar", "Foltos", "Vackor", "Zorro", "Frakk"];
const CAT_NAMES = ["Cirmi", "Mici", "Garfield", "Csillag", "Bolyhos", "Tigris", "Pamacs", "Szotyi", "Kormos"];
const SURNAMES = ["Kov" + a + "cs", "Nagy", "T" + String.fromCharCode(0xf3) + "th", "Szab" + String.fromCharCode(0xf3), "Horv" + a + "th", "Varga", "Kiss", "Moln" + a + "r", "N" + String.fromCharCode(0xe9) + "meth", "Farkas", "Balogh", "Pap"];
const GIVEN = ["Anna", "P" + String.fromCharCode(0xe9) + "ter", "Eszter", "G" + a + "bor", "Judit", "Zolt" + a + "n", "Katalin", "L" + a + "szl" + String.fromCharCode(0xf3), "Ildik" + String.fromCharCode(0xf3), "Bence", "Gy" + o2 + "z" + o2];

type Animal = { species: "dog" | "cat"; name: string; owner: string; phone: string; sheets: string[] };

/** Deterministic data: names repeat (like in real life), phones are unique, 1-3 sheets per animal. */
function makeAnimals(count: number): Animal[] {
  const animals: Animal[] = [];
  for (let i = 0; i < count; i++) {
    const dog = i % 5 < 3; // 60% dogs
    const names = dog ? DOG_NAMES : CAT_NAMES;
    const owner = `${SURNAMES[i % SURNAMES.length]} ${GIVEN[(i * 7) % GIVEN.length]}`;
    const phone = `+36 30 ${String(100 + (i % 900)).padStart(3, "0")} ${String(1000 + i).padStart(4, "0")}`;
    const sheets = Array.from({ length: 1 + (i % 3) }, (_, k) => {
      const day = new Date(Date.UTC(2026, 10, 20) - ((i * 3 + k * 97) % 700) * 86_400_000);
      return day.toISOString().slice(0, 10);
    });
    animals.push({ species: dog ? "dog" : "cat", name: `${names[i % names.length]}`, owner, phone, sheets });
  }
  return animals;
}

/** How many animals the search should find: case-insensitive part of the name, owner name or phone. */
function expectedHits(animals: Animal[], q: string): number {
  const needle = q.toLowerCase();
  return animals.filter((x) => [x.name, x.owner, x.phone].some((field) => field.toLowerCase().includes(needle))).length;
}

const searchSection = `section[aria-label="${messages.home.searchResults}"]`;
const recentSection = `section[aria-label="${messages.home.recent}"]`;

/** Page, page count and total from the pager text under a list, or null when there is no pager. */
async function pagerOf(page: Page, section: string) {
  const text = await page.$eval(section, (el) => (el as HTMLElement).innerText);
  const match = /(\d+)\. oldal \/ (\d+) \((\d+)/.exec(text);
  return match ? { page: Number(match[1]), pages: Number(match[2]), total: Number(match[3]) } : null;
}

/** The names in a list (rows with a button; the "nothing found" row has none). */
const itemsIn = (page: Page, section: string) =>
  page.$$eval(`${section} ul > li`, (items) =>
    items.filter((li) => li.querySelector("button")).map((li) => (li as HTMLElement).innerText.split("\n")[0]),
  );

/** Type a search and wait for the matching API answer; returns its duration in ms. */
async function search(page: Page, q: string): Promise<number> {
  const input = `${searchSection} input[type=search]`;
  await page.click(input, { count: 3 });
  await page.keyboard.press("Backspace");
  const started = Date.now();
  const answer = page.waitForResponse((r) => r.url().includes("/api/v1/patients?") && new URL(r.url()).searchParams.get("q") === q, { timeout: 15000 });
  await page.type(input, q);
  await answer;
  const elapsed = Date.now() - started;
  await pause(250);
  return elapsed;
}

async function timedFetch(page: Page, path: string): Promise<{ ms: number; status: number; total: number }> {
  return page.evaluate(async (p) => {
    const started = performance.now();
    const response = await fetch(p, { credentials: "same-origin" });
    const body = await response.json().catch(() => ({}));
    return { ms: Math.round(performance.now() - started), status: response.status, total: body.total ?? -1 };
  }, path);
}

async function main() {
  const admin = createAdminClient();
  const e2e = await createE2eUser(admin, { clinicName: "e2e volume", displayName: "E2E Volume" });
  const animals = makeAnimals(ANIMALS);
  const sheetCount = animals.reduce((sum, x) => sum + x.sheets.length, 0);
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    // Data: patients and sheets in batches.
    const loadStarted = Date.now();
    const ids: string[] = [];
    for (let i = 0; i < animals.length; i += 200) {
      const batch = animals.slice(i, i + 200);
      const inserted = await admin
        .from("patients")
        .insert(batch.map((x, k) => ({ clinic_id: e2e.clinicId, species: x.species, name: x.name, owner_name: x.owner, owner_phone: x.phone, owner_email: `owner${i + k}@example.com` })))
        .select("id");
      if (inserted.error) throw inserted.error;
      ids.push(...inserted.data.map((row) => row.id));
    }
    const sheetRows = animals.flatMap((x, i) =>
      x.sheets.map((date) => ({ clinic_id: e2e.clinicId, patient_id: ids[i], treatment_date: date, treating_vet: "Dr. Volume", content: {} })),
    );
    for (let i = 0; i < sheetRows.length; i += 500) {
      const inserted = await admin.from("treatment_sheets").insert(sheetRows.slice(i, i + 500));
      if (inserted.error) throw inserted.error;
    }
    info("test data", `${animals.length} animals (${animals.filter((x) => x.species === "dog").length} dogs, ${animals.filter((x) => x.species === "cat").length} cats), ${sheetCount} sheets, loaded in ${Date.now() - loadStarted} ms`);

    const page = await browser.newPage();
    await page.evaluateOnNewDocument("window.__name = (t) => t;");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await page.type("#email", e2e.email);
    await page.type("#password", e2e.password);
    await Promise.all([page.waitForFunction(() => location.pathname === "/"), page.click("button[type=submit]")]);

    // 1. Home: both lists are paged, never everything at once.
    const homeStarted = Date.now();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    await page.waitForSelector(`${recentSection} ul > li button`);
    info("home screen load", `${Date.now() - homeStarted} ms`);
    const animalsPager = await pagerOf(page, searchSection);
    const animalItems = await itemsIn(page, searchSection);
    ok("home shows a short animal list with a pager, not all animals", animalItems.length === 4 && animalsPager?.total === animals.length, `${animalItems.length} shown, pager ${JSON.stringify(animalsPager)}`);
    const recentPager = await pagerOf(page, recentSection);
    const recentItems = await itemsIn(page, recentSection);
    ok("home shows the latest sheets with a pager", recentItems.length === 4 && recentPager?.total === sheetCount, `${recentItems.length} shown, pager ${JSON.stringify(recentPager)}`);
    const newest = [...sheetRows].map((row) => row.treatment_date).sort().reverse()[0];
    const firstRecent = await page.$eval(`${recentSection} ul > li`, (li) => (li as HTMLElement).innerText);
    ok("the newest sheet is on top", firstRecent.includes(newest), `${newest} expected`);
    const sortedNames = [...animals.map((x) => x.name)].sort((x, y) => x.localeCompare(y, "hu"));
    info("animal list order", `first on page 1: ${animalItems.join(", ")} (alphabetical expected; first names in the data: ${[...new Set(sortedNames)].slice(0, 3).join(", ")})`);

    // 2. Paging: forward, and how far the end is.
    const nextAnimals = `${searchSection} button[aria-label="${messages.common.nextPage}"]`;
    await page.click(nextAnimals);
    await page.waitForFunction((s) => /2\. oldal/.test((document.querySelector(s) as HTMLElement).innerText), {}, searchSection);
    const page2 = await itemsIn(page, searchSection);
    ok("next page shows other animals", page2.length === 4 && (await pagerOf(page, searchSection))?.page === 2);
    const pages = animalsPager?.pages ?? 0;
    info("reaching the last animal page", `${pages} pages of 4: only previous/next buttons, so the last page is ${pages - 1} taps away`);
    const lastPage = await timedFetch(page, `/api/v1/patients?page=${pages}&pageSize=4`);
    ok("the last animal page loads quickly", lastPage.status === 200 && lastPage.ms < MAX_API_MS, `${lastPage.ms} ms`);
    const lastSheets = await timedFetch(page, `/api/v1/sheets?page=${recentPager?.pages ?? 1}&pageSize=4`);
    ok("the last page of sheets loads quickly", lastSheets.status === 200 && lastSheets.ms < MAX_API_MS, `${lastSheets.ms} ms`);

    // 3. Search.
    const cases: { label: string; q: string }[] = [
      { label: "animal name", q: "Bodri" },
      { label: "animal name in lower case", q: "cirmi" },
      { label: "part of a name", q: "orz" },
      { label: "owner surname", q: "Varga" },
      { label: "owner full name", q: animals[5].owner },
      { label: "owner given name in upper case", q: "ESZTER" },
      { label: "phone number as stored", q: animals[42].phone },
      { label: "end of a phone number", q: animals[42].phone.slice(-4) },
    ];
    for (const c of cases) {
      const ms = await search(page, c.q);
      const shown = await pagerOf(page, searchSection);
      const listed = (await itemsIn(page, searchSection)).length;
      const expected = expectedHits(animals, c.q);
      const total = shown?.total ?? listed;
      ok(`search by ${c.label} ("${c.q}")`, total === expected && expected > 0 && ms < MAX_API_MS + 400, `${total} found, ${expected} expected, ${ms} ms`);
    }
    await search(page, "Nincsilyen");
    ok("a search without hits says so", (await page.$eval(searchSection, (el) => (el as HTMLElement).innerText)).includes(messages.home.searchPlaceholder) && !(await pagerOf(page, searchSection)));

    // Search conveniences that are not promised today: reported, not failed.
    const accentFree = "Kovacs";
    await search(page, accentFree);
    const accentHits = (await pagerOf(page, searchSection))?.total ?? (await itemsIn(page, searchSection)).length;
    info("search without accents", `"${accentFree}" finds ${accentHits} of ${expectedHits(animals, SURNAMES[0])} animals of owners named ${SURNAMES[0]}`);
    const digits = animals[42].phone.replace(/\D/g, "").slice(-7);
    await search(page, digits);
    const digitHits = (await pagerOf(page, searchSection))?.total ?? (await itemsIn(page, searchSection)).length;
    info("phone number typed without spaces", `"${digits}" finds ${digitHits} (the stored number is "${animals[42].phone}")`);

    // 4. A new search starts again on page 1.
    await search(page, "Luna");
    await page.click(nextAnimals);
    await page.waitForFunction((s) => /2\. oldal/.test((document.querySelector(s) as HTMLElement).innerText), {}, searchSection);
    await search(page, "Pajti");
    ok("a new search starts on page 1", (await pagerOf(page, searchSection))?.page === 1 || (await pagerOf(page, searchSection)) === null);

    // 5. One animal's sheets: the dialog lists them, newest first.
    const withThree = animals.findIndex((x) => x.sheets.length === 3);
    await search(page, animals[withThree].phone);
    await page.click(`${searchSection} ul > li button`);
    const dates = [...animals[withThree].sheets].sort().reverse();
    await page
      .waitForFunction((d: string[]) => d.every((x) => (document.querySelector("[role=dialog]") as HTMLElement | null)?.innerText.includes(x)), { timeout: 10000 }, dates)
      .catch(() => undefined);
    const dialogText = await page.$eval("[role=dialog]", (el) => (el as HTMLElement).innerText);
    ok("the animal's sheets dialog lists all its sheets, newest first", dates.every((d) => dialogText.includes(d)) && dialogText.indexOf(dates[0]) < dialogText.indexOf(dates[2]), dates.join(", "));
  } finally {
    await browser.close();
    await e2e.remove();
  }
  console.log(results.join("\n"));
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
}

main().catch((error) => {
  console.log(results.join("\n"));
  console.error("volume check crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
