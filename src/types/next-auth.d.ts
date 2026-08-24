import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    /** kept for RP-initiated logout (`id_token_hint`) */
    idToken?: string;
    /** from the SSO `roles` scope — empty on the mock credentials flow */
    roles?: string[];
    /** set when a refresh_token exchange failed and the session is dead */
    error?: string;
  }
  interface User {
    accessToken?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    /** epoch seconds, from the token endpoint's `expires_in` */
    expiresAt?: number;
    /** which provider issued this token — "sso" or undefined (credentials) */
    provider?: string;
    roles?: string[];
    error?: string;
  }
}
