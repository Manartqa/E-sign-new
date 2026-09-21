import type { NextAuthOptions, Profile } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ROUTES } from "@/constant/routes";
import { USE_MOCK } from "@/lib/env";
import {
  BASE_PATH,
  IS_SECURE_COOKIE,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
} from "@/lib/session-cookie";
import {
  SSO_PROVIDER_ID,
  isSsoConfigured,
  refreshAccessToken,
  ssoConfig,
  ssoEndpoints,
  toRoles,
} from "@/lib/sso";
import { findMockAccount } from "@/mocks/auth.mock";

/** Claims this app reads off the SSO id_token / userinfo response. */
interface SsoProfile extends Profile {
  sub: string;
  preferred_username?: string;
  email?: string;
  picture?: string;
  roles?: string[] | string;
}

/** OIDC Authorization Code + PKCE against the SSO Auth Server. */
const ssoProvider: OAuthConfig<SsoProfile> = {
  id: SSO_PROVIDER_ID,
  name: "SSO",
  type: "oauth",
  issuer: ssoConfig.issuer,
  authorization: {
    url: ssoEndpoints.authorize,
    params: { scope: ssoConfig.scope },
  },
  token: ssoEndpoints.token,
  userinfo: ssoEndpoints.userinfo,
  jwks_endpoint: ssoEndpoints.jwks,
  clientId: ssoConfig.clientId,
  clientSecret: ssoConfig.clientSecret,
  idToken: true,
  // nonce kept on top of pkce + state: the server supports it and it binds
  // the id_token to this very sign-in
  checks: ["pkce", "state", "nonce"],
  client: { token_endpoint_auth_method: "client_secret_basic" },
  profile(profile) {
    return {
      // `sub` is the stable id — username/email can change (per the SSO docs)
      id: profile.sub,
      name: profile.name ?? profile.preferred_username ?? profile.sub,
      email: profile.email ?? null,
      image: profile.picture ?? null,
      roles: toRoles(profile.roles),
    };
  },
};

/** Keep a same-origin URL only if it stays under the basePath. */
function isUnderBasePath(pathname: string) {
  return !BASE_PATH || pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`);
}

/**
 * SSO (when configured) plus the credentials flow against POST /api/auth/login.
 * While NEXT_PUBLIC_USE_MOCK is on, credentials are checked against the mock
 * accounts instead of the network.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  // NextAuth redirects to these as-is, relative to the origin — the basePath
  // has to be spelled out
  pages: {
    signIn: `${BASE_PATH}${ROUTES.login}`,
    error: `${BASE_PATH}${ROUTES.login}`,
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: SESSION_COOKIE_PATH,
        secure: IS_SECURE_COOKIE,
      },
    },
  },
  providers: [
    // Registered only when OIDC_ISSUER/CLIENT_ID/CLIENT_SECRET are all set, so
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
          const account = findMockAccount(credentials.username);
          if (!account || credentials.pwd !== account.pwd) return null;
          return {
            id: account.profile.id,
            name: account.profile.name,
            email: account.profile.email,
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
      // ── first sign-in: keep the whole token set and the user ──
      if (account && user) {
        const sessionUser = {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          roles: user.roles ?? [],
        };

        if (account.provider === SSO_PROVIDER_ID) {
          return {
            ...token,
            provider: SSO_PROVIDER_ID,
            accessToken: account.access_token,
            idToken: account.id_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            user: sessionUser,
            signedInAt: Date.now(),
            error: undefined,
          };
        }

        // credentials sign-in (mock / POST /api/auth/login)
        return {
          ...token,
          accessToken: user.accessToken,
          user: sessionUser,
          signedInAt: Date.now(),
        };
      }

      // ── later requests: refresh the SSO access token shortly before it dies ──
      if (token.provider !== SSO_PROVIDER_ID) return token;
      if (token.error) return token; // already dead — don't retry every poll

      const stillFresh =
        typeof token.expiresAt === "number" &&
        Date.now() < (token.expiresAt - 60) * 1000;
      if (stillFresh) return token;

      return refreshAccessToken(token);
    },
    session({ session, token }) {
      // refreshToken stays in the encrypted cookie — never exposed here
      if (token.user) session.user = token.user;
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error;
      return session;
    },
    redirect({ url, baseUrl }) {
      // baseUrl is the bare origin; the app lives under the basePath
      const home = `${baseUrl}${BASE_PATH}`;
      // app-relative (callers pass paths without the basePath)
      if (url.startsWith("/") && !url.startsWith("//")) return `${home}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === new URL(baseUrl).origin && isUnderBasePath(target.pathname)) {
          return url;
        }
      } catch {
        // unparsable — fall through to home
      }
      return home;
    },
  },
};
