import type { LoopStage, RiskCategory, RigorTier, Touchpoint } from "../types";

/**
 * A generated proposal is deliberately a smaller shape than `Experiment` — it
 * has no id in the register, no brand, no dates. It is not a record yet, it is
 * a pre-registered plan for one. `rigor_tier` is never set by the model: it is
 * always derived from `risk_category` (see `lib/taxonomy.ts` `RISK_BY`), so a
 * loonshot proposal with franchise-tight kill criteria cannot happen.
 */
export interface ProposalDesign {
  primary_metric: string;
  baseline: string;
  mde: string;
  power: number;
  alpha: number;
  sample_per_arm: number;
  arms: string[];
  planned_runtime_days: number;
  allocation: string;
  guardrails: string[];
  design_note: string;
}

export interface ProposalKillCriteria {
  /** Phrased as a commitment: "stop if X by Y". */
  rule: string;
  checkpoint: string;
}

export interface GeneratedProposal {
  title: string;
  hypothesis: string;
  touchpoint: Touchpoint;
  risk_category: RiskCategory;
  /** Always `RISK_BY[risk_category].rigor_default` — never model-set. */
  rigor_tier: RigorTier;
  /** A generated proposal always sits at Brief: design locked, kill criteria
   *  registered, awaiting build. */
  loop_stage: LoopStage;
  summary: string;
  design: ProposalDesign;
  kill_criteria: ProposalKillCriteria;
  /** Why this test, specifically. For the roadmap generator this is the lever
   *  — the segment/channel/mechanic/timing that actually drove the source
   *  result — not a restatement of the headline. */
  rationale: string;
}

export type GenerateSource = "model" | "fallback";

export interface GenerateResponse {
  source: GenerateSource;
  proposals: GeneratedProposal[];
}

export type PlanRequest = {
  mode: "plan";
  industry: string;
  stage: string;
  budget: string;
  touchpoint: Touchpoint;
};

export type RoadmapRequest = {
  mode: "roadmap";
  experimentId: string;
};

export type GenerateRequest = PlanRequest | RoadmapRequest;
