import Link from "next/link";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { RIGOR_BY } from "@/lib/taxonomy";
import type { Experiment } from "@/lib/types";
import { BrandMark, LoopMeter, RiskChip, StatusMark, TouchpointChip } from "./marks";

/**
 * Shared header for the two single-record sections, Microscope and Laboratory —
 * id, brand, status, title, taxonomy chips. Each section supplies its own
 * back-link target so the drill-down chain (Observatory → Microscope →
 * Laboratory) reads as one path rather than two disconnected pages that happen
 * to look alike.
 */
export function RecordHeader({
  experiment: e,
  backHref,
  backLabel,
  eyebrow,
  children,
}: {
  experiment: Experiment;
  backHref: string;
  backLabel: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  const brand = BRAND_BY_ID[e.brand_id];

  return (
    <>
      <nav className="pt-6 pb-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>
      </nav>

      <header>
        {eyebrow && <p className="field-label">{eyebrow}</p>}
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${eyebrow ? "mt-3" : ""}`}>
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

      {children}
    </>
  );
}
