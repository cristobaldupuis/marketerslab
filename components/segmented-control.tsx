"use client";

import { useRef } from "react";

/**
 * The sliding-thumb radiogroup, generalized from the old rigor dial so both the
 * Laboratory's Experiment/Patterns switch and the sidebar's theme toggle share
 * one implementation. Transform-only thumb so the switch never reflows text;
 * width divides evenly by option count.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
  label: string;
  size?: "sm" | "md";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = options.findIndex((o) => o.value === value);
  const count = options.length;

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    let next = index;
    for (let i = 0; i < count; i++) {
      next = (next + delta + count) % count;
      if (!options[next].disabled) break;
    }
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  const pad = size === "sm" ? "px-2 py-[5px] text-[10px]" : "px-3 py-[7px] text-[11px]";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative inline-flex rounded-[5px] border border-rule-2 bg-sunk p-[3px]"
    >
      <span
        aria-hidden
        className="absolute top-[3px] bottom-[3px] left-[3px] rounded-[3px] bg-ink shadow-[0_1px_2px_rgba(18,23,30,0.28)] transition-transform duration-[420ms]"
        style={{
          width: `calc(${100 / count}% - ${(3 * (count - 1)) / count + 3}px)`,
          transitionTimingFunction: "var(--ease-dial)",
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-disabled={o.disabled}
          tabIndex={value === o.value ? 0 : -1}
          title={o.hint}
          disabled={o.disabled}
          onClick={() => !o.disabled && onChange(o.value)}
          className={[
            "relative z-10 flex-1 rounded-[3px] font-mono leading-none font-medium tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-200",
            pad,
            o.disabled
              ? "cursor-not-allowed text-ink-4/60"
              : value === o.value
                ? "text-paper"
                : "text-ink-3 hover:text-ink",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
