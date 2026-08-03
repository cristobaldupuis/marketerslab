import { EXPERIMENTS } from "@/lib/data/experiments";
import { ExperimentCard } from "./experiment-card";

/**
 * Vivarium — live specimens under observation. Every experiment currently
 * `status: "running"`, isolated from the rest of the register so "what's live
 * right now" doesn't require a filter click on the Observatory. See
 * DEFINITIONS.md.
 */
export function VivariumView() {
  const running = EXPERIMENTS.filter((e) => e.status === "running").sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-12 pb-9 sm:px-8 sm:pt-16">
      <div className="max-w-[52ch]">
        <p className="field-label">Vivarium</p>
        <h1
          className="mt-3 text-[34px] leading-[1.08] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[42px]"
          style={{ fontStretch: "112%" }}
        >
          What&rsquo;s live right now.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[14.5px] leading-[1.6] text-ink-2">
          Every experiment currently collecting data, in one place — no filter needed. Everything
          here is still in flight; its verdict isn&rsquo;t written yet.
        </p>
      </div>

      {running.length === 0 ? (
        <div className="mt-9 rounded-[6px] border border-dashed border-rule-2 px-6 py-16 text-center">
          <p className="text-[15px] text-ink">Nothing is running right now.</p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-2">
            Check the Observatory for planned experiments waiting to launch.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-9 font-mono text-[11px] text-ink-3">
            {running.length} record{running.length === 1 ? "" : "s"} running
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {running.map((e) => (
              <li key={e.id} className="flex">
                <div className="flex w-full">
                  <ExperimentCard experiment={e} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
