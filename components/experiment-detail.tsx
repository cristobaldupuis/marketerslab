"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { daysBetween, formatCount, formatDate, formatPercent } from "@/lib/format";
import { RIGOR_BY, RISK_BY } from "@/lib/taxonomy";
import type { Experiment } from "@/lib/types";
import { BrandMark, LoopMeter, RiskChip, StatusMark, TouchpointChip, VerdictText } from "./marks";
import { RigorDial, type ReadDepth } from "./rigor-dial";
import { SegmentTree } from "./segment-tree";

export function ExperimentDetail({ experiment: e }: { experiment: Experiment }) {
  // Deep records open deep. The dial is still the reader's to move — this is
  // just a sensible starting position, not a lock.
  const [depth, setDepth] = useState<ReadDepth>(e.rigor_tier === "deep" ? "deep" : "simple");
  const brand = BRAND_BY_ID[e.brand_id];

  return (
    // Same outer shell as the register so the left edge lines up with the
    // masthead; the reading column is constrained inside it.
    <div className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
      <article className="max-w-[1000px]">
      <nav className="pt-6 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> Register
        </Link>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink-3">{e.id}</span>
          <span aria-hidden className="h-3 w-px bg-rule-2" />
          <BrandMark initials={brand.initials} />
          <span className="text-[13px] text-ink-2">{brand.name}</span>
          <span className="ml-auto">
            <StatusMark value={e.status} />
          </span>
        </div>

        <h1
          className="mt-4 max-w-[24ch] text-[30px] leading-[1.14] font-semibold tracking-[-0.012em] text-balance text-ink sm:text-[38px]"
          style={{ fontStretch: "110%" }}
        >
          {e.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <TouchpointChip value={e.touchpoint} />
          <RiskChip value={e.risk_category} size="md" />
          <span aria-hidden className="h-3 w-px bg-rule-2" />
          <LoopMeter value={e.loop_stage} />
          <span aria-hidden className="h-3 w-px bg-rule-2" />
          <span className="font-mono text-[10px] leading-none tracking-[0.1em] text-ink-3 uppercase">
            {RIGOR_BY[e.rigor_tier].label} tier
          </span>
        </div>
      </header>

      <div className="mt-8 border-y border-rule-2 bg-paper-deep/45 px-4 py-4 sm:px-5">
        <RigorDial value={depth} onChange={setDepth} risk={e.risk_category} tier={e.rigor_tier} />
      </div>

      {/* The simple read never moves. Deep is additive — flipping the dial
          unfolds evidence below what you were already reading, so nothing you
          had your eye on jumps. */}
      <SimpleRead experiment={e} />

      {depth === "deep" ? (
        <DeepRead key={e.id} experiment={e} />
      ) : (
        <DeepReadHint onOpen={() => setDepth("deep")} />
      )}
      </article>
    </div>
  );
}

/** Simple is the default read, so it has to say what it is leaving out —
 *  otherwise the rigor is invisible to anyone who never touches the dial. */
function DeepReadHint({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mt-12 flex flex-col gap-4 rounded-[6px] border border-dashed border-rule-2 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="field-label">Also on this record</p>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-2">
          Design of record · Segment analysis · Kill criteria as registered · Risk posture
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 self-start rounded-[4px] border border-ink px-3 py-2 font-mono text-[11px] leading-none tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper sm:self-auto"
      >
        Open deep read
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simple read                                                                 */
/* -------------------------------------------------------------------------- */

function SimpleRead({ experiment: e }: { experiment: Experiment }) {
  return (
    <section className="mt-9">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] md:gap-9">
        <div className="order-2 md:order-1">
          <h2 className="field-label">Hypothesis</h2>
          <p className="mt-2.5 max-w-[62ch] text-[15.5px] leading-[1.62] text-pretty text-ink">
            {e.hypothesis}
          </p>

          <h2 className="field-label mt-7">The read</h2>
          <p className="mt-2.5 max-w-[62ch] text-[14.5px] leading-[1.62] text-ink-2">{e.summary}</p>
        </div>

        <div className="order-1 md:order-2">
          <ResultPanel experiment={e} />
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ experiment: e }: { experiment: Experiment }) {
  if (!e.headline) {
    return (
      <div className="rounded-[6px] border border-dashed border-rule-2 bg-surface/60 p-4">
        <p className="field-label">Result</p>
        <p className="mt-3 text-[15px] leading-snug text-ink-2">Not launched yet.</p>
        <dl className="mt-4 space-y-2 border-t border-rule pt-3 font-mono text-[11px] text-ink-3">
          <div className="flex justify-between gap-3">
            <dt>Planned runtime</dt>
            <dd className="text-ink-2">{e.design.planned_runtime_days} days</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Sample target</dt>
            <dd className="text-ink-2">
              {e.design.sample_per_arm ? `${formatCount(e.design.sample_per_arm)} / arm` : "Set at brief"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  const isOpen = e.status === "running";

  return (
    <div className="rounded-[6px] border border-rule bg-surface p-4">
      <p className="field-label">{e.headline.label}</p>
      <p
        className="mt-2.5 text-[44px] leading-none font-semibold tracking-[-0.02em]"
        style={{ fontStretch: "106%" }}
      >
        <VerdictText outcome={isOpen ? null : e.outcome}>{e.headline.value}</VerdictText>
      </p>
      <p className="mt-2.5 font-mono text-[11px] leading-[1.5] text-ink-3">{e.headline.interval}</p>

      {e.verdict && (
        <p className="mt-4 border-t border-rule pt-3 text-[13.5px] leading-snug">
          <VerdictText outcome={e.outcome} className="font-medium">
            {e.verdict}
          </VerdictText>
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Deep read                                                                   */
/* -------------------------------------------------------------------------- */

function DeepRead({ experiment: e }: { experiment: Experiment }) {
  return (
    <div className="mt-12">
      <Section eyebrow="01" title="Design of record" delay={0}>
        <DesignBlock experiment={e} />
      </Section>

      <Section eyebrow="02" title="Segment analysis" delay={80}>
        <TreeSlot experiment={e} />
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

/** Numbered because the deep read genuinely is a sequence: what was planned,
 *  what the data said, what the rule was, and why the rule was set that way. */
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

/**
 * The one place violet appears in the whole system. It is a document stamp, and
 * it is the visual proof that the criteria predate the launch.
 */
function RegisteredStamp({ date }: { date: string }) {
  return (
    <div
      className="stamp-in inline-block rounded-[4px] border-2 border-stamp/70 px-3 py-2 text-center"
      style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-stamp) 25%, transparent)" }}
    >
      <p className="font-mono text-[9px] leading-none font-semibold tracking-[0.16em] text-stamp uppercase">
        Pre-registered
      </p>
      <p className="mt-1.5 font-mono text-[12px] leading-none font-semibold text-stamp">
        {formatDate(date)}
      </p>
      <p className="mt-1.5 font-mono text-[8px] leading-none tracking-[0.12em] text-stamp/70 uppercase">
        Before launch
      </p>
    </div>
  );
}

function UnregisteredStamp() {
  return (
    <div className="inline-block rounded-[4px] border-2 border-dashed border-rule-2 px-3 py-2 text-center">
      <p className="font-mono text-[9px] leading-none font-semibold tracking-[0.16em] text-ink-4 uppercase">
        Not registered
      </p>
      <p className="mt-1.5 font-mono text-[10px] leading-none text-ink-4">Locks at brief</p>
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

  return (
    <SegmentTree
      tree={e.segment_tree}
      metricLabel={e.headline?.label ?? e.design.primary_metric}
    />
  );
}

function NoTreeData() {
  return (
    <div className="relative overflow-hidden rounded-[6px] border border-dashed border-rule-2 bg-surface/50">
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <TreeSkeleton />
        <p className="mt-6 font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase">
          No tree data
        </p>
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
