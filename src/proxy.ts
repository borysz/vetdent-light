import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/server/env";

const PUBLIC_PAGES = new Set(["/login"]);
const PUBLIC_API = new Set([
  "/api/v1/health",
  "/api/v1/openapi.json",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
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

  if (isApi && /^Bearer\s+/i.test(request.headers.get("authorization") ?? "")) {
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
