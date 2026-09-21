/**
 * SSO Auth Server (OAuth 2.0 Authorization Code + OIDC) — server only.
 *
 * Endpoints are fixed paths under OIDC_ISSUER (checked against the live
 * server's discovery document on 2026-08-24):
 *   authorize   {issuer}/oauth2/authorize   (response_type=code, PKCE S256)
 *   token       {issuer}/oauth2/token       (client_secret_basic, form-urlencoded)
 *   userinfo    {issuer}/userinfo
 *   jwks        {issuer}/oauth2/jwks
 *   revoke      {issuer}/oauth2/revoke      (RFC 7009, client_secret_basic)
 *   end-session {issuer}/connect/logout
 *
 * The client must be registered with the exact callback
 * `{NEXT_BASE_URL}/api/auth/callback/sso` and the post-logout redirect
 * `{NEXT_BASE_URL}/login`.
 */

import type { JWT } from "next-auth/jwt";
import { ROUTES } from "@/constant/routes";
import { BASE_PATH } from "@/lib/session-cookie";

export { SSO_PROVIDER_ID } from "@/constant/sso";

const DEFAULT_SCOPE = "openid profile email";

const issuer = (process.env.OIDC_ISSUER ?? "").replace(/\/+$/, "");

export const ssoConfig = {
  issuer,
  clientId: process.env.OIDC_CLIENT_ID ?? "",
  clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
  scope: process.env.OIDC_SCOPE || DEFAULT_SCOPE,
};

export const ssoEndpoints = {
  authorize: `${issuer}/oauth2/authorize`,
  token: `${issuer}/oauth2/token`,
  userinfo: `${issuer}/userinfo`,
  jwks: `${issuer}/oauth2/jwks`,
  revoke: `${issuer}/oauth2/revoke`,
  endSession: `${issuer}/connect/logout`,
};

/** The provider is only registered when fully configured. */
export const isSsoConfigured = Boolean(
  ssoConfig.issuer && ssoConfig.clientId && ssoConfig.clientSecret,
);

/**
 * Public URL of the login page, incl. basePath — the post-logout target. It
 * must match the post-logout redirect URI registered at the IdP exactly, so
 * NEXT_BASE_URL is the source; `fallbackOrigin` only covers a missing env.
 */
export function loginUrl(fallbackOrigin: string) {
  const base = process.env.NEXT_BASE_URL?.replace(/\/+$/, "");
  return `${base || `${fallbackOrigin}${BASE_PATH}`}${ROUTES.login}`;
}

const basicAuth = () =>
  `Basic ${Buffer.from(`${ssoConfig.clientId}:${ssoConfig.clientSecret}`).toString("base64")}`;

/**
 * Payload of a JWT, unverified. Only for display/affordance and for reading
 * `exp` — the backend verifies the signature and is the authority.
 */
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** `roles` is a JSON array on this server, a space-separated string elsewhere */
export function toRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === "string");
  if (typeof raw === "string") return raw.split(" ").filter(Boolean);
  return [];
}

/**
 * Trade the refresh token for a new access token. Any failure yields a token
 * marked `RefreshAccessTokenError` — never one that still looks usable.
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) throw new Error("no refresh token");

    const res = await fetch(ssoEndpoints.token, {
      method: "POST",
      headers: {
        Authorization: basicAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`refresh failed: ${res.status}`);

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      id_token?: string;
    };
    if (!data.access_token) throw new Error("refresh returned no access_token");

    const claims = decodeJwtPayload(data.access_token);
    const roles = claims && "roles" in claims ? toRoles(claims.roles) : undefined;

    return {
      ...token,
      accessToken: data.access_token,
      // the server may or may not rotate these
      idToken: data.id_token ?? token.idToken,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 300),
      user: token.user && roles ? { ...token.user, roles } : token.user,
      error: undefined,
    };
  } catch (error) {
    // message carries the HTTP status at most — never a token or body
    console.error("[sso] refresh failed:", (error as Error).message);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/** Revoke access + refresh token (RFC 7009). Failures are logged, not thrown. */
export async function revokeTokens(token: JWT) {
  const targets = [
    { value: token.accessToken, hint: "access_token" },
    { value: token.refreshToken, hint: "refresh_token" },
  ].filter((t): t is { value: string; hint: string } => Boolean(t.value));

  const results = await Promise.allSettled(
    targets.map(({ value, hint }) =>
      fetch(ssoEndpoints.revoke, {
        method: "POST",
        headers: {
          Authorization: basicAuth(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token: value, token_type_hint: hint }),
        cache: "no-store",
      }),
    ),
  );

  results.forEach((result, i) => {
    const hint = targets[i].hint;
    if (result.status === "rejected") {
      console.error(`[sso] revoke ${hint} failed: network error`);
    } else if (!result.value.ok) {
      console.error(`[sso] revoke ${hint} failed: ${result.value.status}`);
    }
  });
}
