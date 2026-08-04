import { useSyncExternalStore } from "react";
import { EXPERIMENTS } from "./data/experiments";
import type { Experiment, KillCriteriaFields } from "./types";

/**
 * Quarantine — the pre-register holding state, and the session store behind its
 * graduation flow.
 *
 * Entry is one condition and it lives on the record: `kill_criteria_confirmed_at
 * === null` means nobody has accepted or overridden the criteria inherited from
 * the record's touchpoint × risk-class cell, so the record is held. It is not a
 * filter over the register — a held record is *absent* from the register, the
 * way DEFINITIONS.md says it is: invisible in the Observatory, absent from the
 * priority tree, and not counted in the sidebar.
 *
 * **Confirming writes nothing.** All register data is a static TypeScript module
 * (README.md), so a confirmation lives in this module's memory for the session
 * and a reload restores the seeded state. That is the same honesty the
 * Supercomputer already keeps — it generates proposals and deliberately writes
 * nothing to the register (DECISIONS.md, Pass D) — and the Quarantine UI says so
 * on the page rather than implying a write that does not happen. Module scope
 * rather than sessionStorage for the same reason `lastFilters` in
 * `components/observatory-view.tsx` is: the module survives client navigation,
 * so a record graduated here is already gone from the Observatory when you get
 * there, with no effect to run and no first frame to reconcile.
 */

/** What Quarantine's confirm step settles, as it would be written. */
export interface CriteriaConfirmation {
  /** Lands on `Experiment.kill_criteria_confirmed_at`. */
  confirmed_at: string;
  /**
   * Lands on `kill_criteria.registered_at`. Confirming the criteria is the act
   * that pre-registers them — see CONTROL_ROOM_SCOPE.md §5, where the whole
   * reason a Field Station draft has to land in Quarantine is that a machine
   * cannot set this. A record that already carried a hand-locked stamp keeps
   * its own date rather than having it overwritten.
   */
  registered_at: string;
  /** Lands on `kill_criteria_overridden`. */
  overridden: boolean;
  /** The four criteria as confirmed, inherited values included. */
  criteria: KillCriteriaFields;
  /** Lands on `kill_criteria_overrides` — only the fields that moved. */
  overrides: Partial<KillCriteriaFields>;
}

export type Confirmations = Readonly<Record<string, CriteriaConfirmation>>;

const NONE: Confirmations = Object.freeze({});

let confirmations: Confirmations = NONE;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): Confirmations {
  return confirmations;
}

/** Nothing has been confirmed at render time on the server, and nothing has on
 *  the client's first pass either — the store starts empty on every load. */
function getServerSnapshot(): Confirmations {
  return NONE;
}

export function confirmCriteria(id: string, confirmation: CriteriaConfirmation): void {
  confirmations = Object.freeze({ ...confirmations, [id]: confirmation });
  for (const listener of listeners) listener();
}

/** Held while its criteria are unconfirmed — on the record, or in this session. */
export function isHeld(e: Experiment, confirmed: Confirmations): boolean {
  return e.kill_criteria_confirmed_at === null && confirmed[e.id] === undefined;
}

/**
 * The register: every record whose criteria are confirmed. This is the pool the
 * Observatory, the priority tree and the sidebar count read — not `EXPERIMENTS`
 * — so a held record cannot appear in one surface and be missing from another.
 */
export function registerPool(confirmed: Confirmations): Experiment[] {
  return EXPERIMENTS.filter((e) => !isHeld(e, confirmed));
}

export function heldPool(confirmed: Confirmations): Experiment[] {
  return EXPERIMENTS.filter((e) => isHeld(e, confirmed));
}

/** Held records cleared during this session, newest first. */
export function graduatedPool(confirmed: Confirmations): Experiment[] {
  return EXPERIMENTS.filter((e) => e.kill_criteria_confirmed_at === null && confirmed[e.id] !== undefined);
}

/**
 * Reads the session's confirmations and derives the two pools from them. One
 * hook so the three surfaces that care — Observatory, Quarantine, sidebar —
 * cannot drift out of agreement about which records are in the register.
 */
export function useRegister(): { confirmations: Confirmations; register: Experiment[]; held: Experiment[] } {
  const confirmed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { confirmations: confirmed, register: registerPool(confirmed), held: heldPool(confirmed) };
}
