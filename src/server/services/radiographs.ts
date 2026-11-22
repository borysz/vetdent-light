import { randomUUID } from "node:crypto";
import {
  RADIOGRAPH_MAX_BYTES,
  RADIOGRAPH_MAX_PER_SHEET,
  RADIOGRAPH_TYPES,
  type Radiograph,
  type RadiographType,
} from "@/contracts/radiographs";

import type { AuthContext } from "../auth";
import { ApiError, fromDb } from "../errors";

/** The image bytes are in the database (sheet_radiographs.image); lists never load them. */
const META_COLUMNS = "id, sheet_id, file_name, content_type, size_bytes, created_at";

type Row = {
  id: string;
  sheet_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

function toRadiograph(row: Row): Radiograph {
  return {
    id: row.id,
    sheetId: row.sheet_id,
    fileName: row.file_name,
    contentType: row.content_type as RadiographType,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    fileUrl: `/api/v1/radiographs/${row.id}/file`,
  };
}

/** The real type from the first bytes of the file (the declared type alone could be wrong or forged). */
export function sniffFileType(bytes: Uint8Array): RadiographType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 5 && ascii(0, 5) === "%PDF-") return "application/pdf";
  return null;
}

/** Control characters (U+0000 to U+001F and U+007F), written by code point so the source stays plain text. */
const CONTROL_CHARS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]`, "g");

/** A file name safe to store and show: no folders, no control characters, at most 255 characters. */
function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(CONTROL_CHARS, () => "").trim().slice(0, 255);
  return cleaned || "radiograph";
}

/** 404 unless the sheet exists in the caller's clinic. */
async function assertSheet(ctx: AuthContext, sheetId: string) {
  const { data, error } = await ctx.db.from("treatment_sheets").select("id").eq("id", sheetId).eq("clinic_id", ctx.clinicId).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Sheet not found");
}

export async function listRadiographs(ctx: AuthContext, sheetId: string): Promise<Radiograph[]> {
  await assertSheet(ctx, sheetId);
  const { data, error } = await ctx.db
    .from("sheet_radiographs")
    .select(META_COLUMNS)
    .eq("sheet_id", sheetId)
    .eq("clinic_id", ctx.clinicId)
    .order("created_at", { ascending: true });
  if (error) throw fromDb(error);
  return data.map(toRadiograph);
}

/** Store one radiograph file (image or PDF) in the database: checked type (by its bytes), size and count. */
export async function addRadiograph(ctx: AuthContext, sheetId: string, file: File): Promise<Radiograph> {
  await assertSheet(ctx, sheetId);
  if (file.size === 0) throw new ApiError("validation_failed", "The file is empty", { file: "empty" });
  if (file.size > RADIOGRAPH_MAX_BYTES) throw new ApiError("file_too_large", "The file is larger than 15 MB");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffFileType(bytes);
  if (!type || !(RADIOGRAPH_TYPES as readonly string[]).includes(type)) {
    throw new ApiError("unsupported_file_type", "Only JPEG, PNG, WebP or PDF files");
  }

  const { count, error: countError } = await ctx.db
    .from("sheet_radiographs")
    .select("id", { count: "exact", head: true })
    .eq("sheet_id", sheetId);
  if (countError) throw fromDb(countError);
  if ((count ?? 0) >= RADIOGRAPH_MAX_PER_SHEET) throw new ApiError("too_many_files", "The sheet already has the most images allowed");

  const { data, error } = await ctx.db
    .rpc("add_sheet_radiograph", {
      p_id: randomUUID(),
      p_clinic_id: ctx.clinicId,
      p_sheet_id: sheetId,
      p_file_name: cleanFileName(file.name),
      p_content_type: type,
      p_image_base64: Buffer.from(bytes).toString("base64"),
    })
    .single();
  if (error || !data) throw fromDb(error ?? { message: "not_found" });
  return toRadiograph(data);
}

async function findRadiograph(ctx: AuthContext, id: string): Promise<Row> {
  const { data, error } = await ctx.db.from("sheet_radiographs").select(META_COLUMNS).eq("id", id).eq("clinic_id", ctx.clinicId).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "Radiograph not found");
  return data;
}

/** The file bytes, type and name, for the file endpoint. */
export async function radiographFile(ctx: AuthContext, id: string): Promise<{ body: Uint8Array; contentType: string; fileName: string }> {
  const row = await findRadiograph(ctx, id);
  const { data, error } = await ctx.db.rpc("sheet_radiograph_image", { p_id: row.id });
  if (error) throw fromDb(error);
  if (!data) throw new ApiError("not_found", "The image is missing");
  return { body: new Uint8Array(Buffer.from(data, "base64")), contentType: row.content_type, fileName: row.file_name };
}

export async function deleteRadiograph(ctx: AuthContext, id: string): Promise<void> {
  await findRadiograph(ctx, id);
  const { error } = await ctx.db.from("sheet_radiographs").delete().eq("id", id).eq("clinic_id", ctx.clinicId);
  if (error) throw fromDb(error);
}
