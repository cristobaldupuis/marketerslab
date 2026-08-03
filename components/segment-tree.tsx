"use client";

import { useMemo, useRef, useState } from "react";
import { formatCount, formatEffect, formatShare } from "@/lib/format";
import {
  effectDomain,
  effectTone,
  findDriver,
  findReversal,
  findReversals,
  leavesOf,
  pathTo,
  walk,
} from "@/lib/segments";
import type { SegmentNode } from "@/lib/types";
import { TONE } from "./effect-tone";

/**
 * The segment decision tree.
 *
 * A topline number is an average over sub-populations that frequently disagree
 * with each other. This view exists to make that disagreement visible: every
 * node carries its own effect and interval on one shared scale, the path from
 * the root to any node is traceable, and a branch that moved against the
 * headline is marked as such rather than left for the reader to find.
 *
 * Effect direction is the only thing carrying colour here — green up, rust
 * down, neutral wherever the interval straddles zero and the sign genuinely
 * cannot be called. Node chrome stays neutral so nothing competes with it.
 */

export function SegmentTree({
  tree,
  metricLabel,
  // How the root relates to its branches. Defaults to the single-experiment
  // case; the cross-brand view pools rather than averages, and saying "average"
  // there would be wrong in a way this product cannot afford to be.
  toplineFraming = "is an average over the branches below",
}: {
  tree: SegmentNode;
  metricLabel: string;
  toplineFraming?: string;
}) {
  const [selectedId, setSelectedId] = useState(tree.id);

  const model = useMemo(() => {
    const nodes = walk(tree);
    const order = nodes.map((w) => w.node.id);
    const parentOf: Record<string, string | undefined> = {};
    const firstChildOf: Record<string, string | undefined> = {};
    for (const { node } of nodes) {
      firstChildOf[node.id] = node.children[0]?.id;
      for (const child of node.children) parentOf[child.id] = node.id;
    }
    return {
      order,
      parentOf,
      firstChildOf,
      domain: effectDomain(tree),
      leaves: leavesOf(tree),
      reversal: findReversal(tree),
      reversalIds: new Set(findReversals(tree).map((n) => n.id)),
      driver: findDriver(tree),
    };
  }, [tree]);

  const path = useMemo(() => pathTo(tree, selectedId), [tree, selectedId]);
  const onPath = useMemo(() => new Set(path.map((n) => n.id)), [path]);
  const selected = path[path.length - 1] ?? tree;

  return (
    <div>
      <Preamble
        root={tree}
        reversal={model.reversal}
        onJump={setSelectedId}
        metricLabel={metricLabel}
        toplineFraming={toplineFraming}
      />

      {/* Wide enough for the dendrogram at lg; the scroller is a seatbelt for
          the narrow end of that range, not the expected reading mode. */}
      <div className="mt-6 lg:overflow-x-auto lg:pb-1">
        <TreeCanvas
          root={tree}
          domain={model.domain}
          selectedId={selectedId}
          onPath={onPath}
          reversalIds={model.reversalIds}
          order={model.order}
          parentOf={model.parentOf}
          firstChildOf={model.firstChildOf}
          onSelect={setSelectedId}
        />
      </div>

      {model.leaves.length > 1 && (
        <PopulationBand
          leaves={model.leaves}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* Stable live region: the panel below re-mounts on every selection, and a
          live region that re-mounts with its content never announces. */}
      <p aria-live="polite" className="sr-only">
        {selected.label}: {formatEffect(selected.effect)}, 95% interval {formatEffect(selected.interval[0])}{" "}
        to {formatEffect(selected.interval[1])}, {formatShare(selected.share)} of the population.
      </p>

      <NodeDetail
        key={selected.id}
        node={selected}
        root={tree}
        path={path}
        domain={model.domain}
        reversal={model.reversal}
        driver={model.driver}
        metricLabel={metricLabel}
        onSelect={setSelectedId}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Framing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sets up the read without giving away the answer. The jump button exists
 * because a reader who has never seen this product should not have to guess
 * which of seven nodes is the interesting one — but the finding itself is still
 * delivered by clicking, not by a summary line.
 */
function Preamble({
  root,
  reversal,
  onJump,
  metricLabel,
  toplineFraming,
}: {
  root: SegmentNode;
  reversal: SegmentNode | null;
  onJump: (id: string) => void;
  metricLabel: string;
  toplineFraming: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-rule pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">
          <span className="text-ink">{metricLabel}</span> topline of{" "}
          <span className={`font-mono font-medium ${TONE[effectTone(root)].text}`}>
            {formatEffect(root.effect)}
          </span>{" "}
          {toplineFraming}. Click any node to read its sub-population, split variable, sample and
          interval.
        </p>
        <Legend />
      </div>

      {reversal ? (
        <button
          type="button"
          onClick={() => onJump(reversal.id)}
          className="shrink-0 self-start rounded-[4px] border border-ink px-3 py-2 font-mono text-[11px] leading-none tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper sm:self-auto"
        >
          Where it reverses ↘
        </button>
      ) : (
        <p className="shrink-0 self-start rounded-[4px] border border-dashed border-rule-2 px-3 py-2 font-mono text-[10px] leading-none tracking-[0.08em] text-ink-3 uppercase sm:self-auto">
          Direction holds in every branch
        </p>
      )}
    </div>
  );
}

function Legend() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {(["positive", "negative", "neutral"] as const).map((tone) => (
        <li key={tone} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={`relative inline-block h-[11px] w-[18px] rounded-[1px] border border-rule ${TONE[tone].tint}`}
          >
            <span className={`absolute inset-y-0 left-1/2 w-[2px] ${TONE[tone].tick}`} />
          </span>
          <span className="font-mono text-[10px] tracking-[0.06em] text-ink-3 uppercase">
            {TONE[tone].word}
          </span>
        </li>
      ))}
      <li className="font-mono text-[10px] tracking-[0.06em] text-ink-4 uppercase">
        bars are 95% intervals on one shared scale
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* The tree itself                                                             */
/* -------------------------------------------------------------------------- */

interface CanvasProps {
  root: SegmentNode;
  domain: [number, number];
  selectedId: string;
  onPath: Set<string>;
  reversalIds: Set<string>;
  order: string[];
  parentOf: Record<string, string | undefined>;
  firstChildOf: Record<string, string | undefined>;
  onSelect: (id: string) => void;
}

function TreeCanvas(props: CanvasProps) {
  // One ref on the container, and nodes are found by data attribute. A ref per
  // node would have to be threaded down through the recursion as a prop, and
  // writing to a prop is exactly what the compiler rules forbid.
  const canvas = useRef<HTMLDivElement>(null);

  /**
   * Up/down walk the tree in reading order; left/right step out to the parent
   * and in to the first child. Deliberately layout-independent — the same keys
   * mean the same thing whether the tree is drawn across or down.
   */
  function onKeyDown(event: React.KeyboardEvent, id: string) {
    const { order, parentOf, firstChildOf } = props;
    const at = order.indexOf(id);
    let next: string | undefined;

    if (event.key === "ArrowDown") next = order[at + 1];
    else if (event.key === "ArrowUp") next = order[at - 1];
    else if (event.key === "ArrowLeft") next = parentOf[id];
    else if (event.key === "ArrowRight") next = firstChildOf[id];
    else if (event.key === "Home") next = order[0];
    else if (event.key === "End") next = order[order.length - 1];
    else return;

    if (!next) return;
    event.preventDefault();
    props.onSelect(next);
    canvas.current?.querySelector<HTMLButtonElement>(`[data-node-id="${next}"]`)?.focus();
  }

  return (
    <div ref={canvas} role="group" aria-label="Segment decision tree" className="lg:mx-auto lg:w-max">
      <Subtree {...props} node={props.root} depth={0} index={0} onKeyDown={onKeyDown} />
    </div>
  );
}

function Subtree({
  node,
  depth,
  index,
  onKeyDown,
  ...p
}: CanvasProps & {
  node: SegmentNode;
  depth: number;
  index: number;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
}) {
  const isParent = node.children.length > 0;
  const isOnPath = p.onPath.has(node.id);

  return (
    <div className="tree-sub">
      <div
        className="tree-cell"
        data-parent={isParent ? "true" : undefined}
        data-on-path={isOnPath && node.id !== p.selectedId ? "true" : undefined}
      >
        <NodeCard
          node={node}
          depth={depth}
          index={index}
          domain={p.domain}
          selected={node.id === p.selectedId}
          onPath={isOnPath}
          isReversal={p.reversalIds.has(node.id)}
          onSelect={p.onSelect}
          onKeyDown={onKeyDown}
        />
      </div>

      {isParent && (
        <div className="tree-kids">
          {node.children.map((child, i) => (
            <div
              key={child.id}
              className="tree-branch"
              data-first={i === 0 ? "true" : undefined}
              data-last={i === node.children.length - 1 ? "true" : undefined}
              data-on-path={p.onPath.has(child.id) ? "true" : undefined}
            >
              <Subtree {...p} node={child} depth={depth + 1} index={i} onKeyDown={onKeyDown} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({
  node,
  depth,
  index,
  domain,
  selected,
  onPath,
  isReversal,
  onSelect,
  onKeyDown,
}: {
  node: SegmentNode;
  depth: number;
  index: number;
  domain: [number, number];
  selected: boolean;
  onPath: boolean;
  isReversal: boolean;
  onSelect: (id: string) => void;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
}) {
  const tone = TONE[effectTone(node)];

  const edge = selected
    ? "border-ink shadow-[0_10px_28px_-18px_rgba(18,23,30,0.55)]"
    : onPath
      ? "border-ink-3"
      : "border-rule hover:border-rule-2";

  return (
    <button
      type="button"
      data-node-id={node.id}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => onKeyDown(event, node.id)}
      // Stagger by depth so the tree grows outward from the root rather than
      // appearing all at once. Reduced motion is handled globally.
      style={{ animationDelay: `${depth * 110 + index * 55}ms` }}
      className={`tree-rise block w-full rounded-[5px] border bg-surface px-3 py-2.5 text-left transition-[border-color,box-shadow] duration-200 ${edge}`}
    >
      <span className="sr-only">Level {depth + 1}. </span>
      <span className="flex items-start gap-2">
        <span className="min-w-0 flex-1 text-[12.5px] leading-[1.35] font-medium text-pretty text-ink">
          {node.label}
        </span>
        {isReversal && (
          <span
            className={`shrink-0 rounded-[2px] px-1.5 py-[3px] font-mono text-[8.5px] leading-none font-semibold tracking-[0.1em] uppercase ${tone.tint} ${tone.text}`}
          >
            Reverses
          </span>
        )}
      </span>

      <span className="mt-2 flex items-baseline justify-between gap-2">
        <span className={`font-mono text-[17px] leading-none font-semibold ${tone.text}`}>
          {formatEffect(node.effect)}
        </span>
        <span className="font-mono text-[10px] leading-none text-ink-3">
          {formatShare(node.share)} · n {formatCount(node.n)}
        </span>
      </span>

      <span className="mt-2 block">
        <Forest effect={node.effect} interval={node.interval} domain={domain} />
      </span>

      {/* Only parents carry this. Repeating "leaf" on every terminal node says
          nothing the absence of children does not already say, and four copies
          of it compete with the figures. */}
      {node.split && (
        // Wraps rather than truncates: the split variable is the reasoning, and
        // an ellipsis in the middle of it defeats the point of the view.
        <span className="mt-2 block font-mono text-[9.5px] leading-[1.45] tracking-[0.06em] text-ink-4 uppercase">
          splits on {node.split}
        </span>
      )}
    </button>
  );
}

/**
 * One interval on the shared scale: the 95% band, the point estimate, and zero.
 * A forest-plot row rather than a bar chart, because the question at a node is
 * "does this interval clear zero", not "how tall is this".
 */
export function Forest({
  effect,
  interval,
  domain,
  height = 13,
}: {
  effect: number;
  interval: [number, number];
  domain: [number, number];
  height?: number;
}) {
  const tone = TONE[effectTone({ interval })];
  const at = (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * 100;
  const [lo, hi] = interval;
  const inset = height > 16 ? 5 : 3;

  return (
    <span
      className="relative block w-full overflow-hidden rounded-[2px] bg-paper-deep/70"
      style={{ height }}
    >
      <span
        className={`absolute rounded-[1px] ${tone.band}`}
        style={{
          top: inset,
          bottom: inset,
          left: `${at(lo)}%`,
          width: `${Math.max(at(hi) - at(lo), 0.8)}%`,
        }}
      />
      <span className="absolute inset-y-0 w-px bg-rule-2" style={{ left: `${at(0)}%` }} />
      <span
        className={`absolute inset-y-[1px] w-[2px] ${tone.tick}`}
        style={{ left: `calc(${at(effect)}% - 1px)` }}
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Population band                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The leaves laid end to end at their true share. This is the fastest read in
 * the view: how much of the test actually sat in the segment that went the
 * other way, drawn to scale rather than asserted.
 */
function PopulationBand({
  leaves,
  selectedId,
  onSelect,
}: {
  leaves: SegmentNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-8">
      <p className="field-label">Where the population sits</p>
      <div className="mt-2.5 flex h-[54px] w-full gap-px overflow-hidden rounded-[4px] border border-rule bg-rule">
        {leaves.map((leaf) => {
          const tone = TONE[effectTone(leaf)];
          const selected = leaf.id === selectedId;
          return (
            <button
              key={leaf.id}
              type="button"
              onClick={() => onSelect(leaf.id)}
              title={`${leaf.label} — ${formatEffect(leaf.effect)}, ${formatShare(leaf.share)} of the population`}
              aria-pressed={selected}
              style={{ width: `${leaf.share * 100}%` }}
              className={`relative flex min-w-0 flex-col justify-center overflow-hidden px-2 text-left transition-colors duration-200 ${tone.tint} ${
                selected ? "outline-2 -outline-offset-2 outline-ink" : "hover:brightness-[0.97]"
              }`}
            >
              {/* A pooled tree can put a dozen leaves in this band, and a 2%
                  segment has no room for a figure. Below the threshold the
                  block still carries its colour, share and tooltip — it just
                  stops trying to print a number it cannot fit. */}
              {leaf.share >= 0.05 && (
                <span className={`truncate font-mono text-[12px] leading-none font-semibold ${tone.text}`}>
                  {formatEffect(leaf.effect)}
                </span>
              )}
              {leaf.share >= 0.08 && (
                <span className="mt-1 truncate font-mono text-[9.5px] leading-none text-ink-3">
                  {formatShare(leaf.share)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-ink-3">
        Every household in this analysis sits in exactly one of these. Width is share of the
        population, not share of the effect.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Selected node                                                               */
/* -------------------------------------------------------------------------- */

function NodeDetail({
  node,
  root,
  path,
  domain,
  reversal,
  driver,
  metricLabel,
  onSelect,
}: {
  node: SegmentNode;
  root: SegmentNode;
  path: SegmentNode[];
  domain: [number, number];
  reversal: SegmentNode | null;
  driver: SegmentNode | null;
  metricLabel: string;
  onSelect: (id: string) => void;
}) {
  const tone = TONE[effectTone(node)];
  const isReversal = reversal?.id === node.id;
  const isDriver = driver?.id === node.id;

  return (
    <div className="tree-rise mt-8 rounded-[6px] border border-ink bg-surface">
      <div className="border-b border-rule px-4 py-4 sm:px-5">
        <p className="field-label">Selected segment</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3
            className="text-[19px] leading-tight font-semibold text-pretty text-ink"
            style={{ fontStretch: "104%" }}
          >
            {node.label}
          </h3>
          <span className={`font-mono text-[26px] leading-none font-semibold ${tone.text}`}>
            {formatEffect(node.effect)}
          </span>
        </div>
        <p className="mt-2.5 font-mono text-[11px] leading-[1.6] text-ink-3">
          {metricLabel} · 95% CI {formatEffect(node.interval[0])} to {formatEffect(node.interval[1])} ·{" "}
          {formatShare(node.share)} of the population · n = {formatCount(node.n)} ·{" "}
          {node.split ? `splits on ${node.split}` : "leaf"}
        </p>
      </div>

      <div className="border-b border-rule px-4 py-4 sm:px-5">
        <AxisPlot node={node} root={root} domain={domain} />
      </div>

      <div className="grid gap-5 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-8">
        <PathLadder path={path} onSelect={onSelect} />

        <div>
          <p className="field-label">Read</p>
          <p className="mt-2.5 max-w-[58ch] text-[14px] leading-[1.62] text-pretty text-ink">{node.note}</p>

          {isReversal && (
            <p className={`mt-4 border-l-2 border-lost py-1 pl-4 text-[14px] leading-[1.6] text-ink-2`}>
              <span className="field-label mr-2 align-middle text-lost">Against the topline</span>
              The topline reads{" "}
              <span className="font-mono font-medium text-ink">{formatEffect(root.effect)}</span>. This
              segment is{" "}
              <span className="font-mono font-medium text-ink">{formatShare(node.share)}</span> of the test
              population and moved{" "}
              <span className="font-mono font-medium text-lost">{formatEffect(node.effect)}</span> — the
              other way. A topline summarising branches this far apart is not a number to roll out on.
            </p>
          )}

          {isDriver && (
            <p className="mt-4 border-l-2 border-won py-1 pl-4 text-[14px] leading-[1.6] text-ink-2">
              <span className="field-label mr-2 align-middle text-won">Where the topline came from</span>
              <span className="font-mono font-medium text-ink">{formatShare(node.share)}</span> of the
              population moving{" "}
              <span className="font-mono font-medium text-won">{formatEffect(node.effect)}</span> is what
              carries the {formatEffect(root.effect)} topline. Roll the treatment out beyond this segment
              and the topline will not follow.
            </p>
          )}

          {effectTone(node) === "neutral" && (
            <p className="mt-4 border-l-2 border-rule-2 py-1 pl-4 text-[14px] leading-[1.6] text-ink-2">
              <span className="field-label mr-2 align-middle">Interval straddles zero</span>
              Not a flat result — an unresolved one. On this sample the sign cannot be called either way.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The reasoning path, root downward, with the split variable named on each
 * step. Trees are the centrepiece precisely because this is legible: you can
 * say out loud how you arrived at the sub-population you are looking at.
 */
function PathLadder({ path, onSelect }: { path: SegmentNode[]; onSelect: (id: string) => void }) {
  return (
    <div>
      <p className="field-label">Reasoning path</p>
      <ol className="mt-2.5">
        {path.map((step, i) => {
          const last = i === path.length - 1;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={last ? "true" : undefined}
                className={`block w-full rounded-[3px] px-1.5 py-1 text-left text-[13px] leading-snug transition-colors ${
                  last ? "font-medium text-ink" : "text-ink-2 hover:bg-sunk hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className={`mr-2 inline-block size-[5px] rounded-full align-middle ${
                    last ? "bg-ink" : "bg-ink-4"
                  }`}
                />
                {step.label}
              </button>
              {!last && step.split && (
                <p className="ml-[9px] border-l border-rule-2 py-1 pl-3.5 font-mono text-[9.5px] leading-none tracking-[0.06em] text-ink-4 uppercase">
                  split on {step.split}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The selected interval at full width, with the topline marked so the two can
 *  be compared without holding a number in your head. */
function AxisPlot({
  node,
  root,
  domain,
}: {
  node: SegmentNode;
  root: SegmentNode;
  domain: [number, number];
}) {
  const tone = TONE[effectTone(node)];
  const at = (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * 100;
  const ticks = [Math.ceil(domain[0]), 0, Math.floor(domain[1])];
  const showTopline = node.id !== root.id;

  return (
    <div>
      <div className="relative h-[30px] w-full rounded-[3px] bg-paper-deep/70">
        <span className="absolute inset-y-0 w-px bg-rule-2" style={{ left: `${at(0)}%` }} />
        {showTopline && (
          <span
            aria-hidden
            className="absolute inset-y-0"
            style={{ left: `${at(root.effect)}%`, borderLeft: "1px dashed var(--color-ink-3)" }}
          />
        )}
        <span
          className={`absolute top-[7px] bottom-[7px] rounded-[2px] ${tone.band}`}
          style={{
            left: `${at(node.interval[0])}%`,
            width: `${Math.max(at(node.interval[1]) - at(node.interval[0]), 0.8)}%`,
          }}
        />
        <span
          className={`absolute inset-y-[3px] w-[2px] ${tone.tick}`}
          style={{ left: `calc(${at(node.effect)}% - 1px)` }}
        />
      </div>

      <div className="relative mt-1.5 h-[13px]">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2 font-mono text-[9.5px] leading-none text-ink-4"
            style={{ left: `${at(t)}%` }}
          >
            {t > 0 ? `+${t}%` : t < 0 ? `−${Math.abs(t)}%` : "0"}
          </span>
        ))}
      </div>

      {/* Own row rather than sharing the tick row: on a record whose topline is
          close to zero the two labels would sit on top of each other. */}
      {showTopline && (
        <div className="relative mt-1 h-[13px]">
          <span
            className="absolute -translate-x-1/2 font-mono text-[9.5px] leading-none tracking-[0.06em] text-ink-3 uppercase"
            style={{ left: `${at(root.effect)}%` }}
          >
            topline
          </span>
        </div>
      )}
    </div>
  );
}
