import { z } from "zod";
import { loginRequestSchema, loginResponseSchema, meResponseSchema } from "./auth";
import { clinicSchema, clinicUpdateSchema } from "./clinic";
import { errorResponseSchema } from "./errors";
import {
  patientInputSchema,
  patientPageSchema,
  patientPatchSchema,
  patientSchema,
} from "./patients";
import { referenceDataSchema } from "./reference";
import {
  createSheetRequestSchema,
  sheetDetailSchema,
  sheetSummaryPageSchema,
  updateSheetRequestSchema,
} from "./sheets";

type Operation = {
  method: "get" | "post" | "put" | "patch";
  path: string;
  summary: string;
  auth: boolean;
  query?: { name: string; description: string }[];
  request?: z.ZodType;
  response?: z.ZodType;
  status?: number;
};

const pagination = [
  { name: "page", description: "1-based page number (default 1)" },
  { name: "pageSize", description: "Items per page, 1-100 (default 20)" },
];

const operations: Operation[] = [
  { method: "get", path: "/health", summary: "Health check", auth: false, response: z.object({ status: z.literal("ok") }) },
  { method: "post", path: "/auth/login", summary: "Sign in with e-mail and password (sets an httpOnly session cookie)", auth: false, request: loginRequestSchema, response: loginResponseSchema },
  { method: "post", path: "/auth/logout", summary: "Sign out", auth: false, status: 204 },
  { method: "get", path: "/auth/me", summary: "The signed-in user and clinic", auth: true, response: meResponseSchema },
  { method: "get", path: "/reference-data", summary: "Reference data (codes)", auth: true, response: referenceDataSchema },
  { method: "get", path: "/clinic", summary: "The clinic (letterhead data)", auth: true, response: clinicSchema },
  { method: "put", path: "/clinic", summary: "Update the clinic", auth: true, request: clinicUpdateSchema, response: clinicSchema },
  { method: "get", path: "/patients", summary: "Search patients by name, owner name or phone", auth: true, query: [{ name: "q", description: "Search text" }, { name: "species", description: "dog | cat" }, ...pagination], response: patientPageSchema },
  { method: "post", path: "/patients", summary: "Create a patient", auth: true, request: patientInputSchema, response: patientSchema, status: 201 },
  { method: "get", path: "/patients/{id}", summary: "Get a patient", auth: true, response: patientSchema },
  { method: "patch", path: "/patients/{id}", summary: "Update a patient (species only while it has no sheets)", auth: true, request: patientPatchSchema, response: patientSchema },
  { method: "get", path: "/patients/{id}/sheets", summary: "The patient's sheets, newest treatment first", auth: true, query: pagination, response: sheetSummaryPageSchema },
  { method: "get", path: "/sheets", summary: "Most recent sheets of the clinic", auth: true, query: pagination, response: sheetSummaryPageSchema },
  { method: "post", path: "/sheets", summary: "Create a sheet for an existing patient (patientId) or a new one (patient), atomically", auth: true, request: createSheetRequestSchema, response: sheetDetailSchema, status: 201 },
  { method: "get", path: "/sheets/{id}", summary: "Get a sheet with its patient", auth: true, response: sheetDetailSchema },
  { method: "put", path: "/sheets/{id}", summary: "Save a sheet; a stale version answers 409", auth: true, request: updateSheetRequestSchema, response: sheetDetailSchema },
];

const schemaOf = (schema: z.ZodType, io: "input" | "output") =>
  z.toJSONSchema(schema, { io, unrepresentable: "any", target: "draft-7" });

/** OpenAPI 3.1 description generated from the zod contracts. */
export function buildOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of operations) {
    const status = String(op.status ?? 200);
    const params = [
      ...[...op.path.matchAll(/\{(\w+)\}/g)].map((m) => ({
        name: m[1],
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      })),
      ...(op.query ?? []).map((q) => ({ name: q.name, in: "query", required: false, description: q.description, schema: { type: "string" } })),
    ];
    (paths[op.path] ??= {})[op.method] = {
      summary: op.summary,
      ...(op.auth ? { security: [{ cookieAuth: [] }, { bearerAuth: [] }] } : {}),
      ...(params.length ? { parameters: params } : {}),
      ...(op.request
        ? { requestBody: { required: true, content: { "application/json": { schema: schemaOf(op.request, "input") } } } }
        : {}),
      responses: {
        [status]: op.response
          ? { description: "OK", content: { "application/json": { schema: schemaOf(op.response, "output") } } }
          : { description: "OK" },
        default: {
          description: "Error (codes: bad_request, validation_failed, unauthenticated, invalid_credentials, forbidden, not_a_member, origin_not_allowed, not_found, version_conflict, species_locked, internal_error)",
          content: { "application/json": { schema: schemaOf(errorResponseSchema, "output") } },
        },
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: { title: "VetDent Light API", version: "1.0.0" },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "sb-<project>-auth-token" },
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths,
  };
}
