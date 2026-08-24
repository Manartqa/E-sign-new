import type { NextAuthOptions, Profile } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";
import { USE_MOCK } from "@/lib/env";
import {
  SSO_PROVIDER_ID,
  isSsoConfigured,
  refreshAccessToken,
  ssoConfig,
  wellKnownUrl,
} from "@/lib/sso";
import { MOCK_PROFILE } from "@/mocks/profile.mock";

/**
 * The single account the mock backend accepts. Anything else is rejected, so
 * the login form's error state is reachable without a real backend.
 * There is no role gating anywhere in the app yet, so this account reaches
 * every screen and action.
 */
export const MOCK_CREDENTIALS = {
  username: "manart.pa@smartalliance.co.th",
  pwd: "P@ssw0rd",
} as const;

/** Claims this app reads off the SSO id_token / userinfo response. */
interface SsoProfile extends Profile {
  sub: string;
  preferred_username?: string;
  email?: string;
  /** `roles` scope — a JSON array on this server, a space string elsewhere */
  roles?: string[] | string;
  organization?: string;
}

function toRoles(raw: SsoProfile["roles"]): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return raw.split(" ").filter(Boolean);
  return [];
}

/**
 * OIDC Authorization Code + PKCE against the SSO Auth Server.
 * Endpoints are not hardcoded — `wellKnown` discovery supplies them.
 */
const ssoProvider: OAuthConfig<SsoProfile> = {
  id: SSO_PROVIDER_ID,
  name: "SSO",
  type: "oauth",
  wellKnown: wellKnownUrl,
  clientId: ssoConfig.clientId,
  clientSecret: ssoConfig.clientSecret,
  authorization: { params: { scope: ssoConfig.scopes } },
  idToken: true,
  // the server advertises S256 PKCE; state + nonce are the recommended pair
  checks: ["pkce", "state", "nonce"],
  client: { token_endpoint_auth_method: "client_secret_basic" },
  profile(profile) {
    return {
      // `sub` is the stable id — username/email can change (per the SSO docs)
      id: profile.sub,
      name:
        profile.name ?? profile.preferred_username ?? profile.email ?? profile.sub,
      email: profile.email ?? null,
      image: null,
      roles: toRoles(profile.roles),
    };
  },
};

/**
 * Credentials flow against POST /api/auth/login (see the handoff API table).
 * While NEXT_PUBLIC_USE_MOCK is on, sign-in is checked against
 * MOCK_CREDENTIALS instead of the network.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // Registered only when SSO_ISSUER/CLIENT_ID/CLIENT_SECRET are all set, so
    // a half-configured env fails at the button, not at every request.
    ...(isSsoConfigured ? [ssoProvider] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้งาน", type: "text" },
        pwd: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pwd) return null;

        if (USE_MOCK) {
          const usernameMatches =
            credentials.username.trim().toLowerCase() ===
            MOCK_CREDENTIALS.username;
          if (!usernameMatches || credentials.pwd !== MOCK_CREDENTIALS.pwd) {
            return null;
          }
          return {
            id: MOCK_PROFILE.id,
            name: MOCK_PROFILE.name,
            email: MOCK_PROFILE.email,
            accessToken: "mock-access-token",
          };
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              pwd: credentials.pwd,
            }),
          },
        );
        if (!res.ok) return null;

        const { accessToken, user } = await res.json();
        return { id: user.id, name: user.name, email: user.email, accessToken };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // ── SSO sign-in: keep the whole token set, not just the access token ──
      if (account?.provider === SSO_PROVIDER_ID) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
        token.provider = SSO_PROVIDER_ID;
        token.roles = (user as { roles?: string[] } | undefined)?.roles ?? [];
        delete token.error;
        return token;
      }

      // ── credentials sign-in (mock / POST /api/auth/login) ──
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        return token;
      }

      // ── later requests: refresh the SSO access token shortly before it dies ──
      if (token.provider !== SSO_PROVIDER_ID || !token.refreshToken) return token;

      const stillFresh =
        typeof token.expiresAt === "number" &&
        Date.now() < (token.expiresAt - 60) * 1000;
      if (stillFresh) return token;

      try {
        const refreshed = await refreshAccessToken(token.refreshToken);
        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.expiresAt = refreshed.expiresAt;
        if (refreshed.idToken) token.idToken = refreshed.idToken;
        delete token.error;
      } catch {
        // the axios interceptor turns this into a sign-out on the next 401
        token.error = "RefreshAccessTokenError";
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.roles = token.roles ?? [];
      session.error = token.error;
      return session;
    },
  },
};
