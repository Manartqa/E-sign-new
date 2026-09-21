import "next-auth";
import "next-auth/jwt";

/** The signed-in user as the app sees it — standard claims + `roles`. */
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** from the SSO `roles` scope — empty on the mock credentials flow */
  roles: string[];
}

declare module "next-auth" {
  interface Session {
    user?: SessionUser;
    accessToken?: string;
    /** kept for RP-initiated logout (`id_token_hint`) */
    idToken?: string;
    /** set when a refresh_token exchange failed and the session is dead */
    error?: "RefreshAccessTokenError";
  }
  interface User {
    accessToken?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    /** server-side only — never copied into the session */
    refreshToken?: string;
    idToken?: string;
    /** epoch seconds */
    expiresAt?: number;
    /** which provider issued this token — "sso" or undefined (credentials) */
    provider?: string;
    user?: SessionUser;
    error?: "RefreshAccessTokenError";
  }
}
