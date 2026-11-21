"use client";

import { useEffect, useState } from "react";

/** The value, delayed until it has been stable for `ms` (search-as-you-type without a request per key). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
