/**
 * PDF check against a running server (production build recommended):
 *
 *   npm run build && npm run start      (in another terminal; default http://localhost:6438)
 *   npm run check:pdf
 *
 * Creates a marked test user (e2e-…@vetdent-light.test) with a sheet full of Hungarian text, downloads the
 * PDF through GET /api/v1/sheets/{id}/pdf (Bearer token and cookie session), reads the text back out of the
 * PDF and fails unless the long o and u with double acute (and the rest) are intact, the file name is ASCII, the page is A4,
 * strangers get 404/401. The PDF is saved to SCREENSHOT_DIR for a look. Everything created is deleted.
 * Hungarian letters are written as escapes here: source code stays free of them.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/hu.json";
import { createAdminClient } from "../src/server/admin";
import { launchBrowser } from "./lib/browser";
import { createE2eUser, type E2eUser } from "./lib/e2e";
import type { Database } from "../src/server/db/database.types";
import { teethOf } from "../src/domain/teeth/catalog";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6438";
const OUT_DIR = process.env.SCREENSHOT_DIR ?? "screenshots";

const results: string[] = [];
const ok = (name: string, pass: boolean, extra = "") => results.push(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? " - " + extra : ""}`);

// Hungarian letters are built from code points, so the source code stays free of them.
const fromCodes = String.fromCharCode;
const o2 = fromCodes(0x151); // long o
const u2 = fromCodes(0x171); // long u
const O2 = fromCodes(0x150);
const o1 = fromCodes(0xf3);
const e1 = fromCodes(0xe9);
const u1 = fromCodes(0xfc);
const NAME = `${O2}zike`;
const OWNER = `T${u2}z Lajos`;
const MED = `Gy${o1}gyszer ${o2}${u2} 1,5 mg`;
const ADVICE = `Puha ${e1}tel, k${o2}zet ${e1}s f${u2}szer n${e1}lk${u1}l.`;

// Headings are upper-cased by the layout, so compare without case and white space.
const strip = (text: string) => text.replace(/\s+/g, "").toUpperCase();

async function pdfText(bytes: Uint8Array): Promise<{ pages: number; text: string; pageTexts: string[]; width: number; height: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: false }).promise;
  let text = "";
  const pageTexts: string[] = [];
  let width = 0;
  let height = 0;
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    if (n === 1) [, , width, height] = page.view;
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
    text += pageText + "\n";
  }
  return { pages: doc.numPages, text, pageTexts, width, height };
}

async function main() {
  const admin = createAdminClient();
  const created: E2eUser[] = [];

  try {
    const make = async (clinicName: string, displayName: string) => {
      const user = await createE2eUser(admin, {
        clinicName,
        displayName,
        clinicFields: { postal_code: "1118", city: "Budapest", street: "Test street 12.", phone: "+36 1 450 8820", email: "clinic@example.com" },
      });
      created.push(user);
      return user;
    };
    const userA = await make("PDF check clinic", "Jane A");
    const userB = await make("Other clinic", "Jane B");
    const clinicA = userA.clinicId;

    const publishable = () =>
      createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const tokenOf = async (user: E2eUser) => {
      const signedIn = await publishable().auth.signInWithPassword({ email: user.email, password: user.password });
      if (signedIn.error || !signedIn.data.session) throw signedIn.error ?? new Error("sign-in failed");
      return signedIn.data.session.access_token;
    };
    const tokenA = await tokenOf(userA);
    const tokenB = await tokenOf(userB);

    // A dog with a full chart, plus content on every tab.
    const teeth = Object.fromEntries(teethOf("dog").map((tooth) => [tooth.code, { treatments: ["U", "POL"] }]));
    const patient = await admin
      .from("patients")
      .insert({ clinic_id: clinicA, species: "dog", name: NAME, owner_name: OWNER, owner_email: "owner@example.com", sex: "male", breed: "Mixed", estimated_birth_month: "2019-11-01", last_weight_kg: 12.5 })
      .select("id")
      .single();
    if (patient.error) throw patient.error;
    const sheet = await admin
      .from("treatment_sheets")
      .insert({
        clinic_id: clinicA,
        patient_id: patient.data.id,
        treatment_date: "2026-11-21",
        treating_vet: "Dr. Jane A",
        age_years: 6,
        age_months: 4,
        weight_kg: 12.5,
        asa: "II",
        content: {
          anamnesis: { complaints: ["halitosis", "calculus"], otherAnamnesis: ADVICE, homeHygiene: "Brushing weekly" },
          teeth: {
            ...teeth,
            "108": { codes: ["FX-C", "PE", "PD2"], treatments: ["RX", "EXT-SURG"], pocketMm: { mesial: 2, buccal: 4, distal: 2, palatolingual: 2 }, note: "Extracted in sections" },
            "409": { codes: ["T2", "Fur1"], treatments: ["U", "POL", "CURE"] },
            "308": { codes: ["M"] },
          },
          periodontal: { stage: "2", calculusIndex: "T2", gingivitisIndex: "G1-G2", occlusion: "Normal" },
          nerveBlocks: [{ nerve: "infraorbital", side: "right", anesthetic: "lidocaine_2", amountMl: 1.2 }],
          surgery: { suture: "Monocryl 4-0", stitchType: "Simple interrupted", description: "Sectioned." },
          radiology: { imageCount: 4, findings: ADVICE, intraoperative: "None." },
          medications: [{ name: MED, dose: "1 tablet", frequency: "Twice daily", durationDays: 7, instructions: ADVICE }],
          homecare: { feeding: ADVICE, chewingRestrictions: ADVICE, oralHygiene: "", closingNote: "" },
          followUp: { date: "2026-12-01", purpose: "Suture check" },
        },
      })
      .select("id")
      .single();
    if (sheet.error) throw sheet.error;
    const url = `${BASE_URL}/api/v1/sheets/${sheet.data.id}/pdf`;

    // Bearer token
    const started = Date.now();
    const res = await fetch(url, { headers: { authorization: `Bearer ${tokenA}` } });
    const bytes = new Uint8Array(await res.arrayBuffer());
    ok("Bearer: 200 application/pdf", res.status === 200 && (res.headers.get("content-type") ?? "").startsWith("application/pdf"), `${res.status} ${Date.now() - started} ms, ${bytes.length} bytes`);
    ok("starts with %PDF-", new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-");
    const disposition = res.headers.get("content-disposition") ?? "";
    ok("download file name is ASCII and has the animal name and date", disposition === 'attachment; filename="fogaszati-lap_ozike_2026-11-21.pdf"', disposition);
    ok("not cached", res.headers.get("cache-control") === "no-store");

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, "report-dog.pdf"), bytes);

    const parsed = await pdfText(bytes);
    ok("A4 page size", Math.abs(parsed.width - 595.28) < 2 && Math.abs(parsed.height - 841.89) < 2, `${parsed.width} x ${parsed.height} pt`);
    ok("a full dog sheet takes two to four pages", parsed.pages >= 2 && parsed.pages <= 4, `${parsed.pages} pages`);
    const haystack = strip(parsed.text);
    const expected: [string, string][] = [
      ["animal name", NAME],
      ["owner name", OWNER],
      ["medication name", MED],
      ["advice text", ADVICE],
      ["heading with a long o (UI text)", messages.report.history],
      ["heading with a long o and u (UI text)", messages.report.signature],
      ["surgery log heading", messages.report.surgeryLog],
      ["home care heading", messages.report.homecare],
      ["generated-by line", messages.report.generatedBy],
      ["clinic letterhead", "PDF check clinic".toUpperCase()],
      ["clinic address", "1118 Budapest Test street 12."],
    ];
    for (const [label, text] of expected) ok(`PDF text contains: ${label}`, haystack.includes(strip(text)), text);
    const header = strip(`${messages.report.colTooth} ${messages.report.colName}`);
    const withHeader = parsed.pageTexts.filter((pageText) => strip(pageText).includes(header)).length;
    ok("the teeth table header repeats on the page that continues the table", withHeader >= 2, `${withHeader} of ${parsed.pages} pages show the header`);
    ok("no replacement characters in the PDF text", !parsed.text.includes("�"));
    const letters = parsed.text.match(new RegExp(`[${o2}${u2}${O2}${fromCodes(0x170)}]`, "g"))?.length ?? 0;
    ok("the PDF contains the long o and u letters", letters > 10, `${letters} occurrences`);

    // The same print view as an image, for a look at the layout (PDF pages cannot be rendered here).
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123 });
      await page.emulateMediaType("print");
      await page.setExtraHTTPHeaders({ authorization: `Bearer ${tokenA}` });
      await page.goto(`${BASE_URL}/print/sheets/${sheet.data.id}`, { waitUntil: "networkidle0" });
      await page.waitForSelector("[data-report-ready]");
      await new Promise((resolve) => setTimeout(resolve, 600));
      await page.screenshot({ path: join(OUT_DIR, "report-dog-print.png"), fullPage: true });
    } finally {
      await browser.close();
    }

    // Cookie session (what the browser uses)
    const login = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE_URL },
      body: JSON.stringify({ email: userA.email, password: userA.password }),
    });
    const cookie = login.headers.getSetCookie().map((line) => line.split(";")[0]).join("; ");
    const viaCookie = await fetch(url, { headers: { cookie } });
    const cookieBytes = new Uint8Array(await viaCookie.arrayBuffer());
    ok("cookie session: 200 PDF", viaCookie.status === 200 && new TextDecoder().decode(cookieBytes.slice(0, 5)) === "%PDF-", String(viaCookie.status));

    // Strangers
    const foreign = await fetch(url, { headers: { authorization: `Bearer ${tokenB}` } });
    ok("another clinic's user gets 404", foreign.status === 404, String(foreign.status));
    const anonymous = await fetch(url);
    ok("without credentials: 401", anonymous.status === 401, String(anonymous.status));
    const notFound = await fetch(`${BASE_URL}/api/v1/sheets/not-an-id/pdf`, { headers: { authorization: `Bearer ${tokenA}` } });
    ok("a malformed id gives 404", notFound.status === 404, String(notFound.status));
    const printPage = await fetch(`${BASE_URL}/print/sheets/${sheet.data.id}`, { redirect: "manual" });
    ok("the print page is not public (redirects to sign-in)", printPage.status === 307, String(printPage.status));
  } finally {
    for (const user of created) await user.remove();
  }

  console.log(results.join("\n"));
  process.exit(results.some((line) => line.startsWith("FAIL")) ? 1 : 0);
}

main().catch((error) => {
  console.log(results.join("\n"));
  console.error("check:pdf crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
