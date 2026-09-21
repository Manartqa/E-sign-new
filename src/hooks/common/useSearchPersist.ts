"use client";

import { useCallback, useSyncExternalStore } from "react";

const UNIT_MS: Record<string, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

/** how long saved filters live — NEXT_PUBLIC_SEARCH_PERSIST_EXPIRE_NUM × _UNIT, 1 day by default */
const EXPIRE_MS =
  (Number(process.env.NEXT_PUBLIC_SEARCH_PERSIST_EXPIRE_NUM) || 1) *
  (UNIT_MS[process.env.NEXT_PUBLIC_SEARCH_PERSIST_UNIT?.replace(/s$/, "") ?? ""] ??
    UNIT_MS.day);

interface Saved {
  values: Record<string, unknown>;
  expiresAt: number;
}

/** same-tab writes; the `storage` event only fires in the other tabs */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, values: Record<string, unknown> | null) {
  try {
    if (values) {
      const saved: Saved = { values, expiresAt: Date.now() + EXPIRE_MS };
      localStorage.setItem(key, JSON.stringify(saved));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // storage blocked or full — the filters still apply, just not remembered
  }
  listeners.forEach((listener) => listener());
}

/** the parsed value per key, reused while the stored string is unchanged */
const cache = new Map<string, { raw: string | null; defaults: unknown; value: unknown }>();

/**
 * A page's filter state, kept in localStorage so it is still there after
 * switching to another menu item and back, or after a reload. Saved filters
 * expire after the time set in NEXT_PUBLIC_SEARCH_PERSIST_EXPIRE_NUM/_UNIT.
 * The server render always uses `defaultValues`; the saved ones take over
 * on hydration.
 */
export function useSearchPersist<T extends Record<string, unknown>>(
  storageKey: string,
  defaultValues: T,
) {
  const getSnapshot = useCallback((): T => {
    const raw = readRaw(storageKey);
    const hit = cache.get(storageKey);
    if (hit && hit.raw === raw && hit.defaults === defaultValues) {
      return hit.value as T;
    }

    let value = defaultValues;
    try {
      const saved = raw ? (JSON.parse(raw) as Saved) : null;
      if (saved && saved.expiresAt > Date.now()) {
        // defaults first, so a filter added after the save still has a value
        value = { ...defaultValues, ...saved.values };
      }
    } catch {
      // unreadable entry — fall back to the defaults
    }
    cache.set(storageKey, { raw, defaults: defaultValues, value });
    return value;
  }, [storageKey, defaultValues]);

  const filterValues = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultValues,
  );

  const persist = useCallback(
    (_key: string, values: T) => write(storageKey, values),
    [storageKey],
  );

  const reset = useCallback(() => write(storageKey, null), [storageKey]);

  return { filterValues, persist, reset };
}
