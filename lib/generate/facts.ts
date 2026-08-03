import { BRAND_BY_ID } from "../data/brands";
import { EXPERIMENT_BY_ID } from "../data/experiments";
import { familyOf, type ExperimentFamily } from "../patterns";
import { findDriver, findReversal, pathTo } from "../segments";
import type { Brand, Experiment, SegmentNode } from "../types";

/**
 * The structured facts the roadmap generator is built on — read straight off
 * the segment tree and the pattern view rather than re-derived by the model.
 * `findDriver` and `findReversal` already carry the "which segment actually
 * drove this" analysis; feeding them in as facts is the whole point of this
 * pass over independently re-discovering the tree from a text summary.
 */
export interface RoadmapFacts {
  experiment: Experiment;
  brand: Brand;
  tree: SegmentNode;
  /** The leaf carrying the topline in its own direction. */
  driver: SegmentNode | null;
  /** The leaf, if any, that moved significantly against the topline. */
  reversal: SegmentNode | null;
  /** The split variable that produced the driver/reversal, read off its
   *  parent — null at the root (nothing produced the topline itself). */
  leverVariable: string | null;
  /** Cross-brand replication, if this record is part of a family. */
  family: ExperimentFamily | null;
}

/** Only a completed record with a segment tree has a lever to build on. */
export function eligibleForRoadmap(e: Experiment): boolean {
  return e.status === "complete" && e.segment_tree !== null;
}

export const ROADMAP_ELIGIBLE_IDS: string[] = Object.values(EXPERIMENT_BY_ID)
  .filter(eligibleForRoadmap)
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((e) => e.id);

export function roadmapFacts(experimentId: string): RoadmapFacts | null {
  const experiment = EXPERIMENT_BY_ID[experimentId];
  if (!experiment || !eligibleForRoadmap(experiment)) return null;
  const tree = experiment.segment_tree!;

  const driver = findDriver(tree);
  const reversal = findReversal(tree);
  const leverNode = reversal ?? driver;
  const leverVariable = leverNode
    ? (pathTo(tree, leverNode.id).at(-2)?.split ?? tree.split)
    : null;

  return {
    experiment,
    brand: BRAND_BY_ID[experiment.brand_id],
    tree,
    driver,
    reversal,
    leverVariable,
    family: familyOf(experimentId),
  };
}
