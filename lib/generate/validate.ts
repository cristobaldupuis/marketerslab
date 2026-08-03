import { RISK_BY, TOUCHPOINTS } from "../taxonomy";
import type { RiskCategory, Touchpoint } from "../types";
import type { GeneratedProposal } from "./types";

/**
 * Coerces a raw tool-call payload into a `GeneratedProposal`, or returns null
 * if it is too broken to render honestly. `touchpoint` and `risk_category`
 * are enums from `lib/taxonomy.ts` and must be coerced to valid values or the
 * proposal is dropped — a silently-invented touchpoint is worse than one
 * fewer proposal. `rigor_tier` is never read from the model: it is always
 * `RISK_BY[risk_category].rigor_default`, which is what makes "loonshot with
 * franchise-tight kill criteria" structurally impossible rather than a bug to
 * catch after the fact.
 */

const TOUCHPOINT_VALUES = new Set<string>(TOUCHPOINTS.map((t) => t.value));
const RISK_VALUES = new Set<string>(Object.keys(RISK_BY));

function str(v: unknown, max = 4000): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function strArray(v: unknown, max = 8): string[] | null {
  if (!Array.isArray(v)) return null;
  const items = v.map((x) => str(x, 200)).filter((x): x is string => x !== null);
  return items.length ? items.slice(0, max) : null;
}

function num(v: unknown, lo: number, hi: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < lo || n > hi) return null;
  return n;
}

function int(v: unknown, lo: number, hi: number): number | null {
  const n = num(v, lo, hi);
  return n === null ? null : Math.round(n);
}

export function coerceProposal(raw: unknown): GeneratedProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const title = str(r.title, 140);
  const hypothesis = str(r.hypothesis, 1200);
  const summary = str(r.summary, 400);
  const rationale = str(r.rationale, 1200);
  const touchpointRaw = str(r.touchpoint, 40);
  const riskRaw = str(r.risk_category, 40);
  if (!title || !hypothesis || !summary || !rationale || !touchpointRaw || !riskRaw) return null;

  const touchpoint = touchpointRaw.toLowerCase();
  const risk = riskRaw.toLowerCase();
  if (!TOUCHPOINT_VALUES.has(touchpoint) || !RISK_VALUES.has(risk)) return null;

  const d = r.design;
  if (!d || typeof d !== "object") return null;
  const dr = d as Record<string, unknown>;

  const primary_metric = str(dr.primary_metric, 200);
  const baseline = str(dr.baseline, 100);
  const mde = str(dr.mde, 100);
  const power = num(dr.power, 0.5, 0.999);
  const alpha = num(dr.alpha, 0.001, 0.2);
  const sample_per_arm = int(dr.sample_per_arm, 10, 5_000_000);
  const arms = strArray(dr.arms, 4);
  const planned_runtime_days = int(dr.planned_runtime_days, 1, 365);
  const allocation = str(dr.allocation, 200);
  const guardrails = strArray(dr.guardrails, 6);
  const design_note = str(dr.design_note, 600);
  if (
    !primary_metric ||
    !baseline ||
    !mde ||
    power === null ||
    alpha === null ||
    sample_per_arm === null ||
    !arms ||
    arms.length < 2 ||
    planned_runtime_days === null ||
    !allocation ||
    !guardrails ||
    !design_note
  ) {
    return null;
  }

  const k = r.kill_criteria;
  if (!k || typeof k !== "object") return null;
  const kr = k as Record<string, unknown>;
  const rule = str(kr.rule, 500);
  const checkpoint = str(kr.checkpoint, 150);
  if (!rule || !checkpoint) return null;

  const risk_category = risk as RiskCategory;

  return {
    title,
    hypothesis,
    touchpoint: touchpoint as Touchpoint,
    risk_category,
    rigor_tier: RISK_BY[risk_category].rigor_default,
    loop_stage: "brief",
    summary,
    design: {
      primary_metric,
      baseline,
      mde,
      power,
      alpha,
      sample_per_arm,
      arms,
      planned_runtime_days,
      allocation,
      guardrails,
      design_note,
    },
    kill_criteria: { rule, checkpoint },
    rationale,
  };
}

export function coerceProposals(raw: unknown, max: number): GeneratedProposal[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as Record<string, unknown>).proposals;
  if (!Array.isArray(list)) return [];
  const out: GeneratedProposal[] = [];
  for (const item of list) {
    const proposal = coerceProposal(item);
    if (proposal) out.push(proposal);
    if (out.length >= max) break;
  }
  return out;
}
