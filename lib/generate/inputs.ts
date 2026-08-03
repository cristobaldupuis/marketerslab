/** Plan-builder input vocabulary — shared by the form and the prompt/fallback
 *  builders so the three never drift apart. */

export const INDUSTRIES = [
  "DTC grocery / CPG",
  "Subscription retail",
  "Marketplace / multi-brand",
  "Direct-to-consumer apparel",
  "SaaS / subscription software",
  "Foodservice & offline retail",
] as const;

export const STAGES = [
  "Pre-seed — no repeatable channel yet",
  "Seed — one channel working, proving a second",
  "Growth — scaling proven channels",
  "Established — optimising at scale",
] as const;

export const BUDGETS = [
  "Under $10k per test",
  "$10k–50k per test",
  "$50k–250k per test",
  "$250k+ per test",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type Stage = (typeof STAGES)[number];
export type Budget = (typeof BUDGETS)[number];

/** Rough scale a budget bucket implies for a power sketch — used by both the
 *  fallback composer and as a steer in the model prompt. Not a real power
 *  calculation; the point is that the number moves with the input rather than
 *  being fixed regardless of what was asked. */
export function budgetScale(budget: string): { samplePerArm: number; runtimeDays: number } {
  switch (budget) {
    case BUDGETS[0]:
      return { samplePerArm: 2600, runtimeDays: 28 };
    case BUDGETS[1]:
      return { samplePerArm: 9800, runtimeDays: 21 };
    case BUDGETS[2]:
      return { samplePerArm: 32000, runtimeDays: 18 };
    case BUDGETS[3]:
      return { samplePerArm: 85000, runtimeDays: 14 };
    default:
      return { samplePerArm: 9800, runtimeDays: 21 };
  }
}
