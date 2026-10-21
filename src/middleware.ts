import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || "alco-super-secret-key-production-2026-jwt";

  // Check both secure (__Secure-) and standard cookie names for 100% reverse-proxy / Railway compatibility
  const token =
    (await getToken({ req, secret, cookieName: "__Secure-next-auth.session-token" })) ||
    (await getToken({ req, secret, cookieName: "next-auth.session-token" })) ||
    (await getToken({ req, secret }));

  const { pathname } = req.nextUrl;

  // Protect /alco and /admin routes
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/alco/:path*", "/alco", "/admin/:path*"],
};
