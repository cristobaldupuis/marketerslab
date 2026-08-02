import type { ExperimentStatus, LoopStage, RigorTier, RiskCategory, Touchpoint } from "./types";

/**
 * Every axis is declared here once — label, order, and any copy the UI needs.
 * Filters, chips and detail views all read from these arrays so adding a value
 * never means hunting through components.
 */

export const TOUCHPOINTS: { value: Touchpoint; label: string; blurb: string }[] = [
  { value: "paid_media", label: "Paid media", blurb: "Acquisition spend across social, search and retail media" },
  { value: "crm", label: "CRM", blurb: "Owned lifecycle — email, SMS, push, retention" },
  { value: "pdp", label: "PDP", blurb: "Product and category pages, cart and checkout" },
  { value: "offline", label: "Offline", blurb: "Packaging, inserts, retail, direct mail, events" },
];

export const LOOP_STAGES: { value: LoopStage; label: string; blurb: string }[] = [
  { value: "ideate", label: "Ideate", blurb: "Hypothesis is forming. Nothing committed yet." },
  { value: "brief", label: "Brief", blurb: "Design locked, kill criteria registered, awaiting build." },
  { value: "create", label: "Create", blurb: "Assets and variants in production." },
  { value: "launch", label: "Launch", blurb: "Live and collecting." },
  { value: "analyze", label: "Analyze", blurb: "Collection closed, reading the result." },
];

export const RISK_CATEGORIES: {
  value: RiskCategory;
  label: string;
  blurb: string;
  /** What this tag actually changes — not a badge. See DECISIONS.md. */
  rigor_default: RigorTier;
  kill_posture: string;
  judged_on: string;
}[] = [
  {
    value: "franchise",
    label: "Franchise",
    blurb: "Incremental improvement to something that already works.",
    rigor_default: "light",
    kill_posture: "Tight. Dies fast on weak signal — that is correct behaviour here.",
    judged_on: "Lift against control, at the pre-registered checkpoint.",
  },
  {
    value: "loonshot",
    label: "Loonshot",
    blurb: "Genuinely novel — new channel, new mechanic, no prior to lean on.",
    rigor_default: "deep",
    kill_posture: "Looser, with a longer runway. Franchise criteria kill these before they can prove out.",
    judged_on: "Lift, plus whether the test produced a structurally useful learning.",
  },
];

export const RIGOR_TIERS: { value: RigorTier; label: string; blurb: string }[] = [
  { value: "light", label: "Light", blurb: "Read the headline, move on." },
  { value: "standard", label: "Standard", blurb: "Powered, guardrailed, single primary metric." },
  { value: "deep", label: "Deep", blurb: "Full pre-registration and segment-level analysis." },
];

export const STATUSES: { value: ExperimentStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "running", label: "Running" },
  { value: "complete", label: "Complete" },
  { value: "killed", label: "Killed" },
];

/** Lookup helpers — cheap enough to build eagerly. */
const byValue = <T extends { value: string; label: string }>(items: T[]) =>
  Object.fromEntries(items.map((i) => [i.value, i])) as Record<string, T>;

export const TOUCHPOINT_BY = byValue(TOUCHPOINTS);
export const LOOP_STAGE_BY = byValue(LOOP_STAGES);
export const RISK_BY = byValue(RISK_CATEGORIES);
export const RIGOR_BY = byValue(RIGOR_TIERS);
export const STATUS_BY = byValue(STATUSES);

export const LOOP_STAGE_ORDER: LoopStage[] = LOOP_STAGES.map((s) => s.value);
