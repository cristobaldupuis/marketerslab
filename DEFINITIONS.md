# DEFINITIONS.md — Marketers Lab

Glossary for the "sections as places/tools of science" information architecture. Each
section name is a metaphor for a real place or instrument in a lab — read this before
naming a new component, route, or nav item so the metaphor stays consistent.

Section is an **organizational/UI layer only**. It does not add a fifth axis to the
taxonomy in `lib/types.ts` — see "Things that look arbitrary but are not" in `AGENTS.md`
and the four-axis ceiling in `DECISIONS.md`.

---

## Observatory

**Metaphor:** The dome you climb into to see everything in the sky at once — wide field of
view, low detail per object.

**Function:** High-level monitoring. The landing page. Every experiment as a card, filterable
by the four taxonomy axes, ordered by recent activity. Answers "what's in the register and
what state is it in," not "why did any one of these happen."

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

---

## Microscope

**Metaphor:** Point it at one slide, get one clear, close-in image. No apparatus, no
notebook — just the specimen.

**Function:** Fast, close inspection of a single record: hypothesis, headline result,
verdict. The read a busy operator needs in ten seconds. Links out to the Laboratory for
anyone who wants the design and evidence behind it.

**Route:** `/microscope/[id]`

**Status:** Built (formerly the "simple" position of the rigor dial on `/experiments/[id]`)

---

## Vivarium

**Metaphor:** The room where live specimens are kept under continuous observation while an
experiment is in progress.

**Function:** Every experiment currently `status: "running"`, isolated from the rest of the
register. Answers "what's live right now" without a filter click.

**Route:** `/vivarium`

**Status:** Built

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

**Route:** Not yet routed.

**Status:** Not started. Deferred — this was "Pass 3" in the original build plan
(`PROJECT_BRIEF.md`) and remains unscoped for the current restructuring effort. Shown as
disabled in the sidebar so the full six-section IA is visible ahead of the build.
