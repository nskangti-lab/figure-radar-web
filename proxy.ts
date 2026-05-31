import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  adminAuthToken,
  adminPassword,
  isProduction
} from "@/lib/admin/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const password = adminPassword();
  if (!password) {
    if (isProduction()) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const expectedToken = await adminAuthToken(password);
  const currentToken = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (currentToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"]
};
