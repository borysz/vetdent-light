/**
 * Browser flow check with a real Chrome against a running server (production build recommended):
 * create a sheet, status and required fields, local draft restore, leave guard, save conflict (409), sign-in.
 * Uses a marked test user (e2e-…@vetdent-light.test) and deletes everything it created.
 *
 *   npm run check:flow
 */
import { randomBytes } from "node:crypto";
import puppeteer, { type Page } from "puppeteer-core";
import messages from "../messages/hu.json";
import { createAdminClient } from "../src/server/admin";

const BASE = process.env.BASE_URL ?? "http://localhost:6438";
const CHROME_PATH = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const results: string[] = [];
const ok = (name: string, pass: boolean, extra = "") =>
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? " - " + extra : ""}`);
const bodyText = (page: Page) => page.evaluate(() => document.body.innerText);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", password);
  await Promise.all([page.waitForFunction(() => location.pathname === "/"), page.click("button[type=submit]")]);
}

/** Type into the input whose label starts with the given text. */
async function fillByLabel(page: Page, label: string, value: string) {
  const id = await page.evaluate(
    (l) => [...document.querySelectorAll("label")].find((el) => el.textContent?.trim().startsWith(l))?.htmlFor ?? "",
    label,
  );
  if (!id) throw new Error(`no label starting with ${label}`);
  await page.click(`#${id}`, { count: 3 });
  await page.type(`#${id}`, value);
}

async function clickText(page: Page, text: string) {
  await page.waitForFunction((t) => [...document.querySelectorAll("button")].some((b) => b.textContent?.includes(t) && !b.disabled), {}, text);
  await page.evaluate((t) => {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(t) && !b.disabled);
    (button as HTMLButtonElement).click();
  }, text);
}

async function main() {
  const admin = createAdminClient();
  const email = `e2e-${randomBytes(3).toString("hex")}@vetdent-light.test`;
  const password = randomBytes(24).toString("base64url");
  const user = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const clinic = await admin.from("clinics").insert({ name: "e2e flow" }).select("id").single();
  await admin.from("clinic_members").insert({ clinic_id: clinic.data!.id, user_id: user.data.user!.id, display_name: "E2E Flow", title: "Dr." });
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument("window.__name = (t) => t;");
    page.on("dialog", (dialog) => dialog.accept());
    await page.setViewport({ width: 1280, height: 800 });
    await login(page, email, password);

    // 1. create a new dog sheet
    await page.goto(`${BASE}/sheets/new?species=dog`, { waitUntil: "networkidle2" });
    await page.waitForSelector("input[type=date]");
    const vetId = await page.evaluate((l) => [...document.querySelectorAll("label")].find((el) => el.textContent?.trim().startsWith(l))?.htmlFor ?? "", messages.card.treatingVet);
    const vetValue = await page.$eval(`#${vetId}`, (input) => (input as HTMLInputElement).value);
    ok("treating vet defaults to the signed-in user", vetValue === "Dr. E2E Flow", vetValue);
    ok("new sheet starts as not saved", (await bodyText(page)).includes(messages.editor.notSaved));
    await clickText(page, messages.header.save);
    await pause(600);
    ok("saving an empty card shows required errors", (await bodyText(page)).includes(messages.card.required));
    await fillByLabel(page, messages.card.patientName, "FlowDog");
    await fillByLabel(page, messages.card.ownerName, "Flow Owner");
    await fillByLabel(page, messages.card.weight, "12,5");
    await clickText(page, messages.header.save);
    await page.waitForFunction(() => /\/sheets\/[0-9a-f-]{36}/.test(location.pathname), { timeout: 15000 });
    const savedPath = new URL(page.url()).pathname;
    ok("saving creates the sheet and moves to /sheets/<id>", /^\/sheets\/[0-9a-f-]{36}$/.test(savedPath), savedPath);
    await pause(500);
    ok("status shows Mentve", /Mentve \d\d:\d\d/.test(await bodyText(page)));
    const row = await admin.from("patients").select("name,owner_name,last_weight_kg,species").eq("name", "FlowDog").maybeSingle();
    ok("patient is in the database", row.data?.owner_name === "Flow Owner" && row.data?.last_weight_kg === 12.5 && row.data?.species === "dog");

    // 1b. chart: select all teeth, quick entry, scale and polish everything
    const polished = () =>
      page.evaluate(() => [...document.querySelectorAll("[data-other-cell]")].filter((cell) => (cell.textContent ?? "").includes("POL")).length);
    ok("the dog chart shows 42 teeth", (await page.$$("[data-chart] [data-tooth]")).length === 42);
    await clickText(page, messages.chart.selectAll);
    await clickText(page, messages.chart.quickFor.split(" ")[0]);
    await page.waitForSelector("[role=dialog]");
    const quickText = await page.$eval("[role=dialog]", (dialog) => dialog.textContent ?? "");
    ok("tooth resorption (TR) is not offered for a dog", !quickText.includes("TR1"));
    await clickText(page, messages.quick.scaleAndPolish);
    await page.keyboard.press("Escape");
    await pause(300);
    ok("one click puts U+POL on every tooth", (await polished()) === 42, String(await polished()));
    await page.click('[data-tooth="308"]');
    await page.waitForSelector("[role=dialog] [role=tab]");
    await page.evaluate(() => {
      const missing = [...document.querySelectorAll("[role=dialog] button")].find((b) => b.textContent?.trim() === "M");
      (missing as HTMLButtonElement).click();
    });
    await clickText(page, messages.toothEditor.done);
    await pause(300);
    ok("marking a tooth missing removes its treatments", (await polished()) === 41, String(await polished()));
    await clickText(page, messages.header.save);
    await page.waitForFunction(() => /Mentve \d\d:\d\d/.test(document.body.innerText) && !document.body.innerText.includes("Nem mentett"), { timeout: 15000 });
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector("[data-chart] [data-tooth]");
    ok("the chart is stored and comes back after a reload", (await polished()) === 41, String(await polished()));
    await page.click(`[aria-label="${messages.card.expand}"]`);

    // 1c. tab 2 (nerve block) and tab 3 (medication template) are stored too
    const sectionSelector = (title: string) => `section[aria-label="${title}"]`;
    await page.click(`[aria-label="${messages.tabs.anesthesia}"]`);
    await clickText(page, messages.anesthesia.addBlock);
    const blockSelects = await page.$$(`${sectionSelector(messages.anesthesia.nerveBlocksTitle)} li select`);
    await blockSelects[0].select("infraorbital");
    await blockSelects[1].select("right");
    await blockSelects[2].select("lidocaine_2");
    await fillByLabel(page, messages.anesthesia.amount, "1,2");
    await page.click(`[aria-label="${messages.tabs.homecare}"]`);
    await clickText(page, messages.homecare.templatePainkiller);
    const medicationValues = () =>
      page.evaluate(
        (labels) =>
          labels.map((label) => {
            const id = [...document.querySelectorAll("label")].find((el) => el.textContent?.trim().startsWith(label))?.htmlFor ?? "";
            return (document.getElementById(id) as HTMLInputElement | null)?.value ?? "<missing>";
          }),
        [messages.homecare.name, messages.homecare.dose, messages.homecare.days],
      );
    const [medName, medDose, medDays] = await medicationValues();
    ok("the painkiller template fills name and duration but leaves the dose empty", medName.includes("Meloxidyl") && medDose === "" && medDays === "5", `${medName} | dose '${medDose}' | ${medDays}`);
    await clickText(page, messages.header.save);
    await page.waitForFunction(() => /Mentve \d\d:\d\d/.test(document.body.innerText) && !document.body.innerText.includes("Nem mentett"), { timeout: 15000 });
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector(sectionSelector(messages.homecare.medsTitle));
    ok("the medication is stored and the dose is still empty", (await medicationValues())[0].includes("Meloxidyl") && (await medicationValues())[1] === "");
    await page.click(`[aria-label="${messages.tabs.anesthesia}"]`);
    const stored = await page.evaluate((selector) => {
      const row = document.querySelector(selector + " li");
      const selects = [...(row?.querySelectorAll("select") ?? [])].map((el) => (el as HTMLSelectElement).value);
      const amount = (row?.querySelector("input") as HTMLInputElement | null)?.value;
      return { selects, amount };
    }, sectionSelector(messages.anesthesia.nerveBlocksTitle));
    ok("the nerve block is stored with the decimal comma", stored.selects.join(",") === "infraorbital,right,lidocaine_2" && stored.amount === "1,2", JSON.stringify(stored));
    await page.click(`[aria-label="${messages.tabs.odontogram}"]`);
    await page.waitForSelector("[data-chart] [data-tooth]");
    await page.click(`[aria-label="${messages.card.expand}"]`);

    // 2. dirty state, then draft restore after a reload
    await fillByLabel(page, messages.card.breed, "Beagle");
    ok("an edit makes the status unsaved", (await bodyText(page)).includes(messages.editor.unsaved));
    await pause(900);
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector("main h2");
    ok("reload offers the unsaved draft", (await bodyText(page)).includes(messages.editor.restoreDraft));
    await clickText(page, messages.editor.restoreDraft);
    await pause(400);
    ok("restoring brings the edit back as unsaved", (await bodyText(page)).includes(messages.editor.unsaved));

    // 3. leave guard
    await page.click(`[aria-label="${messages.header.home}"]`);
    await pause(400);
    ok("leaving with unsaved changes asks first", (await bodyText(page)).includes(messages.editor.leaveTitle));
    await clickText(page, messages.editor.stay);
    await pause(300);
    ok("Stay keeps the editor open", new URL(page.url()).pathname === savedPath);

    // 4. conflict: another session saves first
    const sheetId = savedPath.split("/").pop()!;
    const other = await browser.newPage();
    await other.evaluateOnNewDocument("window.__name = (t) => t;");
    await other.setViewport({ width: 1280, height: 800 });
    await other.goto(`${BASE}/sheets/${sheetId}`, { waitUntil: "networkidle2" });
    await other.waitForSelector("main h2");
    await other.click(`[aria-label="${messages.card.expand}"]`);
    await fillByLabel(other, messages.card.breed, "Labrador");
    await clickText(other, messages.header.save);
    await other.waitForFunction(() => /Mentve \d\d:\d\d/.test(document.body.innerText));
    await other.close();
    await page.bringToFront();
    await clickText(page, messages.header.save);
    await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: 15000 }, messages.editor.conflictTitle);
    ok("a stale save opens the conflict dialog", true);
    await clickText(page, messages.editor.keepMine);
    await page.waitForFunction(() => /Mentve \d\d:\d\d/.test(document.body.innerText) && !document.body.innerText.includes("Nem mentett"), { timeout: 15000 });
    const after = await admin.from("patients").select("breed").eq("name", "FlowDog").single();
    ok("Keep mine saves my version on top", after.data?.breed === "Beagle", String(after.data?.breed));

    // 5. a clean sheet leaves without asking
    await page.click(`[aria-label="${messages.header.home}"]`);
    await page.waitForFunction(() => location.pathname === "/", { timeout: 8000 });
    ok("clean sheet leaves without a question", true);
    await page.waitForFunction(() => document.body.innerText.includes("FlowDog"), { timeout: 10000 }).catch(() => undefined);
    ok("home lists the saved animal and its sheet", (await bodyText(page)).includes("FlowDog"));
  } finally {
    await browser.close();
    await admin.from("clinics").delete().eq("id", clinic.data!.id);
    await admin.auth.admin.deleteUser(user.data.user!.id);
  }
  console.log(results.join("\n"));
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
}
main().catch((error) => {
  console.log(results.join("\n"));
  console.error("flow crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
