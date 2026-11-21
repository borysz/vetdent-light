import type { z } from "zod";
import { loginResponseSchema, meResponseSchema, type LoginResponse, type Me } from "@/contracts/auth";
import { errorResponseSchema, type ErrorCode } from "@/contracts/errors";

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

export const api = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    request("POST", "/auth/login", loginResponseSchema, { email, password }),
  logout: async (): Promise<void> => {
    await request("POST", "/auth/logout", null, {});
  },
  me: (): Promise<Me> => request("GET", "/auth/me", meResponseSchema),
};
