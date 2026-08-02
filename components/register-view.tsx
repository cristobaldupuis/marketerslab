"use client";

import { useMemo, useState } from "react";
import { BRANDS } from "@/lib/data/brands";
import { EXPERIMENTS } from "@/lib/data/experiments";
import { LOOP_STAGES, RISK_CATEGORIES, TOUCHPOINTS } from "@/lib/taxonomy";
import type { Experiment, LoopStage, RiskCategory, Touchpoint } from "@/lib/types";
import { ExperimentCard } from "./experiment-card";
import { StatusGlyph } from "./marks";

type Filters = {
  touchpoint: Touchpoint[];
  loop_stage: LoopStage[];
  risk_category: RiskCategory[];
  brand_id: string[];
};

const EMPTY: Filters = { touchpoint: [], loop_stage: [], risk_category: [], brand_id: [] };

/**
 * Filters survive a trip into a record and back. Module scope rather than
 * sessionStorage on purpose: the module stays loaded across client navigations,
 * so there is no effect to run and no chance of the server and client rendering
 * different first frames. A full reload starts clean, which is the right
 * default for a working surface.
 */
let lastFilters: Filters = EMPTY;

const readLastFilters = () => lastFilters;
const rememberFilters = (next: Filters) => {
  lastFilters = next;
};

/** Newest activity first — the register is a working document, not an archive. */
const ORDERED = [...EXPERIMENTS].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

function matches(e: Experiment, f: Filters): boolean {
  return (
    (f.touchpoint.length === 0 || f.touchpoint.includes(e.touchpoint)) &&
    (f.loop_stage.length === 0 || f.loop_stage.includes(e.loop_stage)) &&
    (f.risk_category.length === 0 || f.risk_category.includes(e.risk_category)) &&
    (f.brand_id.length === 0 || f.brand_id.includes(e.brand_id))
  );
}

export function RegisterView() {
  const [filters, setFiltersState] = useState<Filters>(readLastFilters);

  const results = useMemo(() => ORDERED.filter((e) => matches(e, filters)), [filters]);
  const activeCount = Object.values(filters).reduce((n, arr) => n + arr.length, 0);

  function setFilters(next: Filters) {
    rememberFilters(next);
    setFiltersState(next);
  }

  function toggle<K extends keyof Filters>(axis: K, value: Filters[K][number]) {
    const current = filters[axis] as string[];
    const next = current.includes(value as string)
      ? current.filter((v) => v !== value)
      : [...current, value as string];
    setFilters({ ...filters, [axis]: next } as Filters);
  }

  return (
    <>
      <Thesis />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <section aria-label="Filters" className="rounded-[6px] border border-rule bg-surface">
          <AxisRow label="Touchpoint" first>
            {TOUCHPOINTS.map((t) => (
              <FilterChip
                key={t.value}
                active={filters.touchpoint.includes(t.value)}
                onClick={() => toggle("touchpoint", t.value)}
                title={t.blurb}
              >
                {t.label}
              </FilterChip>
            ))}
          </AxisRow>

          <AxisRow label="Loop stage">
            {LOOP_STAGES.map((s) => (
              <FilterChip
                key={s.value}
                active={filters.loop_stage.includes(s.value)}
                onClick={() => toggle("loop_stage", s.value)}
                title={s.blurb}
              >
                {s.label}
              </FilterChip>
            ))}
          </AxisRow>

          <AxisRow label="Risk">
            {RISK_CATEGORIES.map((r) => (
              <FilterChip
                key={r.value}
                active={filters.risk_category.includes(r.value)}
                onClick={() => toggle("risk_category", r.value)}
                tone={r.value}
                title={r.blurb}
              >
                {r.label}
              </FilterChip>
            ))}
          </AxisRow>

          <AxisRow label="Brand">
            {BRANDS.map((b) => (
              <FilterChip
                key={b.id}
                active={filters.brand_id.includes(b.id)}
                onClick={() => toggle("brand_id", b.id)}
                title={b.description}
              >
                {b.name}
              </FilterChip>
            ))}
          </AxisRow>

          <div className="flex items-center gap-3 border-t border-rule px-4 py-2.5">
            <span className="font-mono text-[11px] text-ink-3">
              {results.length === ORDERED.length
                ? `${ORDERED.length} records`
                : `${results.length} of ${ORDERED.length} records`}
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                className="ml-auto font-mono text-[11px] text-ink-2 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
              >
                Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
              </button>
            )}
          </div>
        </section>

        {results.length === 0 ? (
          <div className="mt-8 rounded-[6px] border border-dashed border-rule-2 px-6 py-16 text-center">
            <p className="text-[15px] text-ink">Nothing in the register matches that combination.</p>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-2">
              Widen an axis, or clear the filters to see all {ORDERED.length} records.
            </p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="mt-5 rounded-[4px] bg-ink px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-paper uppercase transition-opacity hover:opacity-85"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((e) => (
              <li key={e.id} className="flex">
                <div className="flex w-full">
                  <ExperimentCard experiment={e} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/** Register summary. A readout, not a KPI row — these are counts of records in
 *  each state, which is the one thing worth knowing before you start reading. */
function Thesis() {
  const counts = {
    planned: EXPERIMENTS.filter((e) => e.status === "planned").length,
    running: EXPERIMENTS.filter((e) => e.status === "running").length,
    complete: EXPERIMENTS.filter((e) => e.status === "complete").length,
    killed: EXPERIMENTS.filter((e) => e.status === "killed").length,
  };

  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-12 pb-9 sm:px-8 sm:pt-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div className="max-w-[42ch]">
          <h1
            className="text-[34px] leading-[1.08] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[42px]"
            style={{ fontStretch: "112%" }}
          >
            Rigor, scaled to the stakes.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[14.5px] leading-[1.6] text-ink-2">
            Every experiment here carries the same record — a hypothesis, a design, and kill criteria
            registered before launch. How deep you read it is your call, not the system&rsquo;s.
          </p>
        </div>

        {/* One mark per record, grouped by state — the register counting itself,
            rather than a row of headline numbers. */}
        <div className="shrink-0">
          <p className="field-label mb-2">Register state</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-4 border-t border-ink pt-3.5 sm:gap-x-11">
            {(["planned", "running", "complete", "killed"] as const).map((s) => (
              <div key={s} className="flex flex-col gap-3">
                <dd className="flex h-[9px] items-center gap-[6px]" aria-hidden>
                  {Array.from({ length: counts[s] }, (_, i) => (
                    <StatusGlyph key={i} value={s} animate={false} />
                  ))}
                </dd>
                <dt className="font-mono text-[11px] leading-none tracking-[0.09em] text-ink-3 uppercase">
                  <span className="text-[14px] font-semibold text-ink">{counts[s]}</span> {s}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function AxisRow({
  label,
  children,
  first = false,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4 ${
        first ? "" : "border-t border-rule"
      }`}
    >
      <span className="field-label w-[84px] shrink-0 pt-px">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  title,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  tone?: RiskCategory;
}) {
  // Risk chips keep their semantic colour when selected so the franchise/loonshot
  // code stays consistent between the filter bar and the cards below it.
  const activeClass =
    tone === "franchise"
      ? "border-franchise bg-franchise text-white"
      : tone === "loonshot"
        ? "border-dashed border-loonshot bg-loonshot text-white"
        : "border-ink bg-ink text-paper";

  const idleClass =
    tone === "loonshot"
      ? "border-dashed border-rule-2 bg-surface text-ink-2 hover:border-loonshot/60 hover:text-loonshot"
      : "border-rule-2 bg-surface text-ink-2 hover:border-ink-4 hover:text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={[
        "rounded-full border px-2.5 py-[5px] text-[12.5px] leading-none transition-colors duration-150",
        active ? activeClass : idleClass,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
