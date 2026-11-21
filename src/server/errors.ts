import { ZodError } from "zod";
import { httpStatusByCode, type ErrorCode, type ErrorResponse } from "@/contracts/errors";

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message ?? code);
  }

  get status() {
    return httpStatusByCode[this.code];
  }
}

export function fromZod(error: ZodError): ApiError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    fields[path] ??= issue.code === "custom" ? issue.message : issue.code;
  }
  return new ApiError("validation_failed", "Invalid request", fields);
}

type DbError = { code?: string; message?: string };

/** Translate a PostgREST/Postgres error into an ApiError (no database details leak to the client). */
export function fromDb(error: DbError): ApiError {
  const message = error.message ?? "";
  if (message.includes("version_conflict")) return new ApiError("version_conflict", "The sheet was changed by someone else");
  if (message.includes("species_locked")) return new ApiError("species_locked", "The species cannot change once the patient has sheets");
  if (message.includes("not_found") || error.code === "PGRST116") return new ApiError("not_found", "Not found");
  if (error.code === "42501") return new ApiError("forbidden", "Not allowed");
  if (error.code && ["23502", "23514", "22P02", "22007", "22008", "22003", "23503"].includes(error.code)) {
    return new ApiError("validation_failed", "Invalid data");
  }
  console.error("database error", error.code, message);
  return new ApiError("internal_error", "Internal error");
}

export function errorResponse(error: unknown): Response {
  const apiError =
    error instanceof ApiError
      ? error
      : error instanceof ZodError
        ? fromZod(error)
        : (console.error("unhandled error", error), new ApiError("internal_error", "Internal error"));

  const body: ErrorResponse = {
    error: { code: apiError.code, message: apiError.message, ...(apiError.fields ? { fields: apiError.fields } : {}) },
  };
  return Response.json(body, { status: apiError.status });
}
