"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BRAND_BY_ID } from "@/lib/data/brands";
import {
  activeExperiments,
  pipelineByStage,
  pipelinePrompts,
  totalsByRisk,
  type RiskBucket,
  type StageBucket,
} from "@/lib/priority";
import { LOOP_STAGE_BY, RISK_BY } from "@/lib/taxonomy";
import type { Experiment, LoopStage } from "@/lib/types";
import { BrandMark, StatusGlyph, StatusMark, TouchpointChip } from "./marks";

/**
 * Pipeline priority tree — the Observatory's second view of the register,
 * next to the card grid. Where the segment tree (Laboratory) explains why a
 * concluded experiment moved the way it did, this tree is about what to run
 * next: it groups every not-yet-concluded record by loop stage, then risk
 * category, so a thin patch of the pipeline or a franchise/loonshot skew is
 * something you see, not something you have to notice on your own.
 *
 * Reuses the segment tree's connector classes (tree-sub/tree-cell/tree-kids/
 * tree-branch, globals.css) so both trees read as the same visual family —
 * the shape is generic to "nodes with children," only the card content
 * differs at each level.
 *
 * Takes the register from the Observatory rather than reading the seed module,
 * so records held in Quarantine are absent here for the same reason they are
 * absent from the grid: nothing that has not been cleared to run is an answer
 * to "what should run next."
 */
export function PriorityTree({ register }: { register: Experiment[] }) {
  const pool = activeExperiments(register);
  const buckets = pipelineByStage(pool);
  const prompts = pipelinePrompts(buckets);
  const risk = totalsByRisk(pool);

  const [highlighted, setHighlighted] = useState<LoopStage | null>(null);
  const canvas = useRef<HTMLDivElement>(null);

  function jumpTo(stage: LoopStage) {
    setHighlighted(stage);
    canvas.current
      ?.querySelector(`[data-stage-id="${stage}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div>
      <Preamble pool={pool} risk={risk} prompts={prompts} onJump={jumpTo} />

      <div className="mt-6 lg:overflow-x-auto lg:pb-1">
        <div ref={canvas} role="group" aria-label="Pipeline priority tree" className="lg:mx-auto lg:w-max">
          <div className="tree-sub">
            <TreeCell parent>
              <RootCard pool={pool} risk={risk} />
            </TreeCell>

            <div className="tree-kids">
              {buckets.map((bucket, i) => (
                <TreeBranch key={bucket.stage} index={i} count={buckets.length}>
                  <StageColumn bucket={bucket} highlighted={highlighted === bucket.stage} />
                </TreeBranch>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Framing                                                                     */
/* -------------------------------------------------------------------------- */

function Preamble({
  pool,
  risk,
  prompts,
  onJump,
}: {
  pool: Experiment[];
  risk: Record<"franchise" | "loonshot", number>;
  prompts: ReturnType<typeof pipelinePrompts>;
  onJump: (stage: LoopStage) => void;
}) {
  return (
    <div className="border-b border-rule pb-4">
      <p className="max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">
        <span className="font-mono font-medium text-ink">{pool.length}</span> experiment
        {pool.length === 1 ? "" : "s"} active across the loop right now —{" "}
        <span className="font-mono text-ink-2">{risk.franchise} franchise</span> ·{" "}
        <span className="font-mono text-ink-2">{risk.loonshot} loonshot</span>. Sorted by loop stage, then risk
        category, so a thin patch of the pipeline reads as a gap rather than going unnoticed.
      </p>

      {prompts.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <li key={`${p.stage}-${p.kind}`}>
              <button
                type="button"
                onClick={() => onJump(p.stage)}
                className="rounded-full border border-dashed border-rule-2 px-2.5 py-[5px] text-[12px] leading-none text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
              >
                {p.note} ↓
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.06em] text-ink-4 uppercase">
          Every active stage carries both franchise and loonshot work.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tree plumbing — generic wrappers around the shared connector classes       */
/* -------------------------------------------------------------------------- */

function TreeCell({ parent, children }: { parent?: boolean; children: React.ReactNode }) {
  return (
    <div className="tree-cell" data-parent={parent ? "true" : undefined}>
      {children}
    </div>
  );
}

function TreeBranch({
  index,
  count,
  children,
}: {
  index: number;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="tree-branch"
      data-first={index === 0 ? "true" : undefined}
      data-last={index === count - 1 ? "true" : undefined}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 0 — root                                                             */
/* -------------------------------------------------------------------------- */

function RootCard({
  pool,
  risk,
}: {
  pool: Experiment[];
  risk: Record<"franchise" | "loonshot", number>;
}) {
  return (
    <div className="tree-rise block w-full rounded-[5px] border border-ink bg-surface px-3 py-2.5">
      <p className="text-[12.5px] leading-[1.35] font-medium text-ink">Active pipeline</p>
      <p className="mt-2 font-mono text-[17px] leading-none font-semibold text-ink">{pool.length}</p>
      <p className="mt-2 font-mono text-[9.5px] leading-[1.45] tracking-[0.06em] text-ink-4 uppercase">
        splits on loop stage
      </p>
      <p className="mt-2 border-t border-rule pt-2 font-mono text-[10px] leading-none text-ink-3">
        {risk.franchise} franchise · {risk.loonshot} loonshot
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 1 — loop stage                                                       */
/* -------------------------------------------------------------------------- */

function StageColumn({ bucket, highlighted }: { bucket: StageBucket; highlighted: boolean }) {
  const hasChildren = bucket.byRisk.length > 0;

  return (
    <div className="tree-sub">
      <TreeCell parent={hasChildren}>
        <StageCard bucket={bucket} highlighted={highlighted} />
      </TreeCell>

      {hasChildren && (
        <div className="tree-kids">
          {bucket.byRisk.map((riskBucket, i) => (
            <TreeBranch key={riskBucket.risk} index={i} count={bucket.byRisk.length}>
              <RiskColumn bucket={riskBucket} />
            </TreeBranch>
          ))}
        </div>
      )}
    </div>
  );
}

function StageCard({ bucket, highlighted }: { bucket: StageBucket; highlighted: boolean }) {
  const label = LOOP_STAGE_BY[bucket.stage].label;
  const empty = bucket.experiments.length === 0;

  if (empty) {
    return (
      <div
        data-stage-id={bucket.stage}
        className={`tree-rise block w-full rounded-[5px] border border-dashed px-3 py-2.5 transition-colors duration-300 ${
          highlighted ? "border-ink-3" : "border-rule-2"
        }`}
      >
        <p className="text-[12.5px] leading-[1.35] font-medium text-ink-3">{label}</p>
        <p className="mt-2 font-mono text-[9.5px] leading-[1.45] tracking-[0.06em] text-ink-4 uppercase">
          nothing active
        </p>
      </div>
    );
  }

  return (
    <div
      data-stage-id={bucket.stage}
      className={`tree-rise block w-full rounded-[5px] border bg-surface px-3 py-2.5 transition-[border-color,box-shadow] duration-300 ${
        highlighted ? "border-ink shadow-[0_10px_28px_-18px_rgba(18,23,30,0.55)]" : "border-rule"
      }`}
    >
      <p className="text-[12.5px] leading-[1.35] font-medium text-ink">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[17px] leading-none font-semibold text-ink">
          {bucket.experiments.length}
        </span>
        <span className="flex items-center gap-[4px]" aria-hidden>
          {bucket.experiments.map((e) => (
            <StatusGlyph key={e.id} value={e.status} animate={false} />
          ))}
        </span>
      </div>
      {bucket.byRisk.length > 0 && (
        <p className="mt-2 font-mono text-[9.5px] leading-[1.45] tracking-[0.06em] text-ink-4 uppercase">
          splits on risk category
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 2 — risk category                                                    */
/* -------------------------------------------------------------------------- */

function RiskColumn({ bucket }: { bucket: RiskBucket }) {
  return (
    <div className="tree-sub">
      <TreeCell parent>
        <RiskCard bucket={bucket} />
      </TreeCell>

      <div className="tree-kids">
        {bucket.experiments.map((e, i) => (
          <TreeBranch key={e.id} index={i} count={bucket.experiments.length}>
            <TreeCell>
              <LeafCard experiment={e} />
            </TreeCell>
          </TreeBranch>
        ))}
      </div>
    </div>
  );
}

function RiskCard({ bucket }: { bucket: RiskBucket }) {
  const risk = RISK_BY[bucket.risk];
  const isLoonshot = bucket.risk === "loonshot";

  return (
    <div
      className={`tree-rise block w-full rounded-[5px] border bg-surface px-3 py-2.5 ${
        isLoonshot ? "border-dashed border-loonshot/45" : "border-franchise/25"
      }`}
    >
      <p
        className={`font-mono text-[10px] leading-none font-semibold tracking-[0.06em] uppercase ${
          isLoonshot ? "text-loonshot" : "text-franchise"
        }`}
      >
        {risk.label}
      </p>
      <p className="mt-2 font-mono text-[15px] leading-none font-semibold text-ink">
        {bucket.experiments.length}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 3 — leaf: the experiment itself                                      */
/* -------------------------------------------------------------------------- */

function LeafCard({ experiment: e }: { experiment: Experiment }) {
  const brand = BRAND_BY_ID[e.brand_id];

  return (
    <Link
      href={`/microscope/${e.id}`}
      className="tree-rise group block w-full rounded-[5px] border border-rule bg-surface px-3 py-2.5 text-left transition-[border-color,box-shadow] duration-200 hover:border-rule-2 hover:shadow-[0_8px_24px_-14px_rgba(18,23,30,0.4)]"
    >
      <div className="flex items-center gap-2">
        <BrandMark initials={brand.initials} />
        <span className="min-w-0 flex-1 truncate text-[12px] leading-tight font-medium text-ink">{e.title}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <TouchpointChip value={e.touchpoint} />
        <StatusMark value={e.status} />
      </div>
    </Link>
  );
}
