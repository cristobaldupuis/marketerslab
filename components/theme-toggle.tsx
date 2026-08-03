"use client";

import { useSyncExternalStore } from "react";
import { SegmentedControl } from "./segmented-control";

type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "ml-theme";
const CHANGE_EVENT = "ml-theme-change";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

function getSnapshot(): ThemePref {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** Matches what the server (and the pre-hydration DOM) can know without
 *  localStorage: nothing explicit, so "system". */
function getServerSnapshot(): ThemePref {
  return "system";
}

/** Storage events cover other tabs; the custom event covers this tab, since
 *  writing to localStorage from the same document that reads it fires no
 *  "storage" event on its own. */
function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Reads the theme preference through `useSyncExternalStore` rather than
 * mirroring `localStorage` into `useState` inside an effect — this is the API
 * React designed specifically for external mutable state, and it renders the
 * server snapshot ("system") on the first client pass so there is nothing to
 * reconcile after hydration, unlike a manual effect-based sync.
 */
export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function apply(next: ThemePref) {
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">Theme</span>
      <SegmentedControl value={pref} onChange={apply} options={OPTIONS} label="Theme" size="sm" />
    </div>
  );
}
