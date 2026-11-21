import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/server/env";

/** Pages for signed-out users only (signed-in users go home). */
const PUBLIC_PAGES = new Set(["/login", "/forgot-password"]);
/** Open to everyone: the target of the password reset e-mail link. */
const OPEN_PAGES = new Set(["/auth/confirm"]);
const PUBLIC_API = new Set([
  "/api/v1/health",
  "/api/v1/openapi.json",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/password-reset",
]);

function isHttps(request: NextRequest): boolean {
  return (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")) === "https";
}

/**
 * Keeps the Supabase session fresh and gates everything behind sign-in:
 * pages redirect to /login, API calls get a 401 JSON error. Bearer requests pass through
 * (the route verifies the token itself).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Bearer requests are verified by the API itself; the print page (opened by the server's own Chrome) reads data through it.
  const isPrint = pathname.startsWith("/print/");
  if ((isApi || isPrint) && /^Bearer\s+/i.test(request.headers.get("authorization") ?? "")) {
    return NextResponse.next();
  }

  const env = serverEnv();
  let response = NextResponse.next({ request });
  const secure = isHttps(request);

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure });
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const withSessionCookies = (target: NextResponse) => {
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    return target;
  };

  if (isApi) {
    if (!signedIn && !PUBLIC_API.has(pathname)) {
      return withSessionCookies(
        NextResponse.json({ error: { code: "unauthenticated", message: "Not signed in" } }, { status: 401 }),
      );
    }
    return response;
  }

  if (OPEN_PAGES.has(pathname)) return response;
  if (!signedIn && !PUBLIC_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return withSessionCookies(NextResponse.redirect(url));
  }
  if (signedIn && PUBLIC_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withSessionCookies(NextResponse.redirect(url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
