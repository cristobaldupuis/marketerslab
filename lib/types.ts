/**
 * Core entities for Marketers Lab.
 *
 * The four-axis taxonomy (touchpoint / loop stage / risk category / brand) is the
 * ceiling for the demo — see DECISIONS.md before adding a fifth axis.
 */

export type Touchpoint = "paid_media" | "crm" | "pdp" | "offline";
export type LoopStage = "ideate" | "brief" | "create" | "launch" | "analyze";
export type RiskCategory = "franchise" | "loonshot";
export type RigorTier = "light" | "standard" | "deep";
export type ExperimentStatus = "planned" | "running" | "complete" | "killed";

/** Tone channel for a concluded result. Kept separate from `status` so a killed
 *  experiment can still have been a genuine learning rather than a loss. */
export type Outcome = "won" | "lost" | "flat" | "learning";

export interface Brand {
  id: string;
  name: string;
  description: string;
  /** Two-letter mark used in the record header and card rail. */
  initials: string;
}

/**
 * Pre-registration record. This is deliberately not a free-text field written
 * after the fact — `registered_at` is always before `launched_at`, and the UI
 * leans on that to prove the criteria were set up front.
 */
export interface KillCriteria {
  /** The rule itself, phrased as a commitment: "stop if X by Y". */
  rule: string;
  /** When the rule was locked. Always precedes launch. */
  registered_at: string;
  /** When the rule gets evaluated, in the operator's words. */
  checkpoint: string;
  /** What actually happened against the rule, once known. */
  disposition: "not_yet_evaluated" | "passed" | "triggered";
  /** One line on how the rule resolved. Null while the test is still pre-checkpoint. */
  disposition_note: string | null;
}

/**
 * The pre-registered statistical design. Numbers are fabricated but internally
 * consistent — MDE, baseline and sample size are in the right relationship to
 * each other so the deep view reads as real work rather than lorem ipsum.
 */
export interface ExperimentDesign {
  primary_metric: string;
  baseline: string;
  /** Minimum detectable effect, relative. */
  mde: string;
  power: number;
  alpha: number;
  /** Per-arm sample target from the power calculation. */
  sample_per_arm: number;
  /** Per-arm sample actually collected. Null before launch. */
  collected_per_arm: number | null;
  arms: string[];
  planned_runtime_days: number;
  actual_runtime_days: number | null;
  allocation: string;
  guardrails: string[];
  /** One sentence explaining why the design was sized the way it was. */
  design_note: string;
}

export interface HeadlineResult {
  label: string;
  value: string;
  /** Confidence interval or equivalent uncertainty framing. */
  interval: string;
  direction: "up" | "down" | "flat";
}

export interface Experiment {
  id: string;
  brand_id: string;
  title: string;
  hypothesis: string;
  touchpoint: Touchpoint;
  loop_stage: LoopStage;
  risk_category: RiskCategory;
  /** Defaults follow from risk_category (see taxonomy.ts) but are set per experiment. */
  rigor_tier: RigorTier;
  status: ExperimentStatus;
  /** Short human verdict, e.g. "Won — +4.2% checkout conversion". Null while open. */
  verdict: string | null;
  outcome: Outcome | null;
  /** The single sentence a busy operator reads in the simple view. */
  summary: string;
  headline: HeadlineResult | null;
  kill_criteria: KillCriteria;
  design: ExperimentDesign;
  owner: string;
  created_at: string;
  updated_at: string;
  launched_at: string | null;
  concluded_at: string | null;
  /**
   * Pass 2 payload. Seeded here so the decision-tree pass is a rendering
   * problem, not a data-modelling one. Nothing in Pass 1 renders this.
   */
  segment_tree: SegmentNode | null;
}

/**
 * CART-style segment tree — the Pass 2 centrepiece. Each node is a
 * sub-population; `split` describes how its children were separated.
 * Not rendered in Pass 1.
 */
export interface SegmentNode {
  id: string;
  /** Human label for the sub-population at this node. */
  label: string;
  /** Share of the total test population landing at this node. */
  share: number;
  n: number;
  /** Treatment effect within this node, relative to control. */
  effect: number;
  interval: [number, number];
  /** The variable this node splits on. Null at a leaf. */
  split: string | null;
  children: SegmentNode[];
  /** Plain-language read of what this node means. */
  note: string;
}
