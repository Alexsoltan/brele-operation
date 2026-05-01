import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "brele_session_v2";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔥 РАЗРЕШАЕМ TELEGRAM WEBHOOK БЕЗ АВТОРИЗАЦИИ
  if (pathname === "/api/telegram/webhook") {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";

  const isAuthApi =
    pathname === "/api/auth/login" || pathname === "/api/auth/logout";

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/brele-logo") ||
    pathname.includes(".");

  if (isStaticAsset || isAuthApi) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const hasValidShape = Boolean(session && session.includes("."));
  const isApiRoute = pathname.startsWith("/api");

  if (!hasValidShape) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLoginPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";

      return NextResponse.redirect(url);
    }
  }

  if (hasValidShape && isLoginPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};