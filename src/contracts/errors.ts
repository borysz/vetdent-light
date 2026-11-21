import { z } from "zod";

/** Stable English error keys. The UI translates them from messages/<locale>.json (errors.*). */
export const errorCodes = [
  "bad_request",
  "validation_failed",
  "unauthenticated",
  "invalid_credentials",
  "forbidden",
  "not_a_member",
  "origin_not_allowed",
  "not_found",
  "version_conflict",
  "species_locked",
  "rate_limited",
  "weak_password",
  "same_password",
  "internal_error",
] as const;
export type ErrorCode = (typeof errorCodes)[number];

export const httpStatusByCode: Record<ErrorCode, number> = {
  bad_request: 400,
  validation_failed: 422,
  unauthenticated: 401,
  invalid_credentials: 401,
  forbidden: 403,
  not_a_member: 403,
  origin_not_allowed: 403,
  not_found: 404,
  version_conflict: 409,
  species_locked: 409,
  rate_limited: 429,
  weak_password: 422,
  same_password: 422,
  internal_error: 500,
};

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
