import type { KillCriteriaTemplate, RiskClass, Touchpoint } from "../types";

/**
 * The kill-criteria matrix: touchpoint × risk class. Six templates cover all
 * eight cells — paid media and CRM share a template within each risk class,
 * since both are high-velocity digital channels with comparable sample
 * accrual. PDP and offline stay distinct: PDP carries weekly seasonality
 * that pushes out the minimum runtime, and offline (packaging, direct mail,
 * retail) accrues slowest of the four, so both its minimums and its maximum
 * runway are longer. This is the point of "not a full cross-product" in
 * ROADMAP.md Pass B — a cell is a pointer, not guaranteed-unique data.
 *
 * Franchise stays tight and fast everywhere (small sample floor, short
 * runway, a modest win bar) so it dies quickly on weak signal. Loonshot
 * stays loose and slow everywhere (larger sample floor so a genuinely novel
 * mechanic gets a fair hearing, longer runway, a bigger win bar since the
 * claim being tested is bigger) — see the franchise/loonshot kill posture in
 * DECISIONS.md, which this matrix exists to standardize rather than replace.
 */
export const KILL_CRITERIA_TEMPLATES: KillCriteriaTemplate[] = [
  {
    id: "digital-franchise",
    touchpoint: "paid_media",
    risk_class: "franchise",
    min_sample_size: 6000,
    min_runtime_days: 7,
    max_runtime_days: 14,
    win_threshold: "+3% vs control at 90% confidence",
  },
  {
    id: "digital-loonshot",
    touchpoint: "paid_media",
    risk_class: "loonshot",
    min_sample_size: 12000,
    min_runtime_days: 14,
    max_runtime_days: 35,
    win_threshold: "+5% vs control at 95% confidence",
  },
  {
    id: "pdp-franchise",
    touchpoint: "pdp",
    risk_class: "franchise",
    min_sample_size: 15000,
    min_runtime_days: 10,
    max_runtime_days: 21,
    win_threshold: "+4% vs control at 95% confidence",
  },
  {
    id: "pdp-loonshot",
    touchpoint: "pdp",
    risk_class: "loonshot",
    min_sample_size: 25000,
    min_runtime_days: 21,
    max_runtime_days: 45,
    win_threshold: "+6% vs control at 95% confidence",
  },
  {
    id: "offline-franchise",
    touchpoint: "offline",
    risk_class: "franchise",
    min_sample_size: 3000,
    min_runtime_days: 21,
    max_runtime_days: 42,
    win_threshold: "+5% vs control at 90% confidence",
  },
  {
    id: "offline-loonshot",
    touchpoint: "offline",
    risk_class: "loonshot",
    min_sample_size: 5000,
    min_runtime_days: 42,
    max_runtime_days: 90,
    win_threshold: "+8% vs control at 95% confidence",
  },
];

export const KILL_CRITERIA_TEMPLATE_BY_ID = Object.fromEntries(
  KILL_CRITERIA_TEMPLATES.map((t) => [t.id, t]),
) as Record<string, KillCriteriaTemplate>;

/** The matrix cell for a touchpoint × risk class pair. CRM shares the digital
 *  templates with paid media (see module doc); every other touchpoint maps
 *  to its own pair of cells. */
const MATRIX: Record<Touchpoint, Record<RiskClass, string>> = {
  paid_media: { franchise: "digital-franchise", loonshot: "digital-loonshot" },
  crm: { franchise: "digital-franchise", loonshot: "digital-loonshot" },
  pdp: { franchise: "pdp-franchise", loonshot: "pdp-loonshot" },
  offline: { franchise: "offline-franchise", loonshot: "offline-loonshot" },
};

export function templateIdFor(touchpoint: Touchpoint, riskClass: RiskClass): string {
  return MATRIX[touchpoint][riskClass];
}

export function templateFor(touchpoint: Touchpoint, riskClass: RiskClass): KillCriteriaTemplate {
  return KILL_CRITERIA_TEMPLATE_BY_ID[templateIdFor(touchpoint, riskClass)];
}
