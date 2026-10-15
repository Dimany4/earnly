"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function currentYear() {
  return new Date().getFullYear();
}

/** Keep static HTML hydratable, then use the reader's current year. */
export function CurrentYear({ initialYear }: { initialYear: number }) {
  const year = useSyncExternalStore(subscribe, currentYear, () => initialYear);
  return <>{year}</>;
}
