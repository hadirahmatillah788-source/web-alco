import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "alco-super-secret-key-production-2026-jwt",
});

export const config = {
  matcher: [
    /*
     * Match protected ALCO dashboard and admin routes
     */
    "/alco/:path*",
    "/alco",
    "/admin/:path*",
  ],
};
