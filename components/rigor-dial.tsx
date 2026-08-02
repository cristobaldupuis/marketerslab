"use client";

import { useRef } from "react";
import type { RigorTier, RiskCategory } from "@/lib/types";
import { RISK_BY } from "@/lib/taxonomy";

export type ReadDepth = "simple" | "deep";

const POSITIONS: { value: ReadDepth; label: string; hint: string }[] = [
  { value: "simple", label: "Simple", hint: "Hypothesis, result, verdict" },
  { value: "deep", label: "Deep", hint: "Design of record, kill criteria, segments" },
];

/**
 * The rigor dial. A view switcher, not a permission — the same person reads
 * simple on Monday and deep on Wednesday (see DECISIONS.md).
 *
 * The tick under the track marks the depth this experiment's risk category
 * defaults to, so the franchise/loonshot tag is visible as something that
 * changes behaviour rather than a badge.
 */
export function RigorDial({
  value,
  onChange,
  risk,
  tier,
}: {
  value: ReadDepth;
  onChange: (v: ReadDepth) => void;
  risk: RiskCategory;
  tier: RigorTier;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = POSITIONS.findIndex((p) => p.value === value);
  const defaultDepth: ReadDepth = RISK_BY[risk].rigor_default === "light" ? "simple" : "deep";

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + POSITIONS.length) % POSITIONS.length;
    onChange(POSITIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-3">
        <span className="field-label">Read at</span>

        <div
          role="radiogroup"
          aria-label="Reading depth"
          onKeyDown={onKeyDown}
          className="relative inline-flex rounded-[5px] border border-rule-2 bg-sunk p-[3px]"
        >
          {/* Sliding thumb. Transform-only, so the switch never reflows text. */}
          <span
            aria-hidden
            className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-[3px] bg-ink shadow-[0_1px_2px_rgba(18,23,30,0.28)] transition-transform duration-[420ms]"
            style={{
              transitionTimingFunction: "var(--ease-dial)",
              transform: index === 1 ? "translateX(100%)" : "none",
            }}
          />
          {POSITIONS.map((p, i) => (
            <button
              key={p.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={value === p.value}
              tabIndex={value === p.value ? 0 : -1}
              title={p.hint}
              onClick={() => onChange(p.value)}
              className={[
                "relative z-10 w-[86px] rounded-[3px] px-3 py-[7px] font-mono text-[11px] leading-none font-medium tracking-[0.1em] uppercase transition-colors duration-200",
                value === p.value ? "text-paper" : "text-ink-3 hover:text-ink",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-[11px] leading-[1.5] text-ink-3">
        <span className="text-ink-2">{RISK_BY[risk].label}</span> defaults to{" "}
        <span className="text-ink-2">{defaultDepth}</span>
        {" · "}
        this record is set to <span className="text-ink-2">{tier}</span>
      </p>
    </div>
  );
}
