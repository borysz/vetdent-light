import type { z } from "zod";
import { loginResponseSchema, meResponseSchema, type LoginResponse, type Me } from "@/contracts/auth";
import { clinicSchema, clinicUpdateSchema } from "@/contracts/clinic";
import { errorResponseSchema, type ErrorCode } from "@/contracts/errors";
import { patientPageSchema, patientSchema, type Species } from "@/contracts/patients";
import {
  createSheetRequestSchema,
  sheetDetailSchema,
  sheetSummaryPageSchema,
  updateSheetRequestSchema,
} from "@/contracts/sheets";

/** Request bodies as the client sends them (before the server applies defaults/transforms). */
export type CreateSheetBody = z.input<typeof createSheetRequestSchema>;
export type UpdateSheetBody = z.input<typeof updateSheetRequestSchema>;
export type ClinicBody = z.input<typeof clinicUpdateSchema>;

/** Typed API error: `code` is the stable key the UI translates (messages: errors.<code>). */
export class ApiClientError extends Error {
  constructor(
    readonly code: ErrorCode | "network",
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(code);
  }
}

async function request<S extends z.ZodType>(
  method: string,
  path: string,
  schema: S | null,
  body?: unknown,
): Promise<z.output<S>> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("network", 0);
  }

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(await response.json().catch(() => null));
    if (parsed.success) {
      throw new ApiClientError(parsed.data.error.code, response.status, parsed.data.error.fields);
    }
    throw new ApiClientError("internal_error", response.status);
  }
  if (schema === null || response.status === 204) return undefined as z.output<S>;
  return schema.parse(await response.json());
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

type PageParams = { page?: number; pageSize?: number };

/** The saved sheet as a PDF file (blob and the file name the server proposed). */
async function sheetPdf(id: string): Promise<{ blob: Blob; fileName: string }> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/sheets/${id}/pdf`, { credentials: "same-origin" });
  } catch {
    throw new ApiClientError("network", 0);
  }
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(await response.json().catch(() => null));
    throw new ApiClientError(parsed.success ? parsed.data.error.code : "internal_error", response.status);
  }
  const fileName = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "report.pdf";
  return { blob: await response.blob(), fileName };
}

export const api = {
  sheetPdf,
  login: (email: string, password: string): Promise<LoginResponse> =>
    request("POST", "/auth/login", loginResponseSchema, { email, password }),
  logout: async (): Promise<void> => {
    await request("POST", "/auth/logout", null, {});
  },
  me: (): Promise<Me> => request("GET", "/auth/me", meResponseSchema),
  patients: (params: PageParams & { q?: string; species?: Species }) =>
    request("GET", `/patients${query(params)}`, patientPageSchema),
  patient: (id: string) => request("GET", `/patients/${id}`, patientSchema),
  recentSheets: (params: PageParams) => request("GET", `/sheets${query(params)}`, sheetSummaryPageSchema),
  patientSheets: (patientId: string, params: PageParams) =>
    request("GET", `/patients/${patientId}/sheets${query(params)}`, sheetSummaryPageSchema),
  clinic: () => request("GET", "/clinic", clinicSchema),
  updateClinic: (body: ClinicBody) => request("PUT", "/clinic", clinicSchema, body),
  sheet: (id: string) => request("GET", `/sheets/${id}`, sheetDetailSchema),
  createSheet: (body: CreateSheetBody) => request("POST", "/sheets", sheetDetailSchema, body),
  updateSheet: (id: string, body: UpdateSheetBody) => request("PUT", `/sheets/${id}`, sheetDetailSchema, body),
};
