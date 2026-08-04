import { KILL_CRITERIA_TEMPLATE_BY_ID, templateFor } from "./data/kill-criteria-templates";
import { formatCount } from "./format";
import type {
  Experiment,
  KillCriteriaFields,
  KillCriteriaTemplate,
  RandomisationUnit,
} from "./types";

/**
 * Reads a record's design against the kill criteria it is standardized on.
 *
 * Pass B assigned every record a matrix cell; nothing ever checked whether the
 * design underneath agreed with it. Pass C built that check, but only inside
 * Quarantine, so it only ever ran on records that had not been cleared yet —
 * which is backwards, since the register is where the un-reconciled records
 * actually live. This module is that check, extracted so Quarantine and the
 * Laboratory run the same one.
 *
 * Computed, never tagged — the same discipline as `findReversal` in
 * `lib/segments.ts` and the pipeline prompts in `lib/priority.ts`. Nothing in
 * the seed data flags a disagreement; every finding below is derived, which is
 * why fixing a seeded number makes a finding disappear on its own.
 */

/** Units at which a `min_sample_size` floor is a comparable quantity. */
const USER_LEVEL: RandomisationUnit[] = ["household", "visitor", "order"];

const UNIT_LABEL: Record<RandomisationUnit, string> = {
  household: "household",
  visitor: "visitor",
  order: "order",
  geo: "geographic",
  budget: "budget",
};

export type FindingKind =
  | "sample_below_floor"
  | "runtime_over_max"
  | "runtime_under_min"
  /** Not a disagreement — a statement that one check does not apply here. */
  | "floor_not_applicable";

export interface CriteriaFinding {
  kind: FindingKind;
  note: string;
}

export interface CriteriaFit {
  /** The cell this record is standardized against. */
  template: KillCriteriaTemplate;
  /** The template's fields with any override applied — what actually governs. */
  criteria: KillCriteriaFields;
  findings: CriteriaFinding[];
  /** Nothing disagrees. A `floor_not_applicable` note does not make a record unclear. */
  clear: boolean;
}

/** The cell a record points at, falling back to its touchpoint × risk pair if
 *  the id is stale — a record must always have criteria to be read against. */
export function templateOf(e: Experiment): KillCriteriaTemplate {
  return (
    KILL_CRITERIA_TEMPLATE_BY_ID[e.kill_criteria_template_id] ??
    templateFor(e.touchpoint, e.risk_category)
  );
}

export function inheritedCriteria(e: Experiment): KillCriteriaFields {
  const t = templateOf(e);
  return {
    min_sample_size: t.min_sample_size,
    min_runtime_days: t.min_runtime_days,
    max_runtime_days: t.max_runtime_days,
    win_threshold: t.win_threshold,
  };
}

/** What actually governs this record: the cell, plus its override if it has one. */
export function effectiveCriteria(e: Experiment): KillCriteriaFields {
  const inherited = inheritedCriteria(e);
  if (!e.kill_criteria_overridden || !e.kill_criteria_overrides) return inherited;
  return { ...inherited, ...e.kill_criteria_overrides };
}

/**
 * Runtime is read off what the test actually did once it has concluded, and off
 * what it plans otherwise. A maximum is a stop rule, so the question is what the
 * test ran to — not what someone wrote down before it started. This is why
 * `EXP-0094` is not flagged: it planned 42 days against a 35-day cap and was
 * stopped at 28.
 */
function runtimeOf(e: Experiment): { days: number; concluded: boolean } {
  return e.design.actual_runtime_days === null
    ? { days: e.design.planned_runtime_days, concluded: false }
    : { days: e.design.actual_runtime_days, concluded: true };
}

/**
 * `criteria` defaults to what governs the record today; Quarantine passes the
 * draft being edited in its confirm step, so the reader updates live as someone
 * moves a value.
 */
export function criteriaFit(e: Experiment, criteria: KillCriteriaFields = effectiveCriteria(e)): CriteriaFit {
  const findings: CriteriaFinding[] = [];
  const d = e.design;
  const unit = d.randomisation_unit;
  const sample = d.sample_per_arm;
  const { days, concluded } = runtimeOf(e);

  if (sample > 0) {
    if (!USER_LEVEL.includes(unit)) {
      findings.push({
        kind: "floor_not_applicable",
        // The floor is a count of people; this test does not accrue people per
        // arm, so asserting a breach would compare two different quantities.
        note: `Randomised at ${UNIT_LABEL[unit]} level, so the ${formatCount(
          criteria.min_sample_size,
        )} floor does not apply — ${formatCount(sample)} per arm is not the same quantity.`,
      });
    } else if (sample < criteria.min_sample_size) {
      findings.push({
        kind: "sample_below_floor",
        note: `Powered for ${formatCount(sample)} ${UNIT_LABEL[unit]}s per arm, under the ${formatCount(
          criteria.min_sample_size,
        )} floor.`,
      });
    }
  }

  if (days > 0 && days > criteria.max_runtime_days) {
    findings.push({
      kind: "runtime_over_max",
      note: `${concluded ? "Ran" : "Plans"} ${days} days, past the ${criteria.max_runtime_days}-day maximum.`,
    });
  }

  if (days > 0 && days < criteria.min_runtime_days) {
    findings.push({
      kind: "runtime_under_min",
      note: concluded
        ? `Stopped at ${days} days, short of the ${criteria.min_runtime_days}-day minimum.`
        : `Plans ${days} days, short of the ${criteria.min_runtime_days}-day minimum.`,
    });
  }

  return {
    template: templateOf(e),
    criteria,
    findings,
    clear: findings.every((f) => f.kind === "floor_not_applicable"),
  };
}

/** The findings that are actually disagreements, for callers that want a count. */
export function disagreements(fit: CriteriaFit): CriteriaFinding[] {
  return fit.findings.filter((f) => f.kind !== "floor_not_applicable");
}

/** Which of the four fields an override actually moved. */
export function movedFields(
  inherited: KillCriteriaFields,
  criteria: KillCriteriaFields,
): (keyof KillCriteriaFields)[] {
  return (Object.keys(inherited) as (keyof KillCriteriaFields)[]).filter(
    (key) => inherited[key] !== criteria[key],
  );
}
