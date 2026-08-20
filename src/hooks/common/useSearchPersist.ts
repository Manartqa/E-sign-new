"use client";

import { useCallback, useState } from "react";
import dayjs, { type ManipulateType } from "dayjs";

const EXPIRE_NUM = Number(
  process.env.NEXT_PUBLIC_SEARCH_PERSIST_EXPIRE_NUM ?? 1,
);
const EXPIRE_UNIT = (process.env.NEXT_PUBLIC_SEARCH_PERSIST_UNIT ??
  "day") as ManipulateType;

function readCookie(key: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : null;
}

function writeCookie(key: string, value: string) {
  if (typeof document === "undefined") return;
  const expires = dayjs().add(EXPIRE_NUM, EXPIRE_UNIT).toDate().toUTCString();
  document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Persists a page's filter state to a cookie so it survives navigation and
 * reloads. Used by every filterable list page.
 */
export function useSearchPersist<T extends Record<string, unknown>>(
  storageKey: string,
  defaultValues: T,
) {
  const [filterValues, setFilterValues] = useState<T>(() => {
    const raw = readCookie(storageKey);
    if (!raw) return defaultValues;
    try {
      return { ...defaultValues, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return defaultValues;
    }
  });

  const persist = useCallback(
    (_key: string, values: T) => {
      setFilterValues(values);
      writeCookie(storageKey, JSON.stringify(values));
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    setFilterValues(defaultValues);
    writeCookie(storageKey, JSON.stringify(defaultValues));
  }, [storageKey, defaultValues]);

  return { filterValues, persist, reset };
}
