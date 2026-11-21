/**
 * API integration tests against the real Supabase project. They create their own marked data
 * (itest-<run>-…@vetdent-light.test, clinics named "itest <run> …") and delete it afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as clinicGET, PUT as clinicPUT } from "@/app/api/v1/clinic/route";
import { GET as healthGET } from "@/app/api/v1/health/route";
import { GET as meGET } from "@/app/api/v1/auth/me/route";
import { PUT as passwordPUT } from "@/app/api/v1/auth/password/route";
import { POST as passwordResetPOST } from "@/app/api/v1/auth/password-reset/route";
import { GET as openapiGET } from "@/app/api/v1/openapi.json/route";
import { GET as patientGET, PATCH as patientPATCH } from "@/app/api/v1/patients/[id]/route";
import { GET as patientSheetsGET } from "@/app/api/v1/patients/[id]/sheets/route";
import { GET as patientsGET, POST as patientsPOST } from "@/app/api/v1/patients/route";
import { GET as sheetGET, PUT as sheetPUT } from "@/app/api/v1/sheets/[id]/route";
import { GET as sheetsGET, POST as sheetsPOST } from "@/app/api/v1/sheets/route";
import { call, cleanup, clientFor, createTestUser, runId, signIn, type TestUser } from "../helpers/fixtures";

const hasEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

const patientCard = (name: string, over: Record<string, unknown> = {}) => ({
  species: "dog",
  name,
  breed: "Golden Retriever",
  sex: "male",
  ownerName: `Owner ${name}`,
  ownerEmail: "gazdi@example.com",
  ownerPhone: "+36 30 000 0000",
  ...over,
});

const newSheet = (name: string, over: Record<string, unknown> = {}) => ({
  treatmentDate: "2026-03-05",
  treatingVet: "Dr. Test",
  ageYears: 6,
  ageMonths: 4,
  weightKg: 32.5,
  asa: "II",
  content: {},
  patient: patientCard(name),
  ...over,
});

describe.skipIf(!hasEnv)("API v1 (real Supabase)", () => {
  let alice: TestUser; // member of clinic A
  let bob: TestUser; // member of clinic B
  let outsider: TestUser; // signed in, but in no clinic

  beforeAll(async () => {
    alice = await createTestUser("alice");
    bob = await createTestUser("bob");
    outsider = await createTestUser("outsider", { clinic: false });
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("authentication", () => {
    it("answers 401 without credentials", async () => {
      const res = await call(patientsGET, "/api/v1/patients");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("unauthenticated");
    });

    it("answers 401 for a garbage token", async () => {
      const res = await call(patientsGET, "/api/v1/patients", { token: "not-a-jwt" });
      expect(res.status).toBe(401);
    });

    it("answers 403 for a signed-in user who belongs to no clinic", async () => {
      for (const [handler, path] of [
        [meGET, "/api/v1/auth/me"],
        [patientsGET, "/api/v1/patients"],
        [sheetsGET, "/api/v1/sheets"],
        [clinicGET, "/api/v1/clinic"],
      ] as const) {
        const res = await call(handler, path, { token: outsider.token });
        expect(res.status, path).toBe(403);
        expect(res.body.error.code).toBe("not_a_member");
      }
    });

    it("returns the user and clinic from /auth/me", async () => {
      const res = await call(meGET, "/api/v1/auth/me", { token: alice.token });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(alice.email);
      expect(res.body.clinic.id).toBe(alice.clinicId);
      expect(res.body.member.title).toBe("Dr.");
    });

    it("refuses a cookie-session write from another origin (CSRF)", async () => {
      const res = await call(patientsPOST, "/api/v1/patients", {
        method: "POST",
        body: patientCard("Csrf"),
        headers: { origin: "http://evil.example" },
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("origin_not_allowed");
    });
  });

  describe("password", () => {
    it("checks the reset request before any e-mail is sent", async () => {
      const bad = await call(passwordResetPOST, "/api/v1/auth/password-reset", {
        method: "POST",
        body: { email: "not-an-address" },
        headers: { origin: "http://localhost" },
      });
      expect(bad.status).toBe(422);
      const noOrigin = await call(passwordResetPOST, "/api/v1/auth/password-reset", { method: "POST", body: { email: alice.email } });
      expect(noOrigin.status).toBe(403);
    });

    it("sets a new password for the signed-in user", async () => {
      const user = await createTestUser("password");
      const short = await call(passwordPUT, "/api/v1/auth/password", { method: "PUT", token: user.token, body: { password: "short" } });
      expect(short.status).toBe(422);
      const anonymous = await call(passwordPUT, "/api/v1/auth/password", {
        method: "PUT",
        body: { password: "long enough password" },
        headers: { origin: "http://localhost" },
      });
      expect(anonymous.status).toBe(401);

      const password = `new-${runId}-${Date.now()}`;
      const changed = await call(passwordPUT, "/api/v1/auth/password", { method: "PUT", token: user.token, body: { password } });
      expect(changed.status).toBe(204);
      expect(await signIn(user.email, password)).toBe(true);
      const same = await call(passwordPUT, "/api/v1/auth/password", { method: "PUT", token: user.token, body: { password } });
      expect(same.status).toBe(422);
      expect(same.body.error.code).toBe("same_password");
    });
  });

  describe("public endpoints", () => {
    it("serves health and the OpenAPI description", async () => {
      expect((await call(healthGET, "/api/v1/health")).body).toEqual({ status: "ok" });
      const spec = await call(openapiGET, "/api/v1/openapi.json");
      expect(spec.status).toBe(200);
      expect(spec.body.openapi).toBe("3.1.0");
      expect(Object.keys(spec.body.paths)).toContain("/sheets/{id}");
    });
  });

  describe("sheets and patients", () => {
    it("creates a new patient and its first sheet, and derives the birth month from the age", async () => {
      const res = await call(sheetsPOST, "/api/v1/sheets", { token: alice.token, method: "POST", body: newSheet(`Max-${runId}`) });
      expect(res.status).toBe(201);
      expect(res.body.version).toBe(1);
      expect(res.body.patient.species).toBe("dog");
      expect(res.body.patient.estimatedBirthMonth).toBe("2019-11");
      expect(res.body.patient.lastWeightKg).toBe(32.5);
      expect(res.body.content.teeth).toEqual({});
      expect(res.body.content.anamnesis.complaints).toEqual([]);
    });

    it("lists a patient's sheets with the newest treatment first", async () => {
      const first = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: newSheet(`Order-${runId}`, { treatmentDate: "2026-03-05" }),
      });
      const patientId = first.body.patientId as string;
      const older = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: { ...newSheet("x", { treatmentDate: "2026-01-10" }), patient: undefined, patientId },
      });
      const sameDayLater = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: { ...newSheet("x", { treatmentDate: "2026-03-05" }), patient: undefined, patientId },
      });
      expect(older.status).toBe(201);
      expect(sameDayLater.status).toBe(201);

      const list = await call(patientSheetsGET, `/api/v1/patients/${patientId}/sheets`, {
        token: alice.token,
        params: { id: patientId },
      });
      expect(list.status).toBe(200);
      expect(list.body.items.map((s: { id: string }) => s.id)).toEqual([
        sameDayLater.body.id,
        first.body.id,
        older.body.id,
      ]);
      expect(list.body.total).toBe(3);
    });

    it("summarises the treatments used on a sheet", async () => {
      const created = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: newSheet(`Proc-${runId}`, {
          content: {
            teeth: {
              "108": { treatments: ["U", "POL"] },
              "401": { treatments: ["POL", "CURE"] },
            },
          },
        }),
      });
      const list = await call(patientSheetsGET, `/api/v1/patients/${created.body.patientId}/sheets`, {
        token: alice.token,
        params: { id: created.body.patientId },
      });
      expect(list.body.items[0].procedures).toEqual(["CURE", "POL", "U"]);
    });

    it("rolls the patient back when the first sheet cannot be saved (atomic)", async () => {
      const name = `Atomic-${runId}`;
      const { error } = await clientFor(alice).rpc("create_patient_with_sheet", {
        p_clinic_id: alice.clinicId!,
        p_patient: { species: "dog", name, ownerName: "Owner" },
        p_sheet: { treatmentDate: null },
      });
      expect(error).not.toBeNull();
      const { data } = await clientFor(alice).from("patients").select("id").eq("name", name);
      expect(data).toEqual([]);
    });

    it("answers 409 version_conflict on a stale save and keeps the other edit", async () => {
      const created = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: newSheet(`Lock-${runId}`),
      });
      const id = created.body.id as string;
      const edit = (note: string, version: number) => ({
        ...newSheet("x"),
        patient: undefined,
        version,
        content: { anamnesis: { otherAnamnesis: note } },
      });

      const first = await call(sheetPUT, `/api/v1/sheets/${id}`, { token: alice.token, method: "PUT", params: { id }, body: edit("first", 1) });
      expect(first.status).toBe(200);
      expect(first.body.version).toBe(2);

      const stale = await call(sheetPUT, `/api/v1/sheets/${id}`, { token: alice.token, method: "PUT", params: { id }, body: edit("stale", 1) });
      expect(stale.status).toBe(409);
      expect(stale.body.error.code).toBe("version_conflict");

      const current = await call(sheetGET, `/api/v1/sheets/${id}`, { token: alice.token, params: { id } });
      expect(current.body.version).toBe(2);
      expect(current.body.content.anamnesis.otherAnamnesis).toBe("first");
    });

    it("saves the patient card together with the sheet", async () => {
      const created = await call(sheetsPOST, "/api/v1/sheets", { token: alice.token, method: "POST", body: newSheet(`Card-${runId}`) });
      const id = created.body.id as string;
      const res = await call(sheetPUT, `/api/v1/sheets/${id}`, {
        token: alice.token,
        method: "PUT",
        params: { id },
        body: { ...newSheet("x"), version: 1, patient: patientCard(`Card-${runId}`, { breed: "Labrador", ownerPhone: "" }), weightKg: 33 },
      });
      expect(res.status).toBe(200);
      expect(res.body.patient.breed).toBe("Labrador");
      expect(res.body.patient.ownerPhone).toBeNull();
      expect(res.body.patient.lastWeightKg).toBe(33);
    });

    it("locks the species once the patient has a sheet", async () => {
      const created = await call(sheetsPOST, "/api/v1/sheets", { token: alice.token, method: "POST", body: newSheet(`Species-${runId}`) });
      const id = created.body.patientId as string;
      const res = await call(patientPATCH, `/api/v1/patients/${id}`, { token: alice.token, method: "PATCH", params: { id }, body: { species: "cat" } });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("species_locked");
    });

    it("lets the species change while the patient has no sheet", async () => {
      const created = await call(patientsPOST, "/api/v1/patients", { token: alice.token, method: "POST", body: patientCard(`Fresh-${runId}`) });
      expect(created.status).toBe(201);
      const id = created.body.id as string;
      const res = await call(patientPATCH, `/api/v1/patients/${id}`, { token: alice.token, method: "PATCH", params: { id }, body: { species: "cat" } });
      expect(res.status).toBe(200);
      expect(res.body.species).toBe("cat");
    });
  });

  describe("clinic isolation (RLS)", () => {
    let patientId: string;
    let sheetId: string;

    beforeAll(async () => {
      const created = await call(sheetsPOST, "/api/v1/sheets", { token: alice.token, method: "POST", body: newSheet(`Secret-${runId}`) });
      patientId = created.body.patientId;
      sheetId = created.body.id;
    });

    it("hides another clinic's patient and sheet (404) and its lists (empty)", async () => {
      expect((await call(patientGET, `/api/v1/patients/${patientId}`, { token: bob.token, params: { id: patientId } })).status).toBe(404);
      expect((await call(sheetGET, `/api/v1/sheets/${sheetId}`, { token: bob.token, params: { id: sheetId } })).status).toBe(404);
      expect((await call(patientSheetsGET, `/api/v1/patients/${patientId}/sheets`, { token: bob.token, params: { id: patientId } })).status).toBe(404);

      const patients = await call(patientsGET, "/api/v1/patients", { token: bob.token });
      expect(patients.body.total).toBe(0);
      const sheets = await call(sheetsGET, "/api/v1/sheets", { token: bob.token });
      expect(sheets.body.total).toBe(0);
    });

    it("refuses writes against another clinic's data", async () => {
      const save = await call(sheetPUT, `/api/v1/sheets/${sheetId}`, {
        token: bob.token,
        method: "PUT",
        params: { id: sheetId },
        body: { ...newSheet("x"), patient: undefined, version: 1 },
      });
      expect(save.status).toBe(404);

      const attach = await call(sheetsPOST, "/api/v1/sheets", {
        token: bob.token,
        method: "POST",
        body: { ...newSheet("x"), patient: undefined, patientId },
      });
      expect(attach.status).toBe(404);

      const edit = await call(patientPATCH, `/api/v1/patients/${patientId}`, { token: bob.token, method: "PATCH", params: { id: patientId }, body: { name: "Hacked" } });
      expect(edit.status).toBe(404);
    });

    it("enforces isolation in the database itself, not only in the API", async () => {
      const { data } = await clientFor(bob).from("patients").select("id").eq("id", patientId);
      expect(data).toEqual([]);
      const { error } = await clientFor(bob)
        .from("patients")
        .insert({ clinic_id: alice.clinicId!, species: "dog", name: "Smuggled", owner_name: "x" });
      expect(error).not.toBeNull();
    });

    it("keeps the clinic data editable only by its own members", async () => {
      const own = await call(clinicPUT, "/api/v1/clinic", {
        token: alice.token,
        method: "PUT",
        body: { name: `itest ${runId} alice`, city: "Budapest", postalCode: "1118", street: "Test street 1.", phone: "", email: "rendelo@example.com" },
      });
      expect(own.status).toBe(200);
      expect(own.body.city).toBe("Budapest");
      expect(own.body.phone).toBeNull();
      // Bob's own clinic is unaffected.
      const bobs = await call(clinicGET, "/api/v1/clinic", { token: bob.token });
      expect(bobs.body.id).toBe(bob.clinicId);
      expect(bobs.body.city).toBeNull();
    });
  });

  describe("validation and search", () => {
    it("rejects bad input with 422 and field keys", async () => {
      const both = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: { ...newSheet("x"), patientId: "7f1c2a40-0000-4000-8000-000000000000" },
      });
      expect(both.status).toBe(422);
      expect(both.body.error.code).toBe("validation_failed");
      expect(both.body.error.fields).toBeDefined();

      const badDate = await call(sheetsPOST, "/api/v1/sheets", { token: alice.token, method: "POST", body: newSheet("x", { treatmentDate: "2026-02-31" }) });
      expect(badDate.status).toBe(422);

      const noOwner = await call(sheetsPOST, "/api/v1/sheets", {
        token: alice.token,
        method: "POST",
        body: newSheet("x", { patient: patientCard("x", { ownerName: "  " }) }),
      });
      expect(noOwner.status).toBe(422);
      expect(noOwner.body.error.fields["patient.ownerName"]).toBeDefined();

      const badEmail = await call(patientsPOST, "/api/v1/patients", { token: alice.token, method: "POST", body: patientCard("x", { ownerEmail: "nem-email" }) });
      expect(badEmail.status).toBe(422);
    });

    it("answers 400 for non-JSON bodies and malformed JSON", async () => {
      const wrongType = await call(patientsPOST, "/api/v1/patients", { token: alice.token, method: "POST", rawBody: "x", headers: { "content-type": "text/plain" } });
      expect(wrongType.status).toBe(400);
      const malformed = await call(patientsPOST, "/api/v1/patients", { token: alice.token, method: "POST", rawBody: "{nope" });
      expect(malformed.status).toBe(400);
    });

    it("returns 404 for ids that are not UUIDs", async () => {
      const res = await call(patientGET, "/api/v1/patients/abc", { token: alice.token, params: { id: "abc" } });
      expect(res.status).toBe(404);
    });

    it("searches by animal name, owner name and phone, and treats % literally", async () => {
      await call(patientsPOST, "/api/v1/patients", {
        token: alice.token,
        method: "POST",
        body: patientCard(`Bodri-${runId}`, { ownerName: `Smith John ${runId}`, ownerPhone: "+36 20 555 1234" }),
      });
      const byName = await call(patientsGET, `/api/v1/patients?q=bodri-${runId}`, { token: alice.token });
      expect(byName.body.items.length).toBe(1);
      const byOwner = await call(patientsGET, `/api/v1/patients?q=${encodeURIComponent(`smith john ${runId}`)}`, { token: alice.token });
      expect(byOwner.body.items.length).toBe(1);
      const byPhone = await call(patientsGET, `/api/v1/patients?q=${encodeURIComponent("555 1234")}`, { token: alice.token });
      expect(byPhone.body.items.length).toBeGreaterThanOrEqual(1);
      const wildcard = await call(patientsGET, `/api/v1/patients?q=${encodeURIComponent("%")}`, { token: alice.token });
      expect(wildcard.body.items.length).toBe(0);
      const dogsOnly = await call(patientsGET, `/api/v1/patients?species=cat&q=bodri-${runId}`, { token: alice.token });
      expect(dogsOnly.body.items.length).toBe(0);
    });

    it("paginates", async () => {
      const page = await call(patientsGET, "/api/v1/patients?page=1&pageSize=2", { token: alice.token });
      expect(page.body.items.length).toBeLessThanOrEqual(2);
      expect(page.body.pageSize).toBe(2);
      const bad = await call(patientsGET, "/api/v1/patients?pageSize=500", { token: alice.token });
      expect(bad.status).toBe(422);
    });
  });
});
