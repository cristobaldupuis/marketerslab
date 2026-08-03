import { BRAND_BY_ID } from "./data/brands";
import { EXPERIMENTS } from "./data/experiments";
import type { Experiment, SegmentNode } from "./types";

/**
 * Cross-brand pattern view — the agency case.
 *
 * The question this answers is the one a holding company actually has: when the
 * same test runs at three brands and gives three different answers, which of
 * those answers is a real difference between brands and which is sampling
 * noise? That is a heterogeneity question, so it is answered with a
 * heterogeneity statistic rather than with an adjective.
 *
 * Nothing here is a new taxonomy axis (see DECISIONS.md — four is the ceiling).
 * A family is derived, not tagged: **experiments with the same title at
 * different brands are the same test**. That is the convention. If you want two
 * records to be siblings, give them the same title.
 */

/** Two-sided 95%. The seeded intervals are all 95%, so this is the only z. */
const Z = 1.959964;

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface PatternStudy {
  experiment: Experiment;
  /** Topline effect and interval, read off the tree root rather than parsed out
   *  of the headline string — the tree is the structured copy. */
  effect: number;
  interval: [number, number];
  n: number;
  /** Standard error implied by the interval half-width. */
  se: number;
  /** Inverse-variance weight this study carries in the pooled estimate. */
  weight: number;
  /** Direction relative to the pooled estimate. */
  verdict: "holds" | "reverses" | "unresolved";
}

export interface PooledEstimate {
  effect: number;
  interval: [number, number];
  /** Cochran's Q and its degrees of freedom. */
  q: number;
  df: number;
  /** Share of the variation between studies that is real rather than sampling
   *  error. Higgins' I². This is the whole answer, in one number. */
  i2: number;
  consistency: "holds" | "varies" | "brand_specific";
}

export interface ExperimentFamily {
  /** Earliest record in the family. Also the route segment — /patterns/EXP-0112
   *  is short, stable and obviously connected to the record you came from. */
  anchorId: string;
  title: string;
  /** Every record with this title, earliest first. */
  members: Experiment[];
  /** The subset carrying a segment tree, which is what can actually be pooled. */
  studies: PatternStudy[];
  pooled: PooledEstimate | null;
  totalN: number;
  /** The pooled tree, brand as the root split. Null if fewer than two studies. */
  tree: SegmentNode | null;
}

export const CONSISTENCY_COPY: Record<
  PooledEstimate["consistency"],
  { label: string; blurb: string }
> = {
  holds: {
    label: "Pattern holds",
    blurb:
      "The brands agree within sampling error. One result here is a fair prediction of the next brand you run it at.",
  },
  varies: {
    label: "Direction holds, size varies",
    blurb:
      "The brands point the same way, but not by the same amount. Expect the direction to transfer and the magnitude not to.",
  },
  brand_specific: {
    label: "Brand-specific",
    blurb:
      "Most of the spread between these results is real difference between brands, not noise. A result at one brand does not predict the next.",
  },
};

/** Higgins' conventional cut points. Named so the thresholds are arguable
 *  rather than buried in a comparison. */
function consistencyOf(i2: number): PooledEstimate["consistency"] {
  if (i2 < 0.25) return "holds";
  if (i2 < 0.75) return "varies";
  return "brand_specific";
}

const sign = (n: number) => (n < 0 ? -1 : 1);

function studyFrom(experiment: Experiment): PatternStudy | null {
  const tree = experiment.segment_tree;
  if (!tree) return null;
  const [lo, hi] = tree.interval;
  const se = (hi - lo) / (2 * Z);
  if (!(se > 0)) return null;
  return {
    experiment,
    effect: tree.effect,
    interval: tree.interval,
    n: tree.n,
    se,
    weight: 1 / (se * se),
    // Filled in once the pooled estimate exists.
    verdict: "unresolved",
  };
}

/**
 * Fixed-effect inverse-variance pooling. A plain n-weighted average would let a
 * brand with a wide interval pull the estimate as hard as a brand with a tight
 * one, which is exactly the mistake this view exists to stop someone making.
 */
function pool(studies: PatternStudy[]): PooledEstimate | null {
  if (studies.length < 2) return null;

  const sumW = studies.reduce((s, x) => s + x.weight, 0);
  const effect = studies.reduce((s, x) => s + x.weight * x.effect, 0) / sumW;
  const se = Math.sqrt(1 / sumW);

  const q = studies.reduce((s, x) => s + x.weight * (x.effect - effect) ** 2, 0);
  const df = studies.length - 1;
  const i2 = q > df ? (q - df) / q : 0;

  return {
    effect: round1(effect),
    interval: [round1(effect - Z * se), round1(effect + Z * se)],
    q,
    df,
    i2,
    consistency: consistencyOf(i2),
  };
}

/** Namespaced and re-weighted so a brand's subtree can sit inside a pooled one.
 *  Ids collide otherwise — every seeded tree calls its root "root". */
function reweight(node: SegmentNode, brandId: string, factor: number): SegmentNode {
  return {
    ...node,
    id: `${brandId}:${node.id}`,
    // Share becomes share of the pooled population, not of its own test.
    share: node.share * factor,
    children: node.children.map((child) => reweight(child, brandId, factor)),
  };
}

function pooledTree(
  studies: PatternStudy[],
  pooled: PooledEstimate | null,
  totalN: number,
): SegmentNode | null {
  if (!pooled || studies.length < 2) return null;

  return {
    id: "pooled",
    label: "All households, every brand",
    share: 1,
    n: totalN,
    effect: pooled.effect,
    interval: pooled.interval,
    split: "Brand",
    note: `Fixed-effect estimate across ${studies.length} runs of the same test. Brand is the first split because, on this evidence, it is the variable that explains most of the disagreement.`,
    children: studies.map((study) => {
      const brand = BRAND_BY_ID[study.experiment.brand_id];
      const tree = study.experiment.segment_tree!;
      return {
        ...reweight(tree, study.experiment.brand_id, study.n / totalN),
        label: brand.name,
        note: study.experiment.summary,
      };
    }),
  };
}

function buildFamily(members: Experiment[]): ExperimentFamily {
  const studies = members.map(studyFrom).filter((s): s is PatternStudy => s !== null);
  const totalN = studies.reduce((s, x) => s + x.n, 0);
  const pooled = pool(studies);

  if (pooled) {
    for (const study of studies) {
      const [lo, hi] = study.interval;
      const resolved = lo > 0 || hi < 0;
      study.verdict = !resolved
        ? "unresolved"
        : sign(study.effect) === sign(pooled.effect)
          ? "holds"
          : "reverses";
    }
  }

  return {
    anchorId: members[0].id,
    title: members[0].title,
    members,
    studies,
    pooled,
    totalN,
    tree: pooledTree(studies, pooled, totalN),
  };
}

/** Same title at more than one brand. Single-brand titles are not a family. */
const grouped = new Map<string, Experiment[]>();
for (const experiment of [...EXPERIMENTS].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
  const bucket = grouped.get(experiment.title);
  if (bucket) bucket.push(experiment);
  else grouped.set(experiment.title, [experiment]);
}

export const FAMILIES: ExperimentFamily[] = [...grouped.values()]
  .filter((members) => new Set(members.map((e) => e.brand_id)).size > 1)
  .map(buildFamily);

export const FAMILY_BY_ANCHOR = Object.fromEntries(
  FAMILIES.map((f) => [f.anchorId, f]),
) as Record<string, ExperimentFamily>;

/** The family a record belongs to, if any. Drives the link on the record. */
export function familyOf(experimentId: string): ExperimentFamily | null {
  return FAMILIES.find((f) => f.members.some((m) => m.id === experimentId)) ?? null;
}
