import type { z } from "zod";
import { ApiError, errorResponse, fromZod } from "./errors";

/** Route handler wrapper: resolves dynamic params and turns every error into the JSON error format. */
export function handler<P extends Record<string, string> = Record<string, never>>(
  fn: (req: Request, ctx: { params: P }) => Promise<Response>,
) {
  return async (req: Request, ctx: { params: Promise<P> }): Promise<Response> => {
    try {
      return await fn(req, { params: await ctx.params });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/** Read and validate a JSON body. Only application/json is accepted. */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new ApiError("bad_request", "Content-Type must be application/json");
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("bad_request", "Malformed JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw fromZod(parsed.error);
  return parsed.data;
}

export function readQuery<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw fromZod(parsed.error);
  return parsed.data;
}

export function parseId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError("not_found", "Not found");
  }
  return value;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defence for cookie sessions: state-changing requests must come from the same origin
 * (the Origin header's host equals the Host the request was sent to).
 */
export function assertSameOrigin(req: Request, opts: { allowMissing?: boolean } = {}): void {
  if (!UNSAFE_METHODS.has(req.method)) return;
  const origin = req.headers.get("origin");
  // Browsers always send Origin on these methods; a missing one means a non-browser client.
  if (!origin) {
    if (opts.allowMissing) return;
    throw new ApiError("origin_not_allowed", "Missing Origin header");
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError("origin_not_allowed", "Invalid Origin header");
  }
  const hosts = [req.headers.get("x-forwarded-host"), req.headers.get("host"), new URL(req.url).host].filter(
    (h): h is string => !!h,
  );
  if (!hosts.includes(originHost)) throw new ApiError("origin_not_allowed", "Cross-origin request refused");
}

export function isHttps(req: Request): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  return (forwarded ?? new URL(req.url).protocol.replace(":", "")) === "https";
}
