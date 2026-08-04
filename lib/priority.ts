import { LOOP_STAGE_BY, LOOP_STAGE_ORDER, RISK_CATEGORIES } from "./taxonomy";
import type { Experiment, LoopStage, RiskCategory } from "./types";

/**
 * Pure readers over the register for the Observatory's pipeline-priority
 * tree — "what should run next," as distinct from lib/segments.ts, which
 * answers "why did this win or lose." Nothing here builds a SegmentNode;
 * it groups the active register by loop stage and risk category and
 * surfaces gaps as computed prompts, the same discipline findReversal uses:
 * derived from the data, never hand-tagged.
 */

/** Concluded records (complete/killed) are history, not "what's next." */
const ACTIVE_STATUSES: Experiment["status"][] = ["planned", "running"];

/**
 * Takes the register rather than reading `EXPERIMENTS` (Pass C): a record held
 * in Quarantine has not been cleared to run, so it cannot be an answer to "what
 * should run next," and the caller is the one that knows which records those
 * are. See `lib/quarantine.ts`.
 */
export function activeExperiments(register: Experiment[]): Experiment[] {
  return register.filter((e) => ACTIVE_STATUSES.includes(e.status));
}

export interface RiskBucket {
  risk: RiskCategory;
  experiments: Experiment[];
}

export interface StageBucket {
  stage: LoopStage;
  experiments: Experiment[];
  byRisk: RiskBucket[];
}

/** Every stage, in lifecycle order, even the empty ones — the gap is exactly
 *  what a prioritization read is looking for, so it doesn't get filtered out. */
export function pipelineByStage(pool: Experiment[]): StageBucket[] {
  return LOOP_STAGE_ORDER.map((stage) => {
    const experiments = pool.filter((e) => e.loop_stage === stage);
    const byRisk = RISK_CATEGORIES.map((r) => ({
      risk: r.value,
      experiments: experiments.filter((e) => e.risk_category === r.value),
    })).filter((bucket) => bucket.experiments.length > 0);
    return { stage, experiments, byRisk };
  });
}

export interface PipelinePrompt {
  kind: "empty" | "single-risk";
  stage: LoopStage;
  note: string;
}

/**
 * Computed prompts, not asserted ones — same discipline as findReversal in
 * lib/segments.ts. "Empty" flags a stage with nothing moving through it;
 * "single-risk" flags a stage carrying enough volume to matter but only one
 * risk category, which is exactly the imbalance the franchise/loonshot split
 * exists to catch (see AGENTS.md).
 */
export function pipelinePrompts(buckets: StageBucket[]): PipelinePrompt[] {
  const prompts: PipelinePrompt[] = [];

  for (const bucket of buckets) {
    const label = LOOP_STAGE_BY[bucket.stage].label;

    if (bucket.experiments.length === 0) {
      prompts.push({
        kind: "empty",
        stage: bucket.stage,
        note: `${label} is empty — nothing active is sitting here right now.`,
      });
      continue;
    }

    if (bucket.experiments.length >= 2 && bucket.byRisk.length === 1) {
      const only = RISK_CATEGORIES.find((r) => r.value === bucket.byRisk[0].risk)!;
      const missing = RISK_CATEGORIES.find((r) => r.value !== only.value)!;
      prompts.push({
        kind: "single-risk",
        stage: bucket.stage,
        note: `${label} is all ${only.label.toLowerCase()} — no ${missing.label.toLowerCase()} moving through this stage.`,
      });
    }
  }

  return prompts;
}

export function totalsByRisk(pool: Experiment[]): Record<RiskCategory, number> {
  return {
    franchise: pool.filter((e) => e.risk_category === "franchise").length,
    loonshot: pool.filter((e) => e.risk_category === "loonshot").length,
  };
}
