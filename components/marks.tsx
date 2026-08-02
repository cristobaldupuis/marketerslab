import { LOOP_STAGE_ORDER, LOOP_STAGES, RISK_BY, STATUS_BY, TOUCHPOINT_BY } from "@/lib/taxonomy";
import type { ExperimentStatus, LoopStage, Outcome, RiskCategory, Touchpoint } from "@/lib/types";

/**
 * The vocabulary of the record. Two channels, deliberately kept apart so they
 * never compete inside the same card:
 *
 *   Chips  = taxonomy (what kind of experiment this is)
 *   Marks  = state    (where it got to)
 *
 * Taxonomy chips are neutral except for risk category, which is the only axis
 * that changes how the experiment is actually run.
 */

export function TouchpointChip({ value }: { value: Touchpoint }) {
  return (
    <span className="inline-flex items-center rounded-[3px] border border-rule bg-surface px-1.5 py-[3px] font-mono text-[10px] leading-none font-medium tracking-[0.06em] text-ink-2 uppercase">
      {TOUCHPOINT_BY[value].label}
    </span>
  );
}

/**
 * Franchise reads as solid and contained; loonshot is drawn with a dashed edge
 * because its boundaries genuinely are provisional — looser kill criteria,
 * longer runway. The border is carrying meaning, not decoration.
 */
export function RiskChip({ value, size = "sm" }: { value: RiskCategory; size?: "sm" | "md" }) {
  const isLoonshot = value === "loonshot";
  const pad = size === "md" ? "px-2 py-1 text-[11px]" : "px-1.5 py-[3px] text-[10px]";
  return (
    <span
      className={[
        "inline-flex items-center rounded-[3px] font-mono leading-none font-semibold tracking-[0.06em] uppercase",
        pad,
        isLoonshot
          ? "border border-dashed border-loonshot/55 bg-loonshot-tint text-loonshot"
          : "border border-solid border-franchise/25 bg-franchise-tint text-franchise",
      ].join(" ")}
    >
      {RISK_BY[value].label}
    </span>
  );
}

const STATUS_TONE: Record<ExperimentStatus, string> = {
  planned: "text-ink-3",
  running: "text-live",
  complete: "text-ink",
  killed: "text-stopped",
};

/**
 * Status is a glyph plus a word, never a filled pill — that keeps it visually
 * distinct from the taxonomy chips sitting next to it. Killed uses a square
 * rather than a circle: stopping on a pre-registered rule is the system
 * working, so it gets its own shape rather than an alarm colour.
 */
export function StatusMark({ value }: { value: ExperimentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${STATUS_TONE[value]}`}>
      <StatusGlyph value={value} />
      <span className="font-mono text-[10px] leading-none font-medium tracking-[0.1em] uppercase">
        {STATUS_BY[value].label}
      </span>
    </span>
  );
}

export function StatusGlyph({ value, animate = true }: { value: ExperimentStatus; animate?: boolean }) {
  if (value === "running") {
    return (
      <span className="relative inline-flex size-[7px] shrink-0 items-center justify-center">
        <span className="absolute inline-flex size-[7px] rounded-full bg-live/30" />
        <span
          className={`inline-flex size-[7px] rounded-full bg-live ${animate ? "animate-live-pulse" : ""}`}
        />
      </span>
    );
  }
  if (value === "killed") {
    return <span className="inline-block size-[7px] shrink-0 bg-stopped" />;
  }
  if (value === "complete") {
    return <span className="inline-block size-[7px] shrink-0 rounded-full bg-ink" />;
  }
  return <span className="inline-block size-[7px] shrink-0 rounded-full border border-ink-4" />;
}

const OUTCOME_TONE: Record<Outcome, string> = {
  won: "text-won",
  lost: "text-lost",
  flat: "text-ink-2",
  learning: "text-stopped",
};

export function VerdictText({
  outcome,
  children,
  className = "",
}: {
  outcome: Outcome | null;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`${outcome ? OUTCOME_TONE[outcome] : "text-ink-3"} ${className}`}>{children}</span>;
}

/**
 * The five loop stages as a filled meter. This encodes real information — how
 * far through the lifecycle the record is — so it earns its place. Stages after
 * the current one are drawn as empty track.
 */
export function LoopMeter({ value, showLabel = true }: { value: LoopStage; showLabel?: boolean }) {
  const index = LOOP_STAGE_ORDER.indexOf(value);
  return (
    <span className="inline-flex items-center gap-2" title={`Loop stage: ${LOOP_STAGES[index].label}`}>
      <span className="flex items-center gap-[3px]" aria-hidden>
        {LOOP_STAGE_ORDER.map((stage, i) => (
          <span
            key={stage}
            className={[
              "h-[3px] rounded-[1px] transition-colors",
              i < index ? "w-3 bg-ink-4" : i === index ? "w-3 bg-ink" : "w-3 bg-rule",
            ].join(" ")}
          />
        ))}
      </span>
      {showLabel && (
        <span className="font-mono text-[10px] leading-none font-medium tracking-[0.08em] text-ink-2 uppercase">
          {LOOP_STAGES[index].label}
        </span>
      )}
      <span className="sr-only">
        Loop stage {index + 1} of 5: {LOOP_STAGES[index].label}
      </span>
    </span>
  );
}

export function BrandMark({ initials }: { initials: string }) {
  return (
    <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-[3px] border border-rule-2 bg-sunk font-mono text-[10px] leading-none font-semibold tracking-[0.02em] text-ink-2">
      {initials}
    </span>
  );
}
