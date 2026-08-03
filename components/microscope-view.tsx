import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { Experiment } from "@/lib/types";
import { RecordHeader } from "./record-header";
import { VerdictText } from "./marks";

/**
 * Microscope — close inspection of a single record, nothing else in the frame.
 * Hypothesis, headline result, verdict: the read a busy operator needs in ten
 * seconds. Formerly the "simple" position of the rigor dial on the merged
 * experiment-detail page; see DEFINITIONS.md.
 */
export function MicroscopeView({ experiment: e }: { experiment: Experiment }) {
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
      <article className="max-w-[1000px]">
        <RecordHeader experiment={e} backHref="/observatory" backLabel="Observatory" eyebrow="Microscope" />

        <section className="mt-9">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] md:gap-9">
            <div className="order-2 md:order-1">
              <h2 className="field-label">Hypothesis</h2>
              <p className="mt-2.5 max-w-[62ch] text-[15.5px] leading-[1.62] text-pretty text-ink">
                {e.hypothesis}
              </p>

              <h2 className="field-label mt-7">The read</h2>
              <p className="mt-2.5 max-w-[62ch] text-[14.5px] leading-[1.62] text-ink-2">{e.summary}</p>
            </div>

            <div className="order-1 md:order-2">
              <ResultPanel experiment={e} />
            </div>
          </div>
        </section>

        <LaboratoryHint experimentId={e.id} />
      </article>
    </div>
  );
}

function ResultPanel({ experiment: e }: { experiment: Experiment }) {
  if (!e.headline) {
    return (
      <div className="rounded-[6px] border border-dashed border-rule-2 bg-surface/60 p-4">
        <p className="field-label">Result</p>
        <p className="mt-3 text-[15px] leading-snug text-ink-2">Not launched yet.</p>
        <dl className="mt-4 space-y-2 border-t border-rule pt-3 font-mono text-[11px] text-ink-3">
          <div className="flex justify-between gap-3">
            <dt>Planned runtime</dt>
            <dd className="text-ink-2">{e.design.planned_runtime_days} days</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Sample target</dt>
            <dd className="text-ink-2">
              {e.design.sample_per_arm ? `${formatCount(e.design.sample_per_arm)} / arm` : "Set at brief"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  const isOpen = e.status === "running";

  return (
    <div className="rounded-[6px] border border-rule bg-surface p-4">
      <p className="field-label">{e.headline.label}</p>
      <p
        className="mt-2.5 text-[44px] leading-none font-semibold tracking-[-0.02em]"
        style={{ fontStretch: "106%" }}
      >
        <VerdictText outcome={isOpen ? null : e.outcome}>{e.headline.value}</VerdictText>
      </p>
      <p className="mt-2.5 font-mono text-[11px] leading-[1.5] text-ink-3">{e.headline.interval}</p>

      {e.verdict && (
        <p className="mt-4 border-t border-rule pt-3 text-[13.5px] leading-snug">
          <VerdictText outcome={e.outcome} className="font-medium">
            {e.verdict}
          </VerdictText>
        </p>
      )}
    </div>
  );
}

/** Microscope has to say what it's leaving out — otherwise the design and
 *  evidence behind the verdict are invisible to anyone who never clicks through. */
function LaboratoryHint({ experimentId }: { experimentId: string }) {
  return (
    <div className="mt-12 flex flex-col gap-4 rounded-[6px] border border-dashed border-rule-2 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="field-label">Also on this record</p>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-2">
          Design of record · Segment analysis · Kill criteria as registered · Risk posture
        </p>
      </div>
      <Link
        href={`/laboratory/${experimentId}`}
        className="shrink-0 self-start rounded-[4px] border border-ink px-3 py-2 font-mono text-[11px] leading-none tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper sm:self-auto"
      >
        Open in Laboratory
      </Link>
    </div>
  );
}
