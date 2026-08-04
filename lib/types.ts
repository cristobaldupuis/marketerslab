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

/**
 * Franchise vs. loonshot, reused as the second axis of the kill-criteria
 * template matrix below. An alias, not a new taxonomy axis — the matrix reads
 * `touchpoint` and `risk_class` off the same four-axis taxonomy every other
 * record uses. See "Known constraint" in ROADMAP.md Pass B.
 */
export type RiskClass = RiskCategory;

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
 * A standardized kill-criteria template, keyed by touchpoint × risk class.
 * Experiments inherit from a matrix cell by default rather than having
 * criteria freely re-typed per record — see `lib/data/kill-criteria-templates.ts`.
 * The matrix is not a full cross-product: cells may point at the same
 * template where the underlying criteria genuinely don't differ.
 */
export interface KillCriteriaTemplate {
  id: string;
  touchpoint: Touchpoint;
  risk_class: RiskClass;
  min_sample_size: number;
  min_runtime_days: number;
  max_runtime_days: number;
  /** e.g. "+5% vs control at 95% confidence". */
  win_threshold: string;
}

/** The subset of a template's fields an experiment can override. */
export type KillCriteriaFields = Pick<
  KillCriteriaTemplate,
  "min_sample_size" | "min_runtime_days" | "max_runtime_days" | "win_threshold"
>;

/**
 * What a test was actually randomised on. `ExperimentDesign.allocation` already
 * says this in prose; this is the machine-readable half of the same fact, and it
 * exists because it decides whether a template's `min_sample_size` floor is even
 * applicable. A geo-split or budget-split test does not accrue a user-level
 * sample — `EXP-0094` is powered on four matched metro pairs — so comparing its
 * `sample_per_arm` against a 12,000-household floor compares two different
 * things. See `lib/criteria.ts`.
 *
 * Not a taxonomy axis, and not on `Experiment`: it describes the statistical
 * design, sitting alongside `power` and `alpha`, and nothing browses or groups
 * by it.
 */
export type RandomisationUnit = "household" | "visitor" | "order" | "geo" | "budget";

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
  /** The unit `allocation` describes, as an enum. See `RandomisationUnit`. */
  randomisation_unit: RandomisationUnit;
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
  /** Which matrix cell this record's kill criteria are standardized against —
   *  see `lib/data/kill-criteria-templates.ts`. */
  kill_criteria_template_id: string;
  /** True if any field below was consciously overridden rather than
   *  inherited as-is. Set by Quarantine's confirm step (Pass C); only
   *  meaningful once `kill_criteria_confirmed_at` is set. */
  kill_criteria_overridden: boolean;
  /** Only present when `kill_criteria_overridden` is true. */
  kill_criteria_overrides?: Partial<KillCriteriaFields>;
  /**
   * When a human accepted or overrode the criteria inherited from this
   * record's matrix cell. Null until then, and a null record is held in
   * Quarantine — invisible to the Observatory, the priority tree and the
   * register count until it graduates.
   *
   * Workflow state, not a fifth taxonomy axis. The four axes are browsing
   * dimensions: each has several values, every record carries one for life,
   * and the filter bar and the pattern/priority groupings all read them.
   * This is a one-way gate that flips exactly once and is never filtered on
   * — the same category of field as `launched_at` and `concluded_at`, which
   * is also why it is a nullable date rather than a boolean. See ROADMAP.md
   * Pass C.
   */
  kill_criteria_confirmed_at: string | null;
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
