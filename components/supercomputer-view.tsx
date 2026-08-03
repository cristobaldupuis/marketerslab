"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BUDGETS, INDUSTRIES, STAGES } from "@/lib/generate/inputs";
import type { GenerateResponse } from "@/lib/generate/types";
import { TOUCHPOINTS } from "@/lib/taxonomy";
import type { Touchpoint } from "@/lib/types";
import { ProposalCard, ProposalCardSkeleton } from "./proposal-card";
import { SegmentedControl } from "./segmented-control";

/**
 * Supercomputer — the plan-builder and roadmap generator, one engine behind a
 * mode switch rather than two disconnected tools. Both modes end at the same
 * place: `ResultArea` rendering `ProposalCard`s, so a generated plan and a
 * generated next-test read as the same kind of object.
 */

type Tab = "plan" | "roadmap";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: GenerateResponse }
  | { status: "error" };

interface RoadmapOption {
  id: string;
  title: string;
  brandName: string;
  headlineValue: string | null;
}

export function SupercomputerView({
  initialTab,
  initialRoadmapId,
  roadmapOptions,
}: {
  initialTab: Tab;
  initialRoadmapId: string | null;
  roadmapOptions: RoadmapOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(initialTab);

  function changeTab(next: Tab) {
    setTab(next);
    router.replace(next === "roadmap" ? `${pathname}?tab=roadmap` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 pt-12 pb-24 sm:px-8 sm:pt-16">
      <header>
        <p className="field-label">Supercomputer</p>
        <h1
          className="mt-3 text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[38px]"
          style={{ fontStretch: "112%" }}
        >
          One engine, two moments.
        </h1>
        <p className="mt-3 max-w-[62ch] text-[14.5px] leading-[1.6] text-ink-2">
          The plan-builder proposes ranked, pre-registered experiments before anything launches. The roadmap
          generator reads a completed record&rsquo;s segment tree and proposes the next test — built on the
          lever that actually drove the result, not a restatement of the headline.
        </p>

        <div className="mt-7 flex items-center gap-3 border-y border-rule-2 bg-paper-deep/45 px-4 py-4 sm:px-5">
          <span className="field-label">Mode</span>
          <SegmentedControl
            value={tab}
            onChange={changeTab}
            label="Supercomputer mode"
            options={[
              { value: "plan", label: "Plan builder" },
              { value: "roadmap", label: "Roadmap generator" },
            ]}
          />
        </div>
      </header>

      {tab === "plan" ? <PlanBuilder /> : <RoadmapGenerator options={roadmapOptions} initialId={initialRoadmapId} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                              */
/* -------------------------------------------------------------------------- */

function Section({
  eyebrow,
  title,
  children,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
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

function FieldSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-2 w-full rounded-[5px] border border-rule-2 bg-surface px-3 py-2.5 text-[13.5px] text-ink transition-colors focus-visible:border-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function GenerateButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-[5px] bg-ink px-4 py-2.5 font-mono text-[11px] font-medium tracking-[0.08em] text-paper uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span
          aria-hidden
          className="size-[9px] animate-spin rounded-full border-[1.5px] border-paper/40 border-t-paper"
        />
      )}
      {children}
    </button>
  );
}

function ErrorNote({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="deep-section mt-6 rounded-[6px] border border-dashed border-rule-2 px-5 py-6 text-center">
      <p className="text-[13.5px] text-ink-2">Couldn&rsquo;t reach the generator. Try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-[4px] border border-ink px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        Retry
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan builder                                                               */
/* -------------------------------------------------------------------------- */

const TOUCHPOINT_LABELS = Object.fromEntries(TOUCHPOINTS.map((t) => [t.value, t.label]));
const TOUCHPOINT_VALUES = TOUCHPOINTS.map((t) => t.value);

function PlanBuilder() {
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [stage, setStage] = useState<string>(STAGES[1]);
  const [budget, setBudget] = useState<string>(BUDGETS[1]);
  const [touchpoint, setTouchpoint] = useState<Touchpoint>("pdp");
  const [state, setState] = useState<RequestState>({ status: "idle" });

  async function generate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plan", industry, stage, budget, touchpoint }),
      });
      const data = (await res.json()) as GenerateResponse;
      setState({ status: "done", data });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <>
      <Section eyebrow="01" title="Industry, stage, budget, touchpoint">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="grid gap-4 rounded-[6px] border border-rule bg-surface p-4 sm:grid-cols-2 sm:p-5"
        >
          <FieldSelect label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
          <FieldSelect label="Company stage" value={stage} onChange={setStage} options={STAGES} />
          <FieldSelect label="Test budget" value={budget} onChange={setBudget} options={BUDGETS} />
          <FieldSelect
            label="Touchpoint"
            value={touchpoint}
            onChange={(v) => setTouchpoint(v as Touchpoint)}
            options={TOUCHPOINT_VALUES}
            labels={TOUCHPOINT_LABELS}
          />
          <div className="sm:col-span-2">
            <GenerateButton pending={state.status === "loading"}>
              {state.status === "loading" ? "Generating…" : "Generate plan"}
            </GenerateButton>
          </div>
        </form>
      </Section>

      {state.status !== "idle" && (
        <Section eyebrow="02" title="Ranked proposals" delay={80}>
          {state.status === "loading" && (
            <div className="grid gap-4">
              <ProposalCardSkeleton />
              <ProposalCardSkeleton delay={60} />
            </div>
          )}
          {state.status === "error" && <ErrorNote onRetry={() => void generate()} />}
          {state.status === "done" && (
            <div className="grid gap-4">
              {state.data.proposals.map((p, i) => (
                <ProposalCard key={p.title} proposal={p} eyebrow={`Rank ${i + 1}`} delay={i * 80} />
              ))}
            </div>
          )}
        </Section>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Roadmap generator                                                         */
/* -------------------------------------------------------------------------- */

function RoadmapGenerator({ options, initialId }: { options: RoadmapOption[]; initialId: string | null }) {
  const [experimentId, setExperimentId] = useState<string | null>(initialId);
  const [state, setState] = useState<RequestState>({ status: "idle" });

  async function generate() {
    if (!experimentId) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "roadmap", experimentId }),
      });
      const data = (await res.json()) as GenerateResponse;
      setState({ status: "done", data });
    } catch {
      setState({ status: "error" });
    }
  }

  if (options.length === 0) {
    return (
      <Section eyebrow="01" title="Completed record">
        <div className="rounded-[6px] border border-dashed border-rule-2 px-5 py-8 text-center text-[13.5px] text-ink-2">
          No completed record carries a segment tree yet — the roadmap generator needs one to find a lever.
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section eyebrow="01" title="A completed record with a segment tree">
        <div role="radiogroup" aria-label="Completed record" className="grid gap-2.5">
          {options.map((o) => {
            const selected = o.id === experimentId;
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start gap-3 rounded-[6px] border px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink has-[:focus-visible]:outline-offset-2 ${
                  selected ? "border-ink bg-surface" : "border-rule bg-surface/60 hover:border-rule-2"
                }`}
              >
                <input
                  type="radio"
                  name="roadmap-experiment"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setExperimentId(o.id)}
                />
                <span
                  aria-hidden
                  className={`mt-[3px] inline-flex size-[14px] shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-ink" : "border-rule-2"
                  }`}
                >
                  {selected && <span className="size-[7px] rounded-full bg-ink" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-mono text-[11px] text-ink-3">{o.id}</span>
                    <span className="text-[13.5px] font-medium text-ink">{o.title}</span>
                  </span>
                  <span className="mt-1 block text-[12px] text-ink-3">
                    {o.brandName}
                    {o.headlineValue ? ` · ${o.headlineValue}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="mt-4"
        >
          <GenerateButton pending={state.status === "loading"}>
            {state.status === "loading" ? "Reading the tree…" : "Generate roadmap"}
          </GenerateButton>
        </form>
      </Section>

      {state.status !== "idle" && (
        <Section eyebrow="02" title="Proposed next test" delay={80}>
          {state.status === "loading" && <ProposalCardSkeleton />}
          {state.status === "error" && <ErrorNote onRetry={() => void generate()} />}
          {state.status === "done" && state.data.proposals[0] && (
            <ProposalCard proposal={state.data.proposals[0]} eyebrow="Proposed next test" />
          )}
        </Section>
      )}
    </>
  );
}
