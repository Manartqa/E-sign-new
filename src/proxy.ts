import { withAuth } from "next-auth/middleware";

export default withAuth({ pages: { signIn: "/login" } });

/** Everything under the (admin) group requires a session. */
export const config = {
  matcher: [
    "/",
    "/applications/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
