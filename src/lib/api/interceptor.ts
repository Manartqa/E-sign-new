import type { AxiosInstance } from "axios";
import { getSession, signOut } from "next-auth/react";

export function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      const token = (session as { accessToken?: string } | null)?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && typeof window !== "undefined") {
        void signOut({ callbackUrl: "/login" });
      }
      return Promise.reject(error);
    },
  );

  return client;
}
