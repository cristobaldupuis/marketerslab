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

## What exists today (Passes 1–2)

- **Data model** — `Experiment` and `Brand` in `lib/types.ts`, tagged on all four taxonomy
  axes, with a pre-registered `design` (power, MDE, sample) and `kill_criteria`.
- **Seeded dataset** — 3 brands, 20 experiments in `lib/data/`. Every touchpoint, loop stage,
  risk category and brand has several examples; statuses and verdicts are varied.
- **Register (`/`)** — the landing view. Card grid, filterable by all four axes with
  lightweight chips. Filters survive a trip into a record and back.
- **Record detail (`/experiments/[id]`)** — the rigor dial. Simple gives hypothesis, result and
  verdict; deep adds the design of record, the segment tree, the kill criteria with a
  pre-registration stamp and timeline, and the risk posture. Deep is additive, so flipping the
  dial never moves what you were already reading.
- **Segment decision tree** — `components/segment-tree.tsx`, in section 02 of the deep read.
  Every node carries its effect and 95% interval as a forest-plot row on one shared scale;
  clicking a node gives its sub-population, split variable, sample and reasoning path from the
  root. A leaf that moved significantly against the topline is marked, and the panel says so in
  words. `lib/segments.ts` holds the pure readers over a tree.

### The four records that carry trees

| Record | Brand | Topline | What the tree shows |
| --- | --- | --- | --- |
| `EXP-0112` | Sundry Market | +4.2% | The demo case. +14.6% just under the threshold, **−1.9% for new mobile shoppers** — the effect reverses inside a headline win. |
| `EXP-0116` | Marlow & Field | +0.8% | Sibling test. Flat topline hiding +11.2% near-threshold and −4.1% for subscribers who already had free delivery. |
| `EXP-0123` | Ridgeline | −2.7% | Sibling test, killed at day 7 on a franchise rule. A loss overall with one small positive pocket — the reversal running the other way. |
| `EXP-0103` | Sundry Market | +11.3% | The contrast case. Two leaves, same direction: this is what "the pattern generalises" looks like. |

Every other record has `segment_tree: null` and keeps its "no tree data" state.

### Cross-brand pattern view — `/patterns/[id]`

`components/pattern-view.tsx`, reached from the segment analysis on any record that ran at more
than one brand. A family is derived, not tagged: **same title, different brand** (see
`lib/patterns.ts`). Three parts:

- **A pooled estimate**, inverse-variance weighted, so a brand with a wide interval cannot pull
  the number as hard as a brand with a tight one.
- **I², with Cochran's Q behind it** — the share of the spread between brands that is real
  rather than sampling error. On the checkout-threshold family it is 94%, which is the whole
  answer: this does not generalise. Higgins' conventional cut points pick the wording.
- **A forest plot**, then the same `SegmentTree` component with brand as the root split. Shares
  are renormalised to the pooled population and node ids namespaced per brand.

## Deliberately not built yet

| Pass | Feature | Slot in the code |
| --- | --- | --- |
| 3 | Agentic plan-builder and roadmap generator | New `app/api/` route — nothing exists yet |
| 4b | Case-study generator | Composes from a record plus its tree. Deterministic composition is preferred over a model call here — it cannot hallucinate a number that contradicts the tree beside it. |

Also out of scope by design: real auth, real multi-tenancy, real platform integrations.

## Design system

Tokens live in `app/globals.css`. The direction is a laboratory record rather than a marketing
dashboard: pale paper, ink type, monospace for anything that is a measurement or an identifier.

Colour is rationed and always semantic — navy for franchise, ochre for loonshot (always drawn
with a dashed edge, because its boundaries genuinely are provisional), blue for running, green
for won, rust for lost, and violet exactly once, on the pre-registration stamp. Taxonomy is
carried by chips, state by glyph marks, so the two channels never compete inside one card.

The tree reuses the won/lost pair for effect direction and stays neutral wherever an interval
straddles zero, so the sign is never asserted where it cannot be called. It introduces no new
colour, and node chrome is neutral so nothing competes with the effect.

If a new colour seems necessary, take one away first.
