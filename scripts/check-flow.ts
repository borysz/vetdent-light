/**
 * Browser flow check with a real Chrome against a running server (production build recommended):
 * create a sheet, status and required fields, local draft restore, leave guard, save conflict (409), sign-in,
 * forgotten password (reset link generated with the admin API, so no e-mail is sent).
 * Uses a marked test user (e2e-…@vetdent-light.test) and deletes everything it created.
 *
 *   npm run check:flow
 */
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "puppeteer-core";
import messages from "../messages/hu.json";
import { createAdminClient } from "../src/server/admin";
import { launchBrowser } from "./lib/browser";
import { createE2eUser } from "./lib/e2e";

const BASE = process.env.BASE_URL ?? "http://localhost:6438";
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
  const e2e = await createE2eUser(admin, { clinicName: "e2e flow", displayName: "E2E Flow" });
  const { email, password } = e2e;
  const browser = await launchBrowser();
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

    // 1d. report tab: live A4 preview, warning before the PDF, real download
    const downloadDir = mkdtempSync(join(tmpdir(), "vetdent-pdf-"));
    const cdp = await page.createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
    await page.click(`[aria-label="${messages.tabs.report}"]`);
    await page.waitForSelector("[data-report]");
    ok("the A4 preview shows the entered data", (await page.$eval("[data-report]", (el) => el.textContent ?? "")).includes("FlowDog"));
    await clickText(page, messages.reportTab.pdf);
    await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: 10000 }, messages.reportTab.preflightMissing);
    ok("empty required advice warns before the PDF is made", true);
    await clickText(page, messages.reportTab.fillIn);
    await page.waitForSelector(sectionSelector(messages.homecare.adviceTitle));
    ok("the warning leads to the home care tab", true);
    await fillByLabel(page, messages.homecare.feeding, "Soft food for ten days");
    await fillByLabel(page, messages.homecare.chewing, "No chew toys");
    await clickText(page, messages.header.save);
    await page.waitForFunction(() => /Mentve \d\d:\d\d/.test(document.body.innerText) && !document.body.innerText.includes("Nem mentett"), { timeout: 15000 });
    await page.click(`[aria-label="${messages.tabs.report}"]`);
    await page.waitForSelector("[data-report]");
    await clickText(page, messages.reportTab.pdf);
    const spinning = await page.waitForSelector("[data-pdf-spinner]", { timeout: 3000 }).then(() => true, () => false);
    const headerBusy = await page.$eval("header [data-pdf-button]", (button) => button.getAttribute("aria-label")).catch(() => "");
    ok("while the PDF is made, the buttons show a spinner and say so", spinning && headerBusy === messages.header.pdfBusy, String(headerBusy));
    let downloaded = "";
    for (let waited = 0; waited < 45000 && !downloaded; waited += 500) {
      downloaded = readdirSync(downloadDir).find((name) => name.endsWith(".pdf")) ?? "";
      if (!downloaded) await pause(500);
    }
    ok("the PDF is downloaded with an ASCII file name", /^fogaszati-lap_flowdog_\d{4}-\d{2}-\d{2}\.pdf$/.test(downloaded), downloaded || "no file");
    const spinnerGone = await page.waitForFunction(() => !document.querySelector("[data-pdf-spinner]"), { timeout: 10000 }).then(() => true, () => false);
    ok("the spinner stops when the PDF is ready", spinnerGone);
    // Direct printing from the browser: the app chrome is hidden, the report stays.
    await page.emulateMediaType("print");
    const printed = await page.evaluate(() => ({
      header: getComputedStyle(document.querySelector("header") as Element).display,
      card: getComputedStyle(document.querySelector("main > div.print\\:hidden") as Element).display,
      report: getComputedStyle(document.querySelector("[data-report]") as Element).display,
    }));
    await page.emulateMediaType("screen");
    ok("printing from the browser hides the header and the patient card but keeps the report", printed.header === "none" && printed.card === "none" && printed.report !== "none", JSON.stringify(printed));
    await page.click(`[aria-label="${messages.tabs.odontogram}"]`);
    await page.waitForSelector("[data-chart] [data-tooth]");
    const expandButton = await page.$(`[aria-label="${messages.card.expand}"]`);
    if (expandButton) await expandButton.click();

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

    // 5b. the user menu offers Change password; Cancel goes back home
    await page.click(`[aria-label="${messages.header.userMenu}"]`);
    await page.waitForSelector("[role=menuitem]");
    await page.evaluate((t) => {
      const entry = [...document.querySelectorAll("[role=menuitem]")].find((el) => el.textContent?.includes(t));
      (entry as HTMLElement).click();
    }, messages.header.changePassword);
    await page.waitForFunction(() => location.pathname === "/reset-password", { timeout: 10000 });
    ok("the user menu leads to the change password form", Boolean(await page.$("#new-password")));
    await Promise.all([
      page.waitForFunction(() => location.pathname === "/", { timeout: 10000 }),
      page.evaluate((t) => [...document.querySelectorAll("a")].find((a) => a.textContent?.includes(t))?.click(), messages.resetPassword.cancel),
    ]);
    ok("Cancel on the change password form goes back home", true);

    // 6. forgotten password: link on the sign-in page, reset link, new password, sign in with it
    const guest = await (await browser.createBrowserContext()).newPage();
    await guest.evaluateOnNewDocument("window.__name = (t) => t;");
    await guest.setViewport({ width: 1280, height: 800 });
    await guest.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await Promise.all([
      guest.waitForFunction(() => location.pathname === "/forgot-password"),
      guest.evaluate((t) => [...document.querySelectorAll("a")].find((a) => a.textContent?.includes(t))?.click(), messages.login.forgotPassword),
    ]);
    ok("the sign-in page links to the forgotten password form", (await bodyText(guest)).includes(messages.forgotPassword.title));
    const link = await admin.auth.admin.generateLink({ type: "recovery", email });
    const tokenHash = link.data.properties?.hashed_token ?? "";
    ok("a recovery link can be generated", Boolean(tokenHash), link.error?.message ?? "");
    const confirmUrl = `${BASE}/auth/confirm?token_hash=${tokenHash}&type=recovery`;
    await guest.goto(confirmUrl, { waitUntil: "networkidle2" });
    ok("the reset link signs in and opens the new password form", new URL(guest.url()).pathname === "/reset-password", new URL(guest.url()).pathname);
    const newPassword = randomBytes(18).toString("base64url");
    await guest.type("#new-password", newPassword);
    await guest.type("#new-password-again", newPassword + "x");
    await guest.click("button[type=submit]");
    await pause(300);
    ok("different passwords are refused", (await bodyText(guest)).includes(messages.resetPassword.mismatch));
    await guest.click("#new-password-again", { count: 3 });
    await guest.type("#new-password-again", newPassword);
    await Promise.all([guest.waitForFunction(() => location.pathname === "/", { timeout: 15000 }), guest.click("button[type=submit]")]);
    ok("saving the new password opens the app", true);
    const fresh = await (await browser.createBrowserContext()).newPage();
    await fresh.evaluateOnNewDocument("window.__name = (t) => t;");
    await login(fresh, email, newPassword);
    ok("the new password signs in", new URL(fresh.url()).pathname === "/");
    const signedOut = await (await browser.createBrowserContext()).newPage();
    await signedOut.evaluateOnNewDocument("window.__name = (t) => t;");
    await signedOut.goto(confirmUrl, { waitUntil: "networkidle2" });
    ok("a used reset link is refused", (await bodyText(signedOut)).includes(messages.forgotPassword.linkInvalid), signedOut.url().replace(BASE, ""));
  } finally {
    await browser.close();
    await e2e.remove();
  }
  console.log(results.join("\n"));
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
}
main().catch((error) => {
  console.log(results.join("\n"));
  console.error("flow crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
