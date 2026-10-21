import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
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
