import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE as radiographDELETE } from "@/app/api/v1/radiographs/[id]/route";
import { GET as fileGET } from "@/app/api/v1/radiographs/[id]/file/route";
import { GET as listGET, POST as uploadPOST } from "@/app/api/v1/sheets/[id]/radiographs/route";
import { POST as sheetsPOST } from "@/app/api/v1/sheets/route";
import { RADIOGRAPH_MAX_BYTES } from "@/contracts/radiographs";
import { sniffFileType } from "@/server/services/radiographs";
import { call, cleanup, createTestUser, runId, type TestUser } from "../helpers/fixtures";

const hasEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

/** A 1x1 PNG. */
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"));

function form(bytes: Uint8Array, name: string, type: string): FormData {
  const data = new FormData();
  data.append("file", new File([bytes as BlobPart], name, { type }));
  return data;
}

/** A tiny one-page PDF. */
const PDF = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

describe("radiograph type check", () => {
  it("recognises JPEG, PNG, WebP and PDF by their bytes, nothing else", () => {
    expect(sniffFileType(PNG)).toBe("image/png");
    expect(sniffFileType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffFileType(new TextEncoder().encode("RIFF1234WEBPVP8 "))).toBe("image/webp");
    expect(sniffFileType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffFileType(PDF)).toBe("application/pdf");
    expect(sniffFileType(new TextEncoder().encode("PK\u0003\u0004 zip"))).toBeNull();
  });
});

describe.skipIf(!hasEnv)("radiograph images (real Supabase)", () => {
  let alice: TestUser;
  let bob: TestUser;
  let sheetId: string;

  beforeAll(async () => {
    alice = await createTestUser("xray-alice");
    bob = await createTestUser("xray-bob");
    const sheet = await call(sheetsPOST, "/api/v1/sheets", {
      token: alice.token,
      method: "POST",
      body: {
        treatmentDate: "2026-03-05",
        treatingVet: "Dr. Test",
        content: {},
        patient: { species: "dog", name: `Xray-${runId}`, ownerName: "Owner Xray" },
      },
    });
    expect(sheet.status).toBe(201);
    sheetId = sheet.body.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("attaches, lists, serves and deletes an image", async () => {
    const empty = await call(listGET, `/api/v1/sheets/${sheetId}/radiographs`, { token: alice.token, params: { id: sheetId } });
    expect(empty.status).toBe(200);
    expect(empty.body.items).toEqual([]);

    const added = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(PNG, "../folder/RTG 108.png", "image/png"),
    });
    expect(added.status).toBe(201);
    expect(added.body.fileName).toBe("RTG 108.png");
    expect(added.body.contentType).toBe("image/png");
    expect(added.body.fileUrl).toBe(`/api/v1/radiographs/${added.body.id}/file`);

    const listed = await call(listGET, `/api/v1/sheets/${sheetId}/radiographs`, { token: alice.token, params: { id: sheetId } });
    expect(listed.body.items.map((item: { id: string }) => item.id)).toEqual([added.body.id]);

    const image = await call(fileGET, added.body.fileUrl, { token: alice.token, params: { id: added.body.id } });
    expect(image.status).toBe(200);
    expect(image.contentType).toBe("image/png");
    expect(Buffer.from(image.bytes).equals(Buffer.from(PNG))).toBe(true);

    const removed = await call(radiographDELETE, `/api/v1/radiographs/${added.body.id}`, { token: alice.token, method: "DELETE", params: { id: added.body.id } });
    expect(removed.status).toBe(204);
    const gone = await call(fileGET, added.body.fileUrl, { token: alice.token, params: { id: added.body.id } });
    expect(gone.status).toBe(404);
  });

  it("stores a large image in the database and gives back the same bytes", async () => {
    const large = new Uint8Array(12 * 1024 * 1024);
    for (let i = 0; i < large.length; i++) large[i] = (i * 31 + 7) % 251;
    large.set(PNG.subarray(0, 8));
    const started = Date.now();
    const added = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(large, "large.png", "image/png"),
    });
    expect(added.status, JSON.stringify(added.body)).toBe(201);
    expect(added.body.sizeBytes).toBe(large.length);
    const image = await call(fileGET, added.body.fileUrl, { token: alice.token, params: { id: added.body.id } });
    expect(image.status).toBe(200);
    expect(Buffer.from(image.bytes).equals(Buffer.from(large))).toBe(true);
    console.log(`12 MB image: upload and download in ${Date.now() - started} ms`);
    await call(radiographDELETE, `/api/v1/radiographs/${added.body.id}`, { token: alice.token, method: "DELETE", params: { id: added.body.id } });
  }, 120_000);

  it("attaches a PDF and serves it inline with its name", async () => {
    const added = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(PDF, "RTG lelet 108.pdf", "application/pdf"),
    });
    expect(added.status).toBe(201);
    expect(added.body.contentType).toBe("application/pdf");
    const file = await call(fileGET, added.body.fileUrl, { token: alice.token, params: { id: added.body.id } });
    expect(file.status).toBe(200);
    expect(file.contentType).toBe("application/pdf");
    expect(Buffer.from(file.bytes).equals(Buffer.from(PDF))).toBe(true);
    await call(radiographDELETE, `/api/v1/radiographs/${added.body.id}`, { token: alice.token, method: "DELETE", params: { id: added.body.id } });
  });

  it("keeps another clinic out", async () => {
    const added = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(PNG, "private.png", "image/png"),
    });
    expect(added.status).toBe(201);
    const id = added.body.id;

    expect((await call(listGET, `/api/v1/sheets/${sheetId}/radiographs`, { token: bob.token, params: { id: sheetId } })).status).toBe(404);
    expect((await call(fileGET, `/api/v1/radiographs/${id}/file`, { token: bob.token, params: { id } })).status).toBe(404);
    expect((await call(radiographDELETE, `/api/v1/radiographs/${id}`, { token: bob.token, method: "DELETE", params: { id } })).status).toBe(404);
    const upload = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: bob.token,
      method: "POST",
      params: { id: sheetId },
      form: form(PNG, "intruder.png", "image/png"),
    });
    expect(upload.status).toBe(404);
    // Still there for its own clinic.
    expect((await call(fileGET, `/api/v1/radiographs/${id}/file`, { token: alice.token, params: { id } })).status).toBe(200);
  });

  it("refuses files that are not images, too large or missing", async () => {
    const fake = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"), "fake.png", "image/png"),
    });
    expect(fake.status).toBe(415);
    expect(fake.body.error.code).toBe("unsupported_file_type");

    const huge = new Uint8Array(RADIOGRAPH_MAX_BYTES + 1);
    huge.set(PNG);
    const tooLarge = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: form(huge, "huge.png", "image/png"),
    });
    expect(tooLarge.status).toBe(413);
    expect(tooLarge.body.error.code).toBe("file_too_large");

    const missing = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, {
      token: alice.token,
      method: "POST",
      params: { id: sheetId },
      form: new FormData(),
    });
    expect(missing.status).toBe(422);

    const json = await call(uploadPOST, `/api/v1/sheets/${sheetId}/radiographs`, { token: alice.token, method: "POST", params: { id: sheetId }, body: {} });
    expect(json.status).toBe(400);
  });
});
