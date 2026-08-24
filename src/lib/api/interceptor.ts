import axios, { type AxiosInstance } from "axios";
import { getSession } from "next-auth/react";
import { logoutEverywhere } from "@/lib/logout";

export function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      // a failed SSO refresh leaves a session object with no usable token
      if (session?.error === "RefreshAccessTokenError") {
        void logoutEverywhere();
        throw new axios.CanceledError("session expired");
      }
      const token = session?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && typeof window !== "undefined") {
        void logoutEverywhere();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
