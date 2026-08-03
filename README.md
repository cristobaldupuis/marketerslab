# Marketers Lab

A marketer's experimentation lab: design an experiment with real statistical rigor, watch it
run, and understand *why* it won or lost — across paid media, CRM, PDP and offline, for one
brand or a dozen.

Read [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) and [`DECISIONS.md`](./DECISIONS.md) before
changing anything structural. They carry the reasoning behind the four-axis taxonomy, the
franchise/loonshot rigor defaults, and what was deliberately cut. Read
[`DEFINITIONS.md`](./DEFINITIONS.md) for the science-metaphor section names, and
[`ROADMAP.md`](./ROADMAP.md) for what's next and in what order.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
npm run lint
```

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript. No database, no API calls, no
auth. All data is a static TypeScript module.

## The information architecture: sections as places/tools of science

The app is organized around six sections, each a metaphor for a place or instrument a
scientist would use at a different stage of running an experiment. Full definitions in
[`DEFINITIONS.md`](./DEFINITIONS.md); this table is the build-status summary.

| Section | Metaphor | Route(s) | Status |
| --- | --- | --- | --- |
| **Observatory** | High-level monitoring — the wide-angle view of everything in flight | `/observatory` (`/` redirects here) | ✅ Built |
| **Laboratory** | The analysis workspace — where a record's design, evidence and cross-brand pattern are worked through | `/laboratory/[id]` (Experiment / Patterns tabs) | ✅ Built |
| **Microscope** | Close inspection of one record — hypothesis, verdict, headline, nothing else in the frame | `/microscope/[id]` | ✅ Built |
| **Vivarium** | Live specimens under observation — experiments currently running | `/vivarium` | ✅ Built |
| **Quarantine** | Pre-register triage — an experiment held here until its kill criteria are confirmed | `/quarantine` (planned) | ⏳ Not started |
| **Supercomputer** | AI/agentic tooling — plan-builder, roadmap generator | not yet routed | ⏳ Not started (deferred, Pass 3 in the original build plan) |

A persistent left sidebar lists the four sections you can land on directly, grouped as
**Signal** (Observatory, Vivarium) and **Protocol** (Quarantine, Supercomputer). Quarantine
appears disabled/"coming soon" until its pass lands. Laboratory and Microscope are real,
built sections but aren't sidebar rows — both only resolve to a destination once a record
is already in view, so they're reached from a card or from each other, not from the
sidebar; see the note at the top of `DEFINITIONS.md`.

**Section is a UI/organizational layer, not a data axis.** The four-axis taxonomy
(Touchpoint, Loop Stage, Risk category, Brand) described in `DECISIONS.md` is locked and
untouched by this restructuring — see "Things that look arbitrary but are not" in
`AGENTS.md`.

## What exists today

- **Data model** — `Experiment` and `Brand` in `lib/types.ts`, tagged on all four taxonomy
  axes, with a pre-registered `design` (power, MDE, sample) and `kill_criteria`.
- **Seeded dataset** — 3 brands, 20 experiments in `lib/data/`. Every touchpoint, loop stage,
  risk category and brand has several examples; statuses and verdicts are varied.
- **Observatory (`/observatory`)** — the landing view. A masthead (last-synced timestamp,
  read off the register; a link into Supercomputer's plan-builder to brief a new
  experiment) and a stat-tile strip sit above two views, toggled with a segmented control:
  - **Cards** — the grid, filterable by all four axes with lightweight chips. Filters
    survive a trip into a record and back. Each card carries a timeline note ("Launched
    …" / "Briefed …", off real dates) and an owner mark.
  - **Priority tree** — every not-yet-concluded record grouped by loop stage then risk
    category, so a thin or lopsided patch of the pipeline reads as a visible prompt
    ("Analyze is empty," "Launch is all franchise") instead of something you have to
    notice yourself. Answers "what should run next," not "why did this happen" — see
    `lib/priority.ts` and `components/priority-tree.tsx`, and the segment-tree
    distinction called out in `DECISIONS.md`.
- **Microscope (`/microscope/[id]`)** — the quick, close-in read of a single record:
  hypothesis, result, verdict. Links out to the Laboratory for anyone who wants the full
  design and evidence behind it.
- **Laboratory (`/laboratory/[id]`)** — the analysis workspace, two tabs:
  - **Experiment** — design of record, the segment tree, kill criteria with a
    pre-registration stamp and timeline, and the risk posture. What used to be the "deep"
    side of the rigor dial.
  - **Patterns** — cross-brand aggregation for any record that's part of a family (same
    title run at more than one brand): pooled effect, I², forest plot, and the segment tree
    with brand as the root split. Disabled for records with no family.
- **Vivarium (`/vivarium`)** — every experiment currently `status: "running"`, isolated
  from the rest of the register so "what's live right now" doesn't require a filter click.
- **Segment decision tree** — `components/segment-tree.tsx`, used inside the Laboratory's
  Experiment tab and Patterns tab alike. Every node carries its effect and 95% interval as a
  forest-plot row on one shared scale; clicking a node gives its sub-population, split
  variable, sample and reasoning path from the root. `lib/segments.ts` holds the pure readers
  over a tree.
- **Dark mode** — light/dark/system toggle in the sidebar, persisted in `localStorage`,
  defaulting to `prefers-color-scheme`. Existing semantic color tokens (franchise, loonshot,
  live, won, lost, stopped, stamp) and the ink/rule neutral scale extend into a dark palette
  rather than being replaced — see the token block in `app/globals.css`.
- **Kill-criteria templates** — `lib/data/kill-criteria-templates.ts`, six templates
  covering the touchpoint × risk-class matrix (some cells intentionally share a template).
  Every seeded experiment references one via `kill_criteria_template_id`; three carry a
  conscious `kill_criteria_overridden: true` deviation. No UI reads this yet — it's the data
  model Quarantine (Pass C) will triage against.

### The four records that carry trees

| Record | Brand | Topline | What the tree shows |
| --- | --- | --- | --- |
| `EXP-0112` | Sundry Market | +4.2% | The demo case. +14.6% just under the threshold, **−1.9% for new mobile shoppers** — the effect reverses inside a headline win. |
| `EXP-0116` | Marlow & Field | +0.8% | Sibling test. Flat topline hiding +11.2% near-threshold and −4.1% for subscribers who already had free delivery. |
| `EXP-0123` | Ridgeline | −2.7% | Sibling test, killed at day 7 on a franchise rule. A loss overall with one small positive pocket — the reversal running the other way. |
| `EXP-0103` | Sundry Market | +11.3% | The contrast case. Two leaves, same direction: this is what "the pattern generalises" looks like. |

Every other record has `segment_tree: null` and keeps its "no tree data" state.

## Deliberately not built yet

See [`ROADMAP.md`](./ROADMAP.md) for the full sequencing. Short version:

| Feature | Section | Slot in the code |
| --- | --- | --- |
| Kill-criteria override confirm-step UI | Feeds Quarantine's triage flow | The data model (`lib/data/kill-criteria-templates.ts` + `Experiment` fields) is built; no UI reads it yet |
| Quarantine triage view + graduation flow | Quarantine | New `app/quarantine/` route |
| Agentic plan-builder and roadmap generator | Supercomputer | New `app/api/` route — nothing exists yet |
| Case-study generator | (unassigned — likely Laboratory or a new section) | Composes from a record plus its tree. Deterministic composition is preferred over a model call here — it cannot hallucinate a number that contradicts the tree beside it. |

Also out of scope by design: real auth, real multi-tenancy, real platform integrations.

## Design system

Tokens live in `app/globals.css`. The direction is a laboratory record rather than a
marketing dashboard — Stripe/Vercel-inspired restraint, pale paper and ink type in light
mode, data-dense but never cluttered, monospace for anything that is a measurement or an
identifier. Dark mode extends the same token structure rather than introducing a second
system.

Colour is rationed and always semantic — navy for franchise, ochre for loonshot (always drawn
with a dashed edge, because its boundaries genuinely are provisional), blue for running, green
for won, rust for lost, and violet exactly once, on the pre-registration stamp. Taxonomy is
carried by chips, state by glyph marks, so the two channels never compete inside one card.

The tree reuses the won/lost pair for effect direction and stays neutral wherever an interval
straddles zero, so the sign is never asserted where it cannot be called. It introduces no new
colour, and node chrome is neutral so nothing competes with the effect.

If a new colour seems necessary, take one away first.
