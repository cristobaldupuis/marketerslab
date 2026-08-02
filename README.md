# Marketers Lab

A marketer's experimentation lab: design an experiment with real statistical rigor, watch it
run, and understand *why* it won or lost — across paid media, CRM, PDP and offline, for one
brand or a dozen.

Read [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) and [`DECISIONS.md`](./DECISIONS.md) before
changing anything structural. They carry the reasoning behind the four-axis taxonomy, the
franchise/loonshot rigor defaults, and what was deliberately cut.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
npm run lint
```

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript. No database, no API calls, no
auth. All data is a static TypeScript module.

## What exists today (Pass 1)

- **Data model** — `Experiment` and `Brand` in `lib/types.ts`, tagged on all four taxonomy
  axes, with a pre-registered `design` (power, MDE, sample) and `kill_criteria`.
- **Seeded dataset** — 3 brands, 18 experiments in `lib/data/`. Every touchpoint, loop stage,
  risk category and brand has several examples; statuses and verdicts are varied.
- **Register (`/`)** — the landing view. Card grid, filterable by all four axes with
  lightweight chips. Filters survive a trip into a record and back.
- **Record detail (`/experiments/[id]`)** — the rigor dial. Simple gives hypothesis, result and
  verdict; deep adds the design of record, the kill criteria with a pre-registration stamp and
  timeline, and the risk posture. Deep is additive, so flipping the dial never moves what you
  were already reading.

## Deliberately not built yet

| Pass | Feature | Slot in the code |
| --- | --- | --- |
| 2 | Segment decision tree | `TreeSlot` in `components/experiment-detail.tsx`; data already seeded on `Experiment.segment_tree` |
| 3 | Agentic plan-builder and roadmap generator | New `app/api/` route — nothing exists yet |
| 4 | Cross-brand pattern view, case-study generator | Builds on Pass 2's tree with `brand` as a split variable |

Also out of scope by design: real auth, real multi-tenancy, real platform integrations.

**Pass 2 is a rendering job, not a modelling one.** `EXP-0112` (free-delivery threshold) and
`EXP-0103` (category-led creative) already carry full `SegmentNode` trees. `EXP-0112` is the
demo case: a +4.2% topline win that is really +14.6% for households just under the threshold
and *−1.9%* for new mobile shoppers.

## Design system

Tokens live in `app/globals.css`. The direction is a laboratory record rather than a marketing
dashboard: pale paper, ink type, monospace for anything that is a measurement or an identifier.

Colour is rationed and always semantic — navy for franchise, ochre for loonshot (always drawn
with a dashed edge, because its boundaries genuinely are provisional), blue for running, green
for won, rust for lost, and violet exactly once, on the pre-registration stamp. Taxonomy is
carried by chips, state by glyph marks, so the two channels never compete inside one card.

If a new colour seems necessary, take one away first.
