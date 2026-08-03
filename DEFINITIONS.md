# DEFINITIONS.md — Marketers Lab

Glossary for the "sections as places/tools of science" information architecture. Each
section name is a metaphor for a real place or instrument in a lab — read this before
naming a new component, route, or nav item so the metaphor stays consistent.

Section is an **organizational/UI layer only**. It does not add a fifth axis to the
taxonomy in `lib/types.ts` — see "Things that look arbitrary but are not" in `AGENTS.md`
and the four-axis ceiling in `DECISIONS.md`.

**Not every section is a sidebar row.** The sidebar (`components/sidebar-nav.tsx`) lists
the sections you can land on directly, grouped as *Signal* (Observatory, Vivarium, and
Field Station once built — watch the register, and the live spend, as they stand) and
*Protocol* (Quarantine, Supercomputer — do something to it).
Laboratory and Microscope are real sections with their own routes and definitions below,
but they're reached from a record, not from the sidebar — see their entries for why. Full
reasoning in "Observatory redesign: visual direction and nav regrouping" in `DECISIONS.md`.

---

## Observatory

**Metaphor:** The dome you climb into to see everything in the sky at once — wide field of
view, low detail per object.

**Function:** High-level monitoring. The landing page. Every experiment as a card, filterable
by the four taxonomy axes, ordered by recent activity. Answers "what's in the register and
what state is it in," not "why did any one of these happen." A second view, the pipeline
priority tree, answers a related but different question — "what should run next" — by
grouping the active (not-yet-concluded) register by loop stage then risk category. It is
not the segment/decision tree (that's Laboratory's); see `lib/priority.ts` and
`components/priority-tree.tsx`.

**Route:** `/observatory` (root `/` redirects here)

**Status:** Built (formerly the unnamed "Register" view)

---

## Laboratory

**Metaphor:** The bench where the actual experimental work happens — instruments, notebooks,
the apparatus mid-run.

**Function:** The analysis workspace for a single record and, where relevant, its cross-brand
replications. Two tabs:
- **Experiment** — the design of record, kill criteria as pre-registered, the segment
  decision tree. This is the evidence behind a verdict, not just the verdict.
- **Patterns** — cross-brand aggregation for records that are part of a family (same title,
  multiple brands): pooled effect, heterogeneity (I²), forest plot, tree with brand as the
  root split. Disabled for records with no family.

**Route:** `/laboratory/[id]`

**Status:** Built (merges the former `/experiments/[id]` deep-read and `/patterns/[id]`)

**Not in the sidebar:** only resolves to a real destination once a record is already in
view, so it isn't one of the sidebar's rows — see the note at the top of this file. Reached
from a card, or from Microscope's "Open in Laboratory" prompt; its own header links back to
Microscope on the same record.

---

## Microscope

**Metaphor:** Point it at one slide, get one clear, close-in image. No apparatus, no
notebook — just the specimen.

**Function:** Fast, close inspection of a single record: hypothesis, headline result,
verdict. The read a busy operator needs in ten seconds. Links out to the Laboratory for
anyone who wants the design and evidence behind it.

**Route:** `/microscope/[id]`

**Status:** Built (formerly the "simple" position of the rigor dial on `/experiments/[id]`)

**Not in the sidebar:** same reasoning as Laboratory, above. Reached from any experiment
card across Observatory and Vivarium.

---

## Vivarium

**Metaphor:** The room where live specimens are kept under continuous observation while an
experiment is in progress.

**Function:** Every experiment currently `status: "running"`, isolated from the rest of the
register. Answers "what's live right now" without a filter click.

**Route:** `/vivarium`

**Status:** Built

---

## Field Station

**Metaphor:** The remote outpost where readings are taken from a population you observe but do
not control. Instruments run continuously, samples travel back to the lab, and nothing travels
the other way.

**Function:** Read-only observation of connected ad accounts (Meta, Google Ads), normalized so
one recommendation layer reads both. Answers "what is the live spend actually doing," which no
other section can — every other section reads the register, and the register is what the team
chose to test. Underperforming units are flagged by deterministic rules, narrated by the
Supercomputer's engine, and can be drafted into an experiment that lands in Quarantine. It never
writes to the platforms. That is a permanent boundary, not a not-yet.

**Route:** `/field-station` (planned)

**Status:** Not started. See [`CONTROL_ROOM_SCOPE.md`](./CONTROL_ROOM_SCOPE.md) and
[`ROADMAP.md`](./ROADMAP.md) Pass F.

---

## Quarantine

**Metaphor:** The holding area a new specimen sits in before it's cleared to enter the main
population — not a punishment, a checkpoint.

**Function:** A genuine pre-register workflow state, not a filter or a view. An experiment
sits in Quarantine if it has not yet confirmed its kill criteria — either accepting the
inherited criteria from its Touchpoint × Risk-class template, or consciously overriding
them. Once confirmed, it graduates into the normal register flow (Planned/Running/etc.) and
becomes visible in the Observatory.

**Route:** `/quarantine` (planned)

**Status:** Not started. Depends on the kill-criteria template data model — see
[`ROADMAP.md`](./ROADMAP.md) Pass B and Pass C.

---

## Supercomputer

**Metaphor:** The room you take a hard computational question to and get an answer back —
not a place you work by hand.

**Function:** AI/agentic tooling. The plan-builder (industry/stage/budget → ranked
experiment plan) and the roadmap generator (completed experiment → proposed next test,
framed around which lever drove the result). Both are the same underlying engine called at
different points in the lifecycle, not two separate features.

**Route:** `/supercomputer` (`?tab=roadmap` for the roadmap generator; `?id=` preselects a record)

**Status:** Built. This was "Pass 3" in the original build plan (`PROJECT_BRIEF.md`) and Pass D
in [`ROADMAP.md`](./ROADMAP.md). One server-side model call behind `app/api/generate`, with a
mandatory seeded fallback — see `lib/generate/`.
