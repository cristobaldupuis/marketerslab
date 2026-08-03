import Link from "next/link";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { formatDate } from "@/lib/format";
import { RIGOR_BY } from "@/lib/taxonomy";
import type { Experiment } from "@/lib/types";
import { BrandMark, LoopMeter, OwnerMark, RiskChip, StatusMark, TouchpointChip, VerdictText } from "./marks";

/** Launched records report against launch; anything still short of that
 *  reports against when it was briefed — real fields either way, never a
 *  live clock (see AGENTS.md on date formatting and hydration). */
function timelineNote(e: Experiment): string {
  return e.launched_at ? `Launched ${formatDate(e.launched_at)}` : `Briefed ${formatDate(e.created_at)}`;
}

/** Loonshot rails are drawn as a dashed stripe, matching the chip treatment. */
function railStyle(risk: Experiment["risk_category"]): React.CSSProperties {
  if (risk === "franchise") return { background: "var(--color-franchise)" };
  return {
    backgroundImage:
      "repeating-linear-gradient(to bottom, var(--color-loonshot) 0 7px, transparent 7px 12px)",
  };
}

export function ExperimentCard({ experiment: e }: { experiment: Experiment }) {
  const brand = BRAND_BY_ID[e.brand_id];
  const isOpen = e.status === "planned" || e.status === "running";

  return (
    <Link
      href={`/microscope/${e.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[5px] border border-rule bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-rule-2 hover:shadow-[0_8px_24px_-14px_rgba(18,23,30,0.4)] focus-visible:-translate-y-px"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={railStyle(e.risk_category)} />

      <div className="flex flex-1 flex-col gap-3 py-4 pr-4 pl-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] leading-none font-medium tracking-[0.04em] text-ink-3">
            {e.id}
          </span>
          <BrandMark initials={brand.initials} />
          <span className="truncate text-[12px] leading-none text-ink-2">{brand.name}</span>
          <span className="ml-auto shrink-0">
            <StatusMark value={e.status} />
          </span>
        </div>

        <div>
          <h3
            className="text-[15px] leading-[1.3] font-semibold text-pretty text-ink"
            style={{ fontStretch: "104%" }}
          >
            {e.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-ink-2">{e.hypothesis}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1">
          <TouchpointChip value={e.touchpoint} />
          <RiskChip value={e.risk_category} />
          <span className="ml-auto flex items-center gap-2.5">
            <span className="font-mono text-[10px] leading-none tracking-[0.08em] text-ink-4 uppercase">
              {RIGOR_BY[e.rigor_tier].label}
            </span>
            <LoopMeter value={e.loop_stage} />
          </span>
        </div>
      </div>

      <div className="border-t border-rule bg-paper/60 py-2.5 pr-4 pl-5">
        {e.verdict ? (
          <VerdictText outcome={e.outcome} className="text-[13px] leading-snug font-medium">
            {e.verdict}
          </VerdictText>
        ) : (
          <span className="text-[12.5px] leading-snug text-ink-3">
            {isOpen && e.headline
              ? `${e.headline.label} ${e.headline.value} — ${e.headline.interval}`
              : e.summary}
          </span>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-rule/70 pt-2">
          <span className="font-mono text-[10.5px] leading-none text-ink-3">{timelineNote(e)}</span>
          <span className="flex items-center gap-1.5">
            <OwnerMark name={e.owner} />
            <span className="font-mono text-[10.5px] leading-none text-ink-3">{e.owner.split(" ")[0]}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
