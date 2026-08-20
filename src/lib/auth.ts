import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { USE_MOCK } from "@/lib/env";
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

/**
 * Credentials flow against POST /api/auth/login (see the handoff API table).
 * While NEXT_PUBLIC_USE_MOCK is on, sign-in is checked against
 * MOCK_CREDENTIALS instead of the network.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
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
    jwt({ token, user }) {
      if (user) token.accessToken = (user as { accessToken?: string }).accessToken;
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
