import type { SegmentNode } from "./types";

/**
 * Pure readers over a seeded `SegmentNode` tree. Nothing here builds or mutates
 * a tree — the trees are seeded (see lib/data/experiments.ts) and Pass 2 is a
 * rendering problem. These live outside the component so Pass 4, which adds
 * brand as one more split variable, gets the same vocabulary for free.
 */

/**
 * How to colour an effect. Neutral does not mean "small" — it means the
 * interval straddles zero, so the sign cannot honestly be called. Keeping that
 * distinct from a small-but-real effect is the whole point of showing intervals
 * on a segment read.
 */
export type EffectTone = "positive" | "negative" | "neutral";

export function effectTone(node: SegmentNode): EffectTone {
  const [lo, hi] = node.interval;
  if (lo > 0 && hi > 0) return "positive";
  if (lo < 0 && hi < 0) return "negative";
  return "neutral";
}

export interface WalkedNode {
  node: SegmentNode;
  depth: number;
  /** Position among siblings, used only to stagger the reveal. */
  index: number;
}

/** Pre-order, which is also the order the nodes appear in the DOM and therefore
 *  the order the Tab key moves through them. */
export function walk(root: SegmentNode, depth = 0, index = 0): WalkedNode[] {
  return [
    { node: root, depth, index },
    ...root.children.flatMap((child, i) => walk(child, depth + 1, i)),
  ];
}

export function leavesOf(root: SegmentNode): SegmentNode[] {
  return root.children.length === 0 ? [root] : root.children.flatMap(leavesOf);
}

/** Root → node, inclusive. Empty if the id is not in this tree. */
export function pathTo(root: SegmentNode, id: string): SegmentNode[] {
  if (root.id === id) return [root];
  for (const child of root.children) {
    const below = pathTo(child, id);
    if (below.length) return [root, ...below];
  }
  return [];
}

/**
 * One shared scale for every node in the tree, always including zero. Segments
 * drawn on their own scales would let a −1.9% and a +14.6% look the same size,
 * which is precisely the misreading this view exists to prevent.
 */
export function effectDomain(root: SegmentNode): [number, number] {
  const all = walk(root).map((w) => w.node);
  const lo = Math.min(0, ...all.map((n) => Math.min(n.effect, n.interval[0])));
  const hi = Math.max(0, ...all.map((n) => Math.max(n.effect, n.interval[1])));
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

const sign = (n: number) => (n < 0 ? -1 : 1);

/**
 * A leaf that moved significantly against the topline. This is the beat the
 * whole view is built around: a headline win that reversed inside one
 * sub-population. Largest such segment wins, because "how much of the
 * population went the other way" is the question a reader actually has.
 */
export function findReversal(root: SegmentNode): SegmentNode | null {
  const against = leavesOf(root).filter(
    (leaf) => effectTone(leaf) !== "neutral" && sign(leaf.effect) !== sign(root.effect),
  );
  if (!against.length) return null;
  return against.reduce((best, leaf) => (leaf.share > best.share ? leaf : best));
}

/** The leaf carrying the topline in its own direction — what actually drove it. */
export function findDriver(root: SegmentNode): SegmentNode | null {
  const withIt = leavesOf(root).filter(
    (leaf) => effectTone(leaf) !== "neutral" && sign(leaf.effect) === sign(root.effect),
  );
  if (!withIt.length) return null;
  return withIt.reduce((best, leaf) => (Math.abs(leaf.effect) > Math.abs(best.effect) ? leaf : best));
}
