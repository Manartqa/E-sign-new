"use client";

import { useCallback, useState } from "react";

/**
 * Holds a page's filter state for as long as the page stays mounted.
 * Switching to another menu item unmounts the page, so its filters are back
 * to `defaultValues` on return — nothing is remembered across navigation.
 */
export function useSearchPersist<T extends Record<string, unknown>>(
  _storageKey: string,
  defaultValues: T,
) {
  const [filterValues, setFilterValues] = useState<T>(defaultValues);

  const persist = useCallback((_key: string, values: T) => {
    setFilterValues(values);
  }, []);

  const reset = useCallback(() => {
    setFilterValues(defaultValues);
  }, [defaultValues]);

  return { filterValues, persist, reset };
}
