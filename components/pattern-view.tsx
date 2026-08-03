import Link from "next/link";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { formatCount, formatDate, formatEffect, formatPercent } from "@/lib/format";
import { CONSISTENCY_COPY, type ExperimentFamily, type PatternStudy } from "@/lib/patterns";
import { effectTone } from "@/lib/segments";
import { TONE } from "./effect-tone";
import { BrandMark, StatusMark, TouchpointChip } from "./marks";
import { Forest, SegmentTree } from "./segment-tree";

/**
 * The cross-brand pattern view.
 *
 * Same test, several brands, three different answers — and the only question
 * that matters is whether those answers differ because the brands differ or
 * because the samples were finite. That is a heterogeneity question, so the
 * page leads with a heterogeneity statistic and then shows the tree that
 * explains it, with brand as the first split.
 *
 * Wider container than a record: the pooled tree is a level deeper than any
 * single record's, and that level is the entire point.
 */
export function PatternView({ family }: { family: ExperimentFamily }) {
  const anchor = family.members[0];
  const pooled = family.pooled;

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
      <nav className="pt-6 pb-8">
        <Link
          href={`/experiments/${anchor.id}`}
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> {anchor.id}
        </Link>
      </nav>

      <header className="max-w-[1000px]">
        <p className="field-label">Cross-brand pattern</p>
        <h1
          className="mt-3 max-w-[26ch] text-[30px] leading-[1.14] font-semibold tracking-[-0.012em] text-balance text-ink sm:text-[38px]"
          style={{ fontStretch: "110%" }}
        >
          {family.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <TouchpointChip value={anchor.touchpoint} />
          <span aria-hidden className="h-3 w-px bg-rule-2" />
          <span className="font-mono text-[11px] text-ink-2">
            {family.studies.length} brands · {formatCount(family.totalN)} households ·{" "}
            {rangeLabel(family)}
          </span>
        </div>
        <p className="mt-5 max-w-[62ch] text-[14.5px] leading-[1.62] text-pretty text-ink-2">
          The same experiment, the same design, run at every brand in the instance. Brand is not a
          tenant here — it is one more variable the tree can split on.
        </p>
      </header>

      {pooled && (
        <div className="deep-section mt-9 grid gap-px overflow-hidden rounded-[6px] border border-ink bg-rule md:grid-cols-2">
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
        <StudyPlot family={family} />
      </Section>

      {family.tree && (
        <Section eyebrow="02" title="Brand as a split variable" delay={160}>
          <SegmentTree
            tree={family.tree}
            metricLabel={anchor.headline?.label ?? anchor.design.primary_metric}
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
    <section className="deep-section mt-10" style={{ animationDelay: `${delay}ms` }}>
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
function StudyPlot({ family }: { family: ExperimentFamily }) {
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
          <StudyRow key={study.experiment.id} study={study} domain={domain} />
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

function StudyRow({ study, domain }: { study: PatternStudy; domain: [number, number] }) {
  const e = study.experiment;
  const brand = BRAND_BY_ID[e.brand_id];
  const tone = TONE[effectTone(study)];

  return (
    <li className="border-b border-rule px-4 py-3.5 last:border-b-0 sm:px-5">
      <div className={`${ROW} sm:items-center`}>
        <div className="min-w-0">
          <Link
            href={`/experiments/${e.id}`}
            className="group inline-flex items-center gap-2.5 text-[13.5px] leading-snug font-medium text-ink"
          >
            <BrandMark initials={brand.initials} />
            <span className="underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-ink-4">
              {brand.name}
            </span>
          </Link>
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
