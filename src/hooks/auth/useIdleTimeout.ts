"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/constant/session";
import { logoutApp } from "@/lib/logout";
import { currentAppPath, rememberSignOut } from "@/lib/return-path";

/** shared by every tab of the app, so work in one keeps the others signed in */
const LAST_ACTIVITY_KEY = "last-activity-at";
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
/** activity is recorded at most this often */
const WRITE_EVERY_MS = 5_000;

let memoryLastActivity = 0;

function readLastActivity(): number {
  try {
    return Number(window.localStorage.getItem(LAST_ACTIVITY_KEY)) || memoryLastActivity;
  } catch {
    return memoryLastActivity;
  }
}

function writeLastActivity(at: number) {
  memoryLastActivity = at;
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // storage blocked — this tab still times out on its own
  }
}

/**
 * Signs this app out after IDLE_TIMEOUT_MS with no activity in any tab, and
 * says so IDLE_WARNING_MS before. While the warning is up, only "stay" (or
 * activity in another tab) keeps the session — moving the mouse does not.
 * The sign-out leaves SSO alone and remembers this page for the next sign-in.
 */
export function useIdleTimeout() {
  const [remainingMs, setRemainingMs] = useState(IDLE_TIMEOUT_MS);
  const warningRef = useRef(false);
  const signedOutRef = useRef(false);

  useEffect(() => {
    // opening a page is activity — and resets a stamp left by an old session
    writeLastActivity(Date.now());
    let lastWrite = 0;

    const onActivity = () => {
      if (warningRef.current) return;
      const now = Date.now();
      if (now - lastWrite < WRITE_EVERY_MS) return;
      lastWrite = now;
      writeLastActivity(now);
    };

    const tick = () => {
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - readLastActivity());
      warningRef.current = remaining <= IDLE_WARNING_MS;
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0 && !signedOutRef.current) {
        signedOutRef.current = true;
        rememberSignOut(currentAppPath(), "IDLE");
        void logoutApp();
      }
    };

    for (const event of ACTIVITY_EVENTS)
      window.addEventListener(event, onActivity, { passive: true });
    const timer = window.setInterval(tick, 1_000);
    return () => {
      for (const event of ACTIVITY_EVENTS)
        window.removeEventListener(event, onActivity);
      window.clearInterval(timer);
    };
  }, []);

  const stayActive = useCallback(() => {
    writeLastActivity(Date.now());
    warningRef.current = false;
    setRemainingMs(IDLE_TIMEOUT_MS);
  }, []);

  return {
    remainingMs,
    isWarning: remainingMs <= IDLE_WARNING_MS,
    stayActive,
  };
}
