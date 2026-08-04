"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { criteriaFit, inheritedCriteria, movedFields, templateOf } from "@/lib/criteria";
import { formatCount, formatDate } from "@/lib/format";
import {
  confirmCriteria,
  useRegister,
  type Confirmations,
  type CriteriaConfirmation,
} from "@/lib/quarantine";
import { RISK_BY, TOUCHPOINT_BY } from "@/lib/taxonomy";
import type { Experiment, KillCriteriaFields } from "@/lib/types";
import {
  BrandMark,
  LoopMeter,
  OwnerMark,
  RegisteredStamp,
  RiskChip,
  StatusMark,
  TouchpointChip,
  UnregisteredStamp,
} from "./marks";

/**
 * Quarantine — the holding area a record sits in before it is cleared into the
 * register. Not a filter over the Observatory: a held record is genuinely absent
 * from it (see DEFINITIONS.md and `lib/quarantine.ts`), so this page is the only
 * place it can be read at all.
 *
 * The confirm step is the UI Pass B designed and deferred: criteria are
 * inherited from the record's touchpoint × risk-class cell, editing any value
 * raises a deviation, and a deviation has to be acknowledged with a checkbox —
 * no justification text field, deliberately. Setting `kill_criteria_overridden`
 * is this UI's job.
 */
export function QuarantineView() {
  const { confirmations, register, held } = useRegister();

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-12 pb-9 sm:px-8 sm:pt-16">
      <div className="max-w-[52ch]">
        <p className="field-label">Quarantine</p>
        <h1
          className="mt-3 text-[34px] leading-[1.08] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[42px]"
          style={{ fontStretch: "112%" }}
        >
          Cleared before it joins the population.
        </h1>
        <p className="mt-4 text-[14.5px] leading-[1.6] text-ink-2">
          A record waits here until someone has accepted or overridden the kill criteria it inherits
          from its touchpoint &times; risk-class cell. This is a checkpoint, not a punishment — and
          nothing held here is visible in the Observatory, counted in the register, or eligible to
          run until it clears.
        </p>
      </div>

      <SessionNote />

      {held.length === 0 ? (
        <EmptyState registerCount={register.length} />
      ) : (
        <>
          <p className="mt-9 font-mono text-[11px] text-ink-3">
            {held.length} record{held.length === 1 ? "" : "s"} held · {register.length} in the register
          </p>
          <ul className="mt-3 flex flex-col gap-4">
            {held.map((e) => (
              <li key={e.id}>
                <HeldRecord experiment={e} />
              </li>
            ))}
          </ul>
        </>
      )}

      <Graduated confirmations={confirmations} />
    </div>
  );
}

/**
 * Said on the page rather than in a comment, because the alternative is a
 * button that looks like it writes a record and doesn't. Same posture the
 * Supercomputer takes about its proposals.
 */
function SessionNote() {
  return (
    <p className="mt-6 max-w-[62ch] border-l-2 border-rule-2 py-1 pl-4 text-[13px] leading-[1.6] text-ink-2">
      <span className="field-label mr-2 align-middle">How this saves</span>
      It doesn&rsquo;t. The register is a static TypeScript module with no persistence layer behind
      it, so confirming here clears the record for this browser session only — the Observatory,
      the priority tree and the record count all update, and a reload puts it back in the holding
      area. Nothing is written to <span className="font-mono text-[12px] text-ink">lib/data/</span>.
    </p>
  );
}

function EmptyState({ registerCount }: { registerCount: number }) {
  return (
    <div className="mt-9 rounded-[6px] border border-dashed border-rule-2 px-6 py-16 text-center">
      <p className="text-[15px] text-ink">Nothing is being held.</p>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-2">
        All {registerCount} records in the register have confirmed criteria. Reload the page to
        restore the seeded holding queue.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* One held record, and its confirm step                                       */
/* -------------------------------------------------------------------------- */

const FIELD_LABEL: Record<keyof KillCriteriaFields, string> = {
  min_sample_size: "Minimum sample",
  min_runtime_days: "Minimum runtime",
  max_runtime_days: "Maximum runtime",
  win_threshold: "Win threshold",
};

const NUMERIC_FIELDS = ["min_sample_size", "min_runtime_days", "max_runtime_days"] as const;

/** Deterministic, locale-free, and only ever called from a click handler — so
 *  no clock reaches a render pass. Same rule as `lib/format.ts`. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function HeldRecord({ experiment: e }: { experiment: Experiment }) {
  const brand = BRAND_BY_ID[e.brand_id];
  const cell = templateOf(e);
  const inherited = inheritedCriteria(e);

  const [draft, setDraft] = useState<KillCriteriaFields>(inherited);
  const [acknowledged, setAcknowledged] = useState(false);

  const changed = movedFields(inherited, draft);
  const overridden = changed.length > 0;
  const blocked = overridden && !acknowledged;

  function edit<K extends keyof KillCriteriaFields>(key: K, value: KillCriteriaFields[K]) {
    setDraft({ ...draft, [key]: value });
    // An acknowledgement is of a specific deviation, so a further edit retracts
    // it — otherwise one tick would clear every change made after it.
    setAcknowledged(false);
  }

  function reset() {
    setDraft(inherited);
    setAcknowledged(false);
  }

  function confirm() {
    if (blocked) return;
    const overrides: Partial<KillCriteriaFields> = {};
    for (const key of changed) overrides[key] = draft[key] as never;

    const confirmation: CriteriaConfirmation = {
      confirmed_at: today(),
      // A rule already locked by hand keeps its own stamp; this step is settling
      // the template relationship, not re-dating someone else's commitment.
      registered_at: e.kill_criteria.registered_at || today(),
      overridden,
      criteria: draft,
      overrides,
    };
    confirmCriteria(e.id, confirmation);
  }

  return (
    <article className="overflow-hidden rounded-[5px] border border-dashed border-rule-2 bg-surface">
      <div className="flex flex-col gap-4 border-b border-rule px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] leading-none font-medium tracking-[0.04em] text-ink-3">
            {e.id}
          </span>
          <BrandMark initials={brand.initials} />
          <span className="truncate text-[12px] leading-none text-ink-2">{brand.name}</span>
          <span className="ml-auto flex items-center gap-3">
            <StatusMark value={e.status} />
            <LoopMeter value={e.loop_stage} />
          </span>
        </div>

        <div>
          <h2 className="text-[16px] leading-[1.3] font-semibold text-pretty text-ink" style={{ fontStretch: "104%" }}>
            {e.title}
          </h2>
          <p className="mt-2 max-w-[70ch] text-[13.5px] leading-[1.55] text-ink-2">{e.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <TouchpointChip value={e.touchpoint} />
          <RiskChip value={e.risk_category} />
          <span className="ml-auto flex items-center gap-1.5">
            <OwnerMark name={e.owner} />
            <span className="font-mono text-[10.5px] leading-none text-ink-3">
              Briefed {formatDate(e.created_at)}
            </span>
          </span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
          <p className="field-label">
            Inherited criteria · {TOUCHPOINT_BY[e.touchpoint].label} &times;{" "}
            {RISK_BY[e.risk_category].label}
          </p>
          <p className="font-mono text-[10.5px] text-ink-4">{cell.id}</p>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {NUMERIC_FIELDS.map((key) => (
            <NumberCell
              key={key}
              label={FIELD_LABEL[key]}
              suffix={key === "min_sample_size" ? "per arm" : "days"}
              value={draft[key]}
              inherited={inherited[key]}
              onChange={(v) => edit(key, v)}
            />
          ))}
          <TextCell
            label={FIELD_LABEL.win_threshold}
            value={draft.win_threshold}
            inherited={inherited.win_threshold}
            onChange={(v) => edit("win_threshold", v)}
          />
        </dl>

        <DesignFit experiment={e} draft={draft} />

        <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0 flex-1">
            {overridden ? (
              <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-ink">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(ev) => setAcknowledged(ev.target.checked)}
                  className="mt-[3px] size-[15px] shrink-0 accent-[var(--color-ink)]"
                />
                <span>
                  This record departs from the {RISK_BY[e.risk_category].label.toLowerCase()} standard
                  for {TOUCHPOINT_BY[e.touchpoint].label} on{" "}
                  <span className="font-medium">
                    {changed.map((key) => FIELD_LABEL[key].toLowerCase()).join(", ")}
                  </span>
                  . I&rsquo;m overriding it deliberately.
                </span>
              </label>
            ) : (
              <p className="text-[13.5px] leading-[1.5] text-ink-2">
                Unchanged from the cell. Confirming accepts the standard as it stands.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {overridden && (
              <button
                type="button"
                onClick={reset}
                className="font-mono text-[11px] text-ink-2 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={confirm}
              disabled={blocked}
              title={blocked ? "Acknowledge the deviation first" : undefined}
              className={[
                "rounded-[4px] px-3.5 py-2 font-mono text-[11px] leading-none tracking-[0.08em] uppercase transition-opacity",
                blocked
                  ? "cursor-not-allowed bg-sunk text-ink-4"
                  : "bg-ink text-paper hover:opacity-85",
              ].join(" ")}
            >
              {overridden ? "Confirm override" : "Accept and clear"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * The record's own design read against the criteria being confirmed, live as
 * they are edited. This is why a checkpoint is worth having: EXP-0151 is sized
 * at 14,200 households per arm against a 25,000 floor, and that disagreement
 * belongs at the moment of the decision rather than at the interim read. The
 * check itself lives in `lib/criteria.ts` — the Laboratory runs the same one
 * over records that are already in the register.
 */
function DesignFit({ experiment: e, draft }: { experiment: Experiment; draft: KillCriteriaFields }) {
  const fit = criteriaFit(e, draft);
  const stamp = e.kill_criteria.registered_at;

  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className="field-label">Against the design on this record</p>
        {fit.findings.length === 0 ? (
          <p className="mt-2 max-w-[70ch] text-[13.5px] leading-[1.55] text-ink-2">
            The design as briefed sits inside these criteria. Nothing here needs a deviation.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {fit.findings.map((f) => (
              <li
                key={f.note}
                className={`flex max-w-[70ch] gap-2.5 text-[13.5px] leading-[1.55] ${
                  f.kind === "floor_not_applicable" ? "text-ink-2" : "text-ink"
                }`}
              >
                <span aria-hidden className="mt-[7px] size-[3px] shrink-0 rounded-full bg-ink-4" />
                {f.note}
              </li>
            ))}
          </ul>
        )}
        {stamp && (
          <p className="mt-3 max-w-[70ch] text-[13px] leading-[1.55] text-ink-2">
            The prose rule on this record was locked by hand on{" "}
            <span className="font-mono text-ink">{formatDate(stamp)}</span>, before it was ever read
            against a template. A pre-registered rule is not a reconciled one — that is what this
            step settles.
          </p>
        )}
      </div>
      <div className="shrink-0">
        {stamp ? <RegisteredStamp date={stamp} /> : <UnregisteredStamp note="Locks on clearing" />}
      </div>
    </div>
  );
}

function NumberCell({
  label,
  suffix,
  value,
  inherited,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  inherited: number;
  onChange: (v: number) => void;
}) {
  const moved = value !== inherited;
  return (
    <div className={`px-3.5 py-3 ${moved ? "bg-sunk" : "bg-surface"}`}>
      <dt className="field-label">{label}</dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5">
        <input
          type="number"
          min={0}
          value={value}
          aria-label={label}
          onChange={(ev) => onChange(Math.max(0, Number(ev.target.value) || 0))}
          className="w-[7ch] min-w-0 border-b border-rule-2 bg-transparent pb-px font-mono text-[15px] leading-none font-medium text-ink transition-colors focus:border-ink focus:outline-none"
        />
        <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 uppercase">{suffix}</span>
      </dd>
      <InheritedNote moved={moved} original={formatCount(inherited)} />
    </div>
  );
}

function TextCell({
  label,
  value,
  inherited,
  onChange,
}: {
  label: string;
  value: string;
  inherited: string;
  onChange: (v: string) => void;
}) {
  const moved = value !== inherited;
  return (
    <div className={`px-3.5 py-3 ${moved ? "bg-sunk" : "bg-surface"}`}>
      <dt className="field-label">{label}</dt>
      <dd className="mt-1.5">
        <input
          type="text"
          value={value}
          aria-label={label}
          onChange={(ev) => onChange(ev.target.value)}
          className="w-full min-w-0 border-b border-rule-2 bg-transparent pb-px text-[13.5px] leading-tight text-ink transition-colors focus:border-ink focus:outline-none"
        />
      </dd>
      <InheritedNote moved={moved} original={inherited} />
    </div>
  );
}

/** The inherited value stays on screen once it has been edited away, so the
 *  deviation is legible without leaving the field to find out what it was. */
function InheritedNote({ moved, original }: { moved: boolean; original: string }) {
  return (
    <p className="mt-2 truncate font-mono text-[10px] leading-none text-ink-4" title={moved ? original : undefined}>
      {moved ? `Inherited ${original}` : "Inherited"}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Graduated this session                                                      */
/* -------------------------------------------------------------------------- */

function Graduated({ confirmations }: { confirmations: Confirmations }) {
  const cleared = Object.entries(confirmations);
  if (cleared.length === 0) return null;

  return (
    <section className="mt-12 border-t border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
        <h2 className="text-[15px] font-semibold tracking-[0.005em] text-ink" style={{ fontStretch: "106%" }}>
          Cleared this session
        </h2>
        <Link
          href="/observatory"
          className="font-mono text-[11px] text-ink-2 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
        >
          See them in the Observatory →
        </Link>
      </div>
      <p className="mt-2 max-w-[70ch] text-[13px] leading-[1.55] text-ink-2">
        Each record below is now in the register and eligible to run. This is the write that would
        have landed on it.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {cleared.map(([id, confirmation]) => (
          <li key={id}>
            <Receipt id={id} confirmation={confirmation} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Receipt({ id, confirmation: c }: { id: string; confirmation: CriteriaConfirmation }) {
  const changed = Object.keys(c.overrides) as (keyof KillCriteriaFields)[];

  return (
    <div className="rounded-[5px] border border-rule bg-surface px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={`/microscope/${id}`}
          className="font-mono text-[11px] leading-none font-medium tracking-[0.04em] text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors hover:decoration-ink"
        >
          {id}
        </Link>
        <span className="font-mono text-[10px] leading-none tracking-[0.1em] text-ink-3 uppercase">
          {c.overridden ? "Overridden" : "Inherited as-is"}
        </span>
        <span className="ml-auto font-mono text-[10.5px] leading-none text-ink-3">
          Confirmed {formatDate(c.confirmed_at)} · pre-registered {formatDate(c.registered_at)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-rule pt-3 sm:grid-cols-4">
        <ReceiptField label={FIELD_LABEL.min_sample_size} value={`${formatCount(c.criteria.min_sample_size)} / arm`} moved={changed.includes("min_sample_size")} />
        <ReceiptField label={FIELD_LABEL.min_runtime_days} value={`${c.criteria.min_runtime_days} days`} moved={changed.includes("min_runtime_days")} />
        <ReceiptField label={FIELD_LABEL.max_runtime_days} value={`${c.criteria.max_runtime_days} days`} moved={changed.includes("max_runtime_days")} />
        <ReceiptField label={FIELD_LABEL.win_threshold} value={c.criteria.win_threshold} moved={changed.includes("win_threshold")} />
      </dl>
    </div>
  );
}

function ReceiptField({ label, value, moved }: { label: string; value: string; moved: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="field-label truncate">{label}</dt>
      <dd className="mt-1 text-[13px] leading-snug text-ink">
        {value}
        {moved && (
          <span className="ml-1.5 font-mono text-[9.5px] tracking-[0.08em] text-ink-4 uppercase">moved</span>
        )}
      </dd>
    </div>
  );
}
