/**
 * SSO Auth Server (OAuth 2.0 Authorization Code + OIDC).
 *
 * Contract read from the live server on 2026-08-24:
 *   discovery : {issuer}/.well-known/openid-configuration
 *   authorize : {issuer}/oauth2/authorize   (response_type=code, PKCE S256)
 *   token     : {issuer}/oauth2/token       (client_secret_basic, form-urlencoded)
 *   userinfo  : {issuer}/userinfo           (Bearer access token, `sub` = stable id)
 *   jwks      : {issuer}/oauth2/jwks
 *   logout    : end_session_endpoint from discovery ({issuer}/connect/logout)
 *
 * Everything except the issuer is discovered at runtime, so a change on the
 * SSO side does not need a code change here.
 *
 * The client_id/secret must be registered by the SSO admin with this app's
 * exact callback URL — `{NEXTAUTH_URL}/api/auth/callback/sso` — because the
 * server matches `redirect_uri` exactly.
 */

export { SSO_PROVIDER_ID } from "@/constant/sso";

/** Scopes the gateway-admin client uses; `roles` carries the user's roles. */
const DEFAULT_SCOPES = "openid profile email roles";

export const ssoConfig = {
  issuer: process.env.SSO_ISSUER ?? "",
  clientId: process.env.SSO_CLIENT_ID ?? "",
  clientSecret: process.env.SSO_CLIENT_SECRET ?? "",
  scopes: process.env.SSO_SCOPES ?? DEFAULT_SCOPES,
};

/** Server-side: the provider is only registered when fully configured. */
export const isSsoConfigured = Boolean(
  ssoConfig.issuer && ssoConfig.clientId && ssoConfig.clientSecret,
);

export const wellKnownUrl = `${ssoConfig.issuer}/.well-known/openid-configuration`;

interface Discovery {
  token_endpoint: string;
  end_session_endpoint?: string;
  userinfo_endpoint?: string;
}

let discoveryCache: Promise<Discovery> | null = null;

/** Discovery document, fetched once per server process. */
export function getDiscovery(): Promise<Discovery> {
  discoveryCache ??= fetch(wellKnownUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`discovery failed: ${res.status}`);
      return res.json() as Promise<Discovery>;
    })
    .catch((error) => {
      discoveryCache = null; // let the next call retry a transient failure
      throw error;
    });
  return discoveryCache;
}

export interface RefreshedTokens {
  accessToken: string;
  /** epoch seconds */
  expiresAt: number;
  refreshToken: string;
  idToken?: string;
}

/**
 * Trade a refresh token for a new access token.
 * `client_secret_basic` per the server's token_endpoint_auth_methods_supported.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshedTokens> {
  const { token_endpoint } = await getDiscovery();
  const basic = Buffer.from(
    `${ssoConfig.clientId}:${ssoConfig.clientSecret}`,
  ).toString("base64");

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    id_token?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(`refresh failed: ${res.status}`);
  }

  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 300),
    // the server may or may not rotate the refresh token
    refreshToken: data.refresh_token ?? refreshToken,
    idToken: data.id_token,
  };
}

/**
 * RP-initiated logout URL, or null when SSO is off / the server doesn't
 * advertise one. `id_token_hint` lets the server skip the confirm prompt.
 */
export async function buildSsoLogoutUrl(
  idToken: string | undefined,
  postLogoutRedirectUri: string,
): Promise<string | null> {
  if (!isSsoConfigured) return null;
  const { end_session_endpoint } = await getDiscovery();
  if (!end_session_endpoint) return null;

  const url = new URL(end_session_endpoint);
  url.searchParams.set("client_id", ssoConfig.clientId);
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  return url.toString();
}
