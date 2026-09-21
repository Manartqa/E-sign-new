import axios, { type AxiosInstance } from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { logoutEverywhere } from "@/lib/logout";

/** One-shot: parallel 401s must not stack toasts or logout redirects. */
let isForcingLogout = false;

function forceLogout() {
  if (isForcingLogout) return;
  isForcingLogout = true;
  toast.error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
  setTimeout(logoutEverywhere, 3000);
}

/** mainClient is the app's main backend: a 401 there ends the session. */
export function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      // a failed SSO refresh leaves a session object with no usable token
      if (session?.error === "RefreshAccessTokenError") {
        forceLogout();
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
        forceLogout();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
