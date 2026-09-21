"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { IS_SSO_ENABLED, SSO_ERROR_MESSAGE, SSO_PROVIDER_ID } from "@/constant/sso";
import { safeCallbackUrl } from "@/lib/callback-url";
import { logoutEverywhere } from "@/lib/logout";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  /** Starts the SSO flow — only ever from a click, never on page load. */
  const handleSSOLogin = async (callbackUrl?: string) => {
    if (!IS_SSO_ENABLED) {
      // no client_id registered for this environment yet
      toast.info("ยังไม่ได้เชื่อมต่อระบบ SSO");
      return;
    }
    // stays true on success: the page is navigating to the IdP, and a second
    // click would start a second PKCE/state pair
    setLoading(true);
    try {
      await signIn(SSO_PROVIDER_ID, { callbackUrl: safeCallbackUrl(callbackUrl) });
    } catch {
      setLoading(false);
      toast.error(SSO_ERROR_MESSAGE);
    }
  };

  return { loading, handleSSOLogin, handleSignOut: logoutEverywhere };
};
