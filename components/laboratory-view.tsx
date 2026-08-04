"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { daysBetween, formatCount, formatDate, formatEffect, formatPercent } from "@/lib/format";
import { eligibleForRoadmap } from "@/lib/generate/facts";
import { CONSISTENCY_COPY, type ExperimentFamily, type PatternStudy } from "@/lib/patterns";
import { effectTone } from "@/lib/segments";
import { RIGOR_BY, RISK_BY } from "@/lib/taxonomy";
import type { Experiment } from "@/lib/types";
import { TONE } from "./effect-tone";
import { BrandMark, RegisteredStamp, RiskChip, StatusMark, UnregisteredStamp } from "./marks";
import { RecordHeader } from "./record-header";
import { SegmentedControl } from "./segmented-control";
import { Forest, SegmentTree } from "./segment-tree";

type Tab = "experiment" | "patterns";

/**
 * Laboratory — the analysis workspace. Merges what used to be the "deep"
 * position of the rigor dial (design of record, kill criteria, segment tree)
 * with the former standalone cross-brand pattern view, as two tabs on one
 * record rather than two disconnected pages. See DEFINITIONS.md.
 */
export function LaboratoryView({
  experiment: e,
  family,
  initialTab,
}: {
  experiment: Experiment;
  family: ExperimentFamily | null;
  initialTab: Tab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasPatterns = Boolean(family?.pooled && family.studies.length >= 2);
  const [tab, setTab] = useState<Tab>(initialTab === "patterns" && !hasPatterns ? "experiment" : initialTab);

  function changeTab(next: Tab) {
    setTab(next);
    router.replace(next === "patterns" ? `${pathname}?tab=patterns` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
      <div className="max-w-[1000px]">
        <RecordHeader
          experiment={e}
          backHref={`/microscope/${e.id}`}
          backLabel="Microscope"
          eyebrow="Laboratory"
        >
          <div className="mt-8 border-y border-rule-2 bg-paper-deep/45 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <span className="field-label">View</span>
                <SegmentedControl
                  value={tab}
                  onChange={changeTab}
                  label="Laboratory view"
                  options={[
                    { value: "experiment", label: "Experiment" },
                    {
                      value: "patterns",
                      label: "Patterns",
                      disabled: !hasPatterns,
                      hint: hasPatterns ? undefined : "No cross-brand replication for this record",
                    },
                  ]}
                />
              </div>
              {tab === "patterns" && family?.pooled && (
                <p className="font-mono text-[11px] leading-[1.5] text-ink-3">
                  {family.studies.length} brands ·{" "}
                  <span className="text-ink-2">{formatPercent(family.pooled.i2)} I²</span>
                </p>
              )}
            </div>
          </div>
        </RecordHeader>
      </div>

      {tab === "experiment" ? (
        <div className="max-w-[1000px]">
          <ExperimentTab experiment={e} family={family} onOpenPatterns={() => changeTab("patterns")} />
        </div>
      ) : family ? (
        <PatternsTab experiment={e} family={family} />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Experiment tab (formerly "deep read")                                      */
/* -------------------------------------------------------------------------- */

function ExperimentTab({
  experiment: e,
  family,
  onOpenPatterns,
}: {
  experiment: Experiment;
  family: ExperimentFamily | null;
  onOpenPatterns: () => void;
}) {
  return (
    <div className="mt-10">
      <Section eyebrow="01" title="Design of record" delay={0}>
        <DesignBlock experiment={e} />
      </Section>

      <Section eyebrow="02" title="Segment analysis" delay={80}>
        <TreeSlot experiment={e} />
        <FamilyPrompt experiment={e} family={family} onOpenPatterns={onOpenPatterns} />
        <RoadmapPrompt experiment={e} />
      </Section>

      <Section eyebrow="03" title="Kill criteria" delay={160}>
        <KillCriteriaBlock experiment={e} />
      </Section>

      <Section eyebrow="04" title="Risk posture" delay={240}>
        <RiskPostureBlock experiment={e} />
      </Section>
    </div>
  );
}

/** Numbered because the read genuinely is a sequence: what was planned, what
 *  the data said, what the rule was, and why the rule was set that way. */
function Section({
  eyebrow,
  title,
  children,
  delay,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <section className="deep-section mt-10 first:mt-0" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-baseline gap-3 border-b border-ink pb-2">
        <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ink-4">{eyebrow}</span>
        <h2 className="text-[15px] font-semibold tracking-[0.005em] text-ink" style={{ fontStretch: "106%" }}>
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DesignBlock({ experiment: e }: { experiment: Experiment }) {
  const d = e.design;
  const collected =
    d.collected_per_arm === null
      ? "Not collected yet"
      : `${formatCount(d.collected_per_arm)} / arm${
          d.collected_per_arm >= d.sample_per_arm && d.sample_per_arm > 0 ? " — target met" : ""
        }`;

  return (
    <>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-rule bg-rule sm:grid-cols-3">
        <Field label="Primary metric" value={d.primary_metric} span />
        <Field label="Baseline" value={d.baseline} />
        <Field label="Minimum detectable effect" value={d.mde} emphasis />
        <Field label="Power" value={formatPercent(d.power)} emphasis />
        <Field label="Significance level" value={`α = ${d.alpha}`} emphasis />
        <Field
          label="Sample required"
          value={d.sample_per_arm ? `${formatCount(d.sample_per_arm)} / arm` : "Set at brief"}
        />
        <Field label="Sample collected" value={collected} />
        <Field
          label="Runtime"
          value={
            d.actual_runtime_days === null
              ? `${d.planned_runtime_days} days planned`
              : `${d.actual_runtime_days} of ${d.planned_runtime_days} days`
          }
        />
        {/* Spans the remainder of its row so the grid never leaves a bare cell. */}
        <Field label="Allocation" value={d.allocation} className="col-span-1 sm:col-span-2" />
      </dl>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ListPanel label="Arms" items={d.arms} />
        <ListPanel label="Guardrails" items={d.guardrails} />
      </div>

      <p className="mt-4 border-l-2 border-ink-4 py-1 pl-4 text-[14px] leading-[1.6] text-ink-2">
        <span className="field-label mr-2 align-middle">Why sized this way</span>
        {d.design_note}
      </p>
    </>
  );
}

function Field({
  label,
  value,
  span = false,
  emphasis = false,
  className = "",
}: {
  label: string;
  value: string;
  span?: boolean;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-surface px-3.5 py-3 ${span ? "col-span-2 sm:col-span-3" : ""} ${className}`}>
      <dt className="field-label">{label}</dt>
      <dd
        className={`mt-1.5 leading-snug ${
          emphasis ? "font-mono text-[15px] font-medium text-ink" : "text-[13.5px] text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ListPanel({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-[6px] border border-rule bg-surface px-3.5 py-3">
      <p className="field-label">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
            <span aria-hidden className="mt-[7px] size-[3px] shrink-0 rounded-full bg-ink-4" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Kill criteria — the pre-registration proof                                  */
/* -------------------------------------------------------------------------- */

const DISPOSITION_COPY = {
  passed: { label: "Rule cleared", tone: "text-won", tint: "bg-won-tint" },
  triggered: { label: "Rule triggered", tone: "text-stopped", tint: "bg-stopped-tint" },
  not_yet_evaluated: { label: "Not yet evaluated", tone: "text-ink-3", tint: "bg-sunk" },
} as const;

function KillCriteriaBlock({ experiment: e }: { experiment: Experiment }) {
  const k = e.kill_criteria;
  const registered = Boolean(k.registered_at);
  const lead = registered && e.launched_at ? daysBetween(k.registered_at, e.launched_at) : null;
  const disposition = DISPOSITION_COPY[k.disposition];

  return (
    <div className="rounded-[6px] border border-rule bg-surface">
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="field-label">The rule</p>
          <p className="mt-2.5 max-w-[62ch] text-[15.5px] leading-[1.6] text-pretty text-ink">{k.rule}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={`inline-flex items-center rounded-[3px] px-2 py-1 font-mono text-[10px] leading-none font-semibold tracking-[0.08em] uppercase ${disposition.tint} ${disposition.tone}`}
            >
              {disposition.label}
            </span>
            <span className="font-mono text-[11px] text-ink-3">{k.checkpoint}</span>
          </div>

          {k.disposition_note && (
            <p className="mt-3.5 max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">{k.disposition_note}</p>
          )}
        </div>

        <div className="shrink-0 sm:pt-5">
          {registered ? <RegisteredStamp date={k.registered_at} /> : <UnregisteredStamp />}
        </div>
      </div>

      {registered && (
        <>
          <ol className="grid gap-px border-t border-rule bg-rule sm:grid-cols-4">
            <TimelineStep label="Criteria registered" date={k.registered_at} accent />
            <TimelineStep label="Launched" date={e.launched_at ?? ""} pending={!e.launched_at} />
            <TimelineStep label="Checkpoint" date={k.checkpoint} raw />
            <TimelineStep
              label="Concluded"
              date={e.concluded_at ?? ""}
              pending={!e.concluded_at}
              pendingLabel="Still running"
            />
          </ol>
          {lead !== null && (
            <p className="border-t border-rule px-4 py-2.5 text-[13px] text-ink-2 sm:px-5">
              The rule was locked{" "}
              <span className="font-mono font-medium text-ink">
                {lead} {lead === 1 ? "day" : "days"}
              </span>{" "}
              before a single household saw the treatment. Nothing here was written after the result was
              known.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TimelineStep({
  label,
  date,
  accent = false,
  raw = false,
  pending = false,
  pendingLabel = "Not yet",
}: {
  label: string;
  date: string;
  accent?: boolean;
  raw?: boolean;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <li className="bg-surface px-4 py-3">
      <p className="field-label">{label}</p>
      <p
        className={`mt-1.5 font-mono text-[12px] leading-snug ${
          pending ? "text-ink-4" : accent ? "font-semibold text-stamp" : "text-ink"
        }`}
      >
        {pending ? pendingLabel : raw ? date : formatDate(date)}
      </p>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk posture                                                                */
/* -------------------------------------------------------------------------- */

function RiskPostureBlock({ experiment: e }: { experiment: Experiment }) {
  const r = RISK_BY[e.risk_category];
  const diverges = r.rigor_default !== e.rigor_tier;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[6px] border border-rule bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <RiskChip value={e.risk_category} size="md" />
          <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
            defaults to {r.rigor_default}
          </span>
        </div>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink">{r.blurb}</p>
        <dl className="mt-4 space-y-3 border-t border-rule pt-3.5">
          <div>
            <dt className="field-label">Kill posture</dt>
            <dd className="mt-1 text-[13.5px] leading-snug text-ink-2">{r.kill_posture}</dd>
          </div>
          <div>
            <dt className="field-label">Judged on</dt>
            <dd className="mt-1 text-[13.5px] leading-snug text-ink-2">{r.judged_on}</dd>
          </div>
        </dl>
      </div>

      <div
        className={`rounded-[6px] border p-4 ${
          diverges ? "border-ink bg-surface" : "border-rule bg-surface/60"
        }`}
      >
        <p className="field-label">Tier set on this record</p>
        <p className="mt-2 text-[22px] leading-none font-semibold text-ink" style={{ fontStretch: "106%" }}>
          {RIGOR_BY[e.rigor_tier].label}
        </p>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">
          {diverges ? (
            <>
              This is a deliberate override. A {r.label.toLowerCase()} experiment would normally run at{" "}
              <span className="text-ink">{r.rigor_default}</span> tier — someone decided this one was worth
              more (or less) scrutiny than its category implies, and the design note above says why.
            </>
          ) : (
            <>
              Matches the {r.label.toLowerCase()} default. The tag set the tier and nobody had reason to move
              it.
            </>
          )}
        </p>
        <p className="mt-3.5 border-t border-rule pt-3 text-[13px] leading-[1.55] text-ink-3">
          {RIGOR_BY[e.rigor_tier].blurb}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Segment tree                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The tree is the primary way a result is understood on this record, so the
 * slot is either the tree itself or an honest statement that this experiment
 * was never read at segment level. It is deliberately never a placeholder for
 * an analysis that does not exist.
 */
function TreeSlot({ experiment: e }: { experiment: Experiment }) {
  if (!e.segment_tree) return <NoTreeData />;

  return <SegmentTree tree={e.segment_tree} metricLabel={e.headline?.label ?? e.design.primary_metric} />;
}

/** Sits under the tree because it is the question a reader has the moment they
 *  have finished reading one: does this hold anywhere else? Switches the
 *  Laboratory's own tab rather than navigating away, since Patterns now lives
 *  on the same record rather than a separate page. Only appears when the same
 *  test genuinely ran at another brand. */
function FamilyPrompt({
  experiment: e,
  family,
  onOpenPatterns,
}: {
  experiment: Experiment;
  family: ExperimentFamily | null;
  onOpenPatterns: () => void;
}) {
  if (!family?.pooled || family.studies.length < 2) return null;

  const others = family.studies
    .filter((s) => s.experiment.id !== e.id)
    .map((s) => BRAND_BY_ID[s.experiment.brand_id].name);

  return (
    <button
      type="button"
      onClick={onOpenPatterns}
      className="group mt-4 flex w-full flex-col gap-3 rounded-[6px] border border-rule bg-surface px-4 py-3.5 text-left transition-colors hover:border-ink sm:flex-row sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="field-label">Also run at</p>
        <p className="mt-2 text-[14px] leading-snug text-ink">
          {others.join(" and ")} — same design, same root split.{" "}
          <span className="text-ink-2">
            {formatPercent(family.pooled.i2)} of the spread between the {family.studies.length}{" "}
            results is real difference between brands, not sampling noise.
          </span>
        </p>
      </div>
      <span className="shrink-0 self-start rounded-[4px] border border-ink px-3 py-2 font-mono text-[11px] leading-none tracking-[0.08em] text-ink uppercase transition-colors group-hover:bg-ink group-hover:text-paper sm:self-auto">
        View patterns →
      </span>
    </button>
  );
}

/** Sits under the tree, next to the pattern prompt — the same beat, aimed at
 *  the Supercomputer instead of the Patterns tab. Only appears where the
 *  roadmap generator actually has a lever to read: a completed record with a
 *  segment tree. See `lib/generate/facts.ts`. */
function RoadmapPrompt({ experiment: e }: { experiment: Experiment }) {
  if (!eligibleForRoadmap(e)) return null;

  return (
    <Link
      href={`/supercomputer?tab=roadmap&id=${e.id}`}
      className="group mt-4 flex w-full flex-col gap-3 rounded-[6px] border border-rule bg-surface px-4 py-3.5 text-left transition-colors hover:border-ink sm:flex-row sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="field-label">Next test</p>
        <p className="mt-2 text-[14px] leading-snug text-ink">
          Run the roadmap generator on this record — it reads the tree above and proposes what to test next,
          built on the segment that actually drove the result.
        </p>
      </div>
      <span className="shrink-0 self-start rounded-[4px] border border-ink px-3 py-2 font-mono text-[11px] leading-none tracking-[0.08em] text-ink uppercase transition-colors group-hover:bg-ink group-hover:text-paper sm:self-auto">
        Generate roadmap →
      </span>
    </Link>
  );
}

function NoTreeData() {
  return (
    <div className="relative overflow-hidden rounded-[6px] border border-dashed border-rule-2 bg-surface/50">
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <TreeSkeleton />
        <p className="mt-6 font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase">No tree data</p>
        <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.6] text-ink-2">
          This experiment was not read at segment level. A tree is only worth building where the
          sample supports it and the decision turns on who moved, not just whether anything did —
          this one reads on the topline.
        </p>
      </div>
    </div>
  );
}

/** Hairline skeleton of the tree shape, so the reserved space reads as a
 *  placeholder for something specific rather than a generic empty panel. */
function TreeSkeleton() {
  return (
    <svg
      viewBox="0 0 300 96"
      width="300"
      height="96"
      className="max-w-full text-rule-2"
      aria-hidden
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="1">
        <path d="M150 22v10M150 32H70v10M150 32h80v10" />
        <path d="M70 60v8M70 68H36v8M70 68h34v8" />
        <path d="M230 60v8M230 68h-34v8M230 68h34v8" />
      </g>
      <g fill="currentColor" opacity="0.55">
        <rect x="126" y="8" width="48" height="14" rx="2" />
        <rect x="48" y="42" width="44" height="14" rx="2" />
        <rect x="208" y="42" width="44" height="14" rx="2" />
      </g>
      <g fill="currentColor" opacity="0.3">
        <rect x="18" y="76" width="36" height="12" rx="2" />
        <rect x="86" y="76" width="36" height="12" rx="2" />
        <rect x="178" y="76" width="36" height="12" rx="2" />
        <rect x="246" y="76" width="36" height="12" rx="2" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Patterns tab (formerly the standalone /patterns/[id] view)                  */
/* -------------------------------------------------------------------------- */

function PatternsTab({ experiment: e, family }: { experiment: Experiment; family: ExperimentFamily }) {
  const pooled = family.pooled;

  return (
    <div className="mt-10">
      <p className="max-w-[62ch] text-[14.5px] leading-[1.62] text-pretty text-ink-2">
        The same experiment, the same design, run at every brand in the instance. Brand is not a
        tenant here — it is one more variable the tree can split on.{" "}
        <span className="font-mono text-[12.5px] text-ink-3">
          {family.studies.length} brands · {formatCount(family.totalN)} households · {rangeLabel(family)}
        </span>
      </p>

      {pooled && (
        <div className="deep-section mt-7 grid gap-px overflow-hidden rounded-[6px] border border-ink bg-rule md:grid-cols-2">
          <div className="bg-surface px-4 py-4 sm:px-5">
            <p className="field-label">Pooled effect</p>
            <p
              className={`mt-2.5 text-[40px] leading-none font-semibold tracking-[-0.02em] ${
                TONE[effectTone(pooled)].text
              }`}
              style={{ fontStretch: "106%" }}
            >
              {formatEffect(pooled.effect)}
            </p>
            <p className="mt-2.5 font-mono text-[11px] leading-[1.6] text-ink-3">
              95% CI {formatEffect(pooled.interval[0])} to {formatEffect(pooled.interval[1])}
            </p>
            <p className="mt-3.5 border-t border-rule pt-3 text-[13px] leading-[1.55] text-ink-2">
              Inverse-variance weighted across {family.studies.length} runs, so a brand with a wide
              interval cannot pull the estimate as hard as a brand with a tight one.
            </p>
          </div>

          <div className="bg-surface px-4 py-4 sm:px-5">
            <p className="field-label">Between-brand variation</p>
            <div className="mt-2.5 flex items-baseline gap-3">
              <span
                className="text-[40px] leading-none font-semibold tracking-[-0.02em] text-ink"
                style={{ fontStretch: "106%" }}
              >
                {formatPercent(pooled.i2)}
              </span>
              <span className="font-mono text-[11px] text-ink-3">
                I² · Q = {pooled.q.toFixed(1)} on {pooled.df} df
              </span>
            </div>
            <p className="mt-2.5 text-[15px] leading-snug font-medium text-ink">
              {CONSISTENCY_COPY[pooled.consistency].label}
            </p>
            <p className="mt-3.5 border-t border-rule pt-3 text-[13px] leading-[1.55] text-ink-2">
              {CONSISTENCY_COPY[pooled.consistency].blurb}
            </p>
          </div>
        </div>
      )}

      <Section eyebrow="01" title="The same test, every brand" delay={80}>
        <StudyPlot family={family} currentId={e.id} />
      </Section>

      {family.tree && (
        <Section eyebrow="02" title="Brand as a split variable" delay={160}>
          <SegmentTree
            tree={family.tree}
            metricLabel={e.headline?.label ?? e.design.primary_metric}
            toplineFraming="is pooled across the brands below, each weighted by how precisely it was measured"
          />
        </Section>
      )}
    </div>
  );
}

function rangeLabel(family: ExperimentFamily): string {
  const starts = family.members.map((m) => m.launched_at).filter(Boolean) as string[];
  const ends = family.members.map((m) => m.concluded_at).filter(Boolean) as string[];
  if (!starts.length) return "not yet launched";
  const from = starts.reduce((a, b) => (a < b ? a : b));
  if (!ends.length) return `from ${formatDate(from)}`;
  const to = ends.reduce((a, b) => (a > b ? a : b));
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/* -------------------------------------------------------------------------- */
/* Forest plot                                                                 */
/* -------------------------------------------------------------------------- */

const VERDICT_WORD: Record<PatternStudy["verdict"], string> = {
  holds: "Holds",
  reverses: "Reverses",
  unresolved: "Unresolved",
};

/**
 * A literal forest plot: one row per brand on a shared axis, pooled estimate on
 * the bottom rule. This is the conventional way to show a set of studies that
 * are supposed to be measuring the same thing, and it makes disagreement a
 * shape rather than a paragraph.
 */
function StudyPlot({ family, currentId }: { family: ExperimentFamily; currentId: string }) {
  const { studies, pooled } = family;

  // Scale spans the brand toplines and the pooled estimate only — not the leaf
  // extremes inside each tree, which live on the tree's own scale below. The
  // axis is drawn so the two are never mistaken for one another.
  const values = [
    ...studies.flatMap((s) => [s.interval[0], s.interval[1], s.effect]),
    ...(pooled ? [pooled.interval[0], pooled.interval[1]] : []),
    0,
  ];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.1;
  const domain: [number, number] = [lo - pad, hi + pad];
  const at = (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * 100;
  const ticks = [Math.ceil(domain[0]), 0, Math.floor(domain[1])];

  return (
    <div className="overflow-hidden rounded-[6px] border border-rule bg-surface">
      {/* Axis sits above the bar column at the width the rows use. */}
      <div className="hidden border-b border-rule px-4 pt-3 pb-2 sm:block sm:px-5">
        <div className={`${ROW} items-end`}>
          <span className="field-label">Brand</span>
          <span className="field-label text-right">Effect</span>
          <div className="relative h-[13px]">
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
          <span className="field-label">Against pooled</span>
        </div>
      </div>

      <ul>
        {studies.map((study) => (
          <StudyRow key={study.experiment.id} study={study} domain={domain} isCurrent={study.experiment.id === currentId} />
        ))}
      </ul>

      {/* Surface, not a tint: the pooled interval is the narrowest bar on the
          plot and a tinted row behind it kills what little contrast it has.
          The heavy top rule is enough to mark it as the summary. */}
      {pooled && (
        <div className="border-t border-ink bg-surface px-4 py-3.5 sm:px-5">
          <div className={`${ROW} sm:items-center`}>
            <div className="min-w-0">
              <p className="text-[13.5px] leading-snug font-medium text-ink">Pooled, fixed effect</p>
              <p className="mt-1 font-mono text-[10.5px] leading-snug text-ink-3">
                95% CI {formatEffect(pooled.interval[0])} to {formatEffect(pooled.interval[1])} · n{" "}
                {formatCount(family.totalN)}
              </p>
            </div>
            <p
              className={`font-mono text-[17px] leading-none font-semibold sm:text-right ${
                TONE[effectTone(pooled)].text
              }`}
            >
              {formatEffect(pooled.effect)}
            </p>
            <Forest effect={pooled.effect} interval={pooled.interval} domain={domain} height={20} />
            <p className="font-mono text-[10px] leading-none tracking-[0.08em] text-ink-3 uppercase">
              I² {formatPercent(pooled.i2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Shared column template so the axis header and every row stay in register. */
const ROW =
  "grid gap-x-4 gap-y-2.5 sm:grid-cols-[minmax(0,320px)_72px_minmax(0,1fr)_104px] sm:gap-x-5";

function StudyRow({
  study,
  domain,
  isCurrent,
}: {
  study: PatternStudy;
  domain: [number, number];
  isCurrent: boolean;
}) {
  const e = study.experiment;
  const brand = BRAND_BY_ID[e.brand_id];
  const tone = TONE[effectTone(study)];

  return (
    <li className={`border-b border-rule px-4 py-3.5 last:border-b-0 sm:px-5 ${isCurrent ? "bg-sunk/50" : ""}`}>
      <div className={`${ROW} sm:items-center`}>
        <div className="min-w-0">
          <a
            href={isCurrent ? undefined : `/laboratory/${e.id}`}
            className={`group inline-flex items-center gap-2.5 text-[13.5px] leading-snug font-medium text-ink ${
              isCurrent ? "cursor-default" : ""
            }`}
          >
            <BrandMark initials={brand.initials} />
            <span
              className={`underline decoration-transparent underline-offset-[3px] transition-colors ${
                isCurrent ? "" : "group-hover:decoration-ink-4"
              }`}
            >
              {brand.name}
              {isCurrent && <span className="ml-1.5 text-ink-4">(this record)</span>}
            </span>
          </a>
          <p className="mt-1.5 font-mono text-[10.5px] leading-snug text-ink-3">
            {e.id} · 95% CI {formatEffect(study.interval[0])} to {formatEffect(study.interval[1])} · n{" "}
            {formatCount(study.n)}
          </p>
        </div>

        <p className={`font-mono text-[17px] leading-none font-semibold sm:text-right ${tone.text}`}>
          {formatEffect(study.effect)}
        </p>

        <Forest effect={study.effect} interval={study.interval} domain={domain} height={20} />

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-[3px] px-1.5 py-1 font-mono text-[9.5px] leading-none font-semibold tracking-[0.08em] uppercase ${tone.tint} ${tone.text}`}
          >
            {VERDICT_WORD[study.verdict]}
          </span>
          <span className="sm:hidden">
            <StatusMark value={e.status} />
          </span>
        </div>
      </div>
    </li>
  );
}
