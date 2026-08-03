import { formatCount, formatPercent } from "@/lib/format";
import type { GeneratedProposal } from "@/lib/generate/types";
import { RIGOR_BY } from "@/lib/taxonomy";
import { LoopMeter, RiskChip, TouchpointChip } from "./marks";

/**
 * A generated proposal, rendered in the register's own vocabulary — the rail,
 * chips and loop meter are the same components `ExperimentCard` uses. It is
 * deliberately not `ExperimentCard` itself: a proposal has no id, no brand,
 * and needs its power sketch and kill criteria on the card (which the compact
 * register card never shows), so the layout is its own while the taxonomy
 * chips and state marks are literally reused.
 */
export function ProposalCard({
  proposal: p,
  eyebrow,
  delay = 0,
}: {
  proposal: GeneratedProposal;
  eyebrow: string;
  delay?: number;
}) {
  return (
    <article
      className="deep-section relative overflow-hidden rounded-[6px] border border-rule bg-surface"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: railStyle(p) }} />

      <div className="flex flex-col gap-4 py-5 pr-5 pl-6 sm:pr-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-[10px] leading-none font-semibold tracking-[0.14em] text-ink-4 uppercase">
            {eyebrow}
          </span>
          <span aria-hidden className="h-3 w-px bg-rule-2" />
          <TouchpointChip value={p.touchpoint} />
          <RiskChip value={p.risk_category} />
          <span className="ml-auto flex items-center gap-2.5">
            <span className="font-mono text-[10px] leading-none tracking-[0.08em] text-ink-4 uppercase">
              {RIGOR_BY[p.rigor_tier].label} tier
            </span>
            <LoopMeter value={p.loop_stage} showLabel={false} />
          </span>
        </div>

        <div>
          <h3 className="text-[17px] leading-[1.3] font-semibold text-pretty text-ink" style={{ fontStretch: "104%" }}>
            {p.title}
          </h3>
          <p className="mt-2 max-w-[64ch] text-[14px] leading-[1.62] text-pretty text-ink-2">{p.hypothesis}</p>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[5px] border border-rule bg-rule sm:grid-cols-4">
          <Field label="Baseline" value={p.design.baseline} />
          <Field label="MDE" value={p.design.mde} />
          <Field label="Sample / arm" value={formatCount(p.design.sample_per_arm)} />
          <Field label="Runtime" value={`${p.design.planned_runtime_days} days`} />
          <Field label="Power" value={formatPercent(p.design.power)} />
          <Field label="Significance" value={`α = ${p.design.alpha}`} />
          <Field label="Allocation" value={p.design.allocation} className="col-span-2" />
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <ListPanel label="Arms" items={p.design.arms} />
          <ListPanel label="Guardrails" items={p.design.guardrails} />
        </div>

        <div className="rounded-[5px] border border-rule-2 bg-paper-deep/40 px-4 py-3.5">
          <p className="field-label">Kill criteria — proposed pre-registration</p>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-pretty text-ink">{p.kill_criteria.rule}</p>
          <p className="mt-2 font-mono text-[11px] text-ink-3">{p.kill_criteria.checkpoint}</p>
        </div>

        <p className="border-l-2 border-ink-4 py-1 pl-4 text-[13.5px] leading-[1.6] text-ink-2">
          <span className="field-label mr-2 align-middle">Why this test</span>
          {p.rationale}
        </p>
      </div>
    </article>
  );
}

/** Loonshot rails are drawn as a dashed stripe, matching `ExperimentCard`. */
function railStyle(p: GeneratedProposal): string {
  if (p.risk_category === "franchise") return "var(--color-franchise)";
  return "repeating-linear-gradient(to bottom, var(--color-loonshot) 0 7px, transparent 7px 12px)";
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`bg-surface px-3.5 py-3 ${className}`}>
      <dt className="field-label">{label}</dt>
      <dd className="mt-1.5 font-mono text-[13px] leading-snug font-medium text-ink">{value}</dd>
    </div>
  );
}

function ListPanel({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-[5px] border border-rule bg-surface px-3.5 py-3">
      <p className="field-label">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-ink">
            <span aria-hidden className="mt-[7px] size-[3px] shrink-0 rounded-full bg-ink-4" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact skeleton shown while a request is in flight — reuses the same
 *  card frame so the pending state doesn't jump when the real card lands. */
export function ProposalCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="deep-section overflow-hidden rounded-[6px] border border-dashed border-rule-2 bg-surface/50 px-6 py-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="h-[10px] w-16 animate-pulse rounded-[2px] bg-rule" />
        <span className="h-[10px] w-20 animate-pulse rounded-[2px] bg-rule" />
      </div>
      <span className="mt-4 block h-[18px] w-2/3 animate-pulse rounded-[2px] bg-rule" />
      <span className="mt-3 block h-[13px] w-full animate-pulse rounded-[2px] bg-rule" />
      <span className="mt-2 block h-[13px] w-5/6 animate-pulse rounded-[2px] bg-rule" />
      <div className="mt-5 grid grid-cols-4 gap-px overflow-hidden rounded-[5px] border border-rule bg-rule">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="h-[46px] animate-pulse bg-surface" />
        ))}
      </div>
    </div>
  );
}
