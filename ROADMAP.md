# ROADMAP.md — Marketers Lab

Sequencing for the "sections as places/tools of science" restructuring, following the
[frontend structure audit](./DEFINITIONS.md) and the product decisions made since. Read
[`DEFINITIONS.md`](./DEFINITIONS.md) for what each section means before touching its route.

Passes are meant to be done in order — each depends on state the previous pass leaves
behind. Do not start a pass out of sequence without updating this file to say why.

---

## Pass A — Navigation + IA

**Status:** In progress
**Scope:** Medium–large
**Depends on:** Nothing (first pass)

- Persistent left sidebar nav, replacing the current back-link-only navigation. Lists all
  six sections (Observatory, Laboratory, Microscope, Vivarium, Quarantine, Supercomputer).
  Quarantine and Supercomputer render disabled/"coming soon" since their routes don't exist
  yet.
- Dark mode. Does not exist today — this is net-new, not a toggle on top of existing tokens.
  Manual light/dark/system switch in the sidebar, persisted in `localStorage`, defaulting to
  `prefers-color-scheme`. Existing semantic tokens (franchise, loonshot, live, won, lost,
  stopped, stamp) and the ink/rule neutral scale get dark-mode counterparts in
  `app/globals.css`; no new color meanings introduced.
- Route restructuring:
  - `/` → `Observatory` at `/observatory` (root redirects)
  - `/experiments/[id]` (deep-read) + `/patterns/[id]` → merged into `Laboratory` at
    `/laboratory/[id]`, with **Experiment** and **Patterns** sub-tabs
  - `/experiments/[id]` (simple-read) → split out into `Microscope` at `/microscope/[id]`
  - New `Vivarium` at `/vivarium` — filtered view of `status: "running"` records
  - Old routes (`/experiments/[id]`, `/patterns/[id]`) redirect to their new equivalents
    rather than disappearing outright
- Component renames so naming matches the new IA rather than the old "Register" framing:
  - `RegisterView` → `ObservatoryView`
  - `ExperimentDetail` → split into `MicroscopeView` (simple-read) and `LaboratoryView`
    (deep-read + patterns tabs)
  - `PatternView` → folds into `LaboratoryView`'s Patterns tab
  - `ExperimentCard` stays (used across Observatory and Vivarium; name is already
    section-agnostic)

**Watch:** Hardcoded `href`s throughout components (`components/experiment-card.tsx`,
`components/experiment-detail.tsx`, `components/pattern-view.tsx`, `app/layout.tsx`) all
need updating in the same pass — don't ship a partial rename that leaves dead links.

---

## Pass B — Kill-criteria data model

**Status:** Not started
**Scope:** Medium
**Depends on:** Pass A (routes stable enough that Quarantine has somewhere to link into
once Pass C starts)

- New standalone type, `KillCriteriaTemplate`, keyed by Touchpoint × Risk class (not a full
  cross-product — cells may share templates where criteria genuinely don't differ):

  ```ts
  type KillCriteriaTemplate = {
    id: string;
    touchpoint: Touchpoint;
    riskClass: RiskClass;
    minSampleSize: number;
    minRuntimeDays: number;
    maxRuntimeDays: number;
    winThreshold: string; // e.g. "+5% vs control at 95% confidence"
  };
  ```

- `Experiment` gains:

  ```ts
  killCriteriaTemplateId: string;
  killCriteriaOverridden: boolean;
  killCriteriaOverrides?: Partial<KillCriteriaFields>;
  ```

- Mock template data for the touchpoint × risk-class matrix in a new
  `lib/data/kill-criteria-templates.ts`.
- Migrate the 20 existing seeded experiments to reference a template ID instead of (or
  alongside) their current freely-typed `kill_criteria` fields.
- **Does not touch the four-axis taxonomy.** `KillCriteriaTemplate` reads `touchpoint` and
  `riskClass` off the existing axes — it is a lookup table, not a fifth axis.
- Override UX (design now, build later): experiments inherit criteria from their matrix
  cell by default. Editing any inherited value triggers a lightweight confirm step — a
  checkbox acknowledging the deviation, no justification text field. That confirm-step UI
  is **not** in Pass B's scope; Pass B is the data model and migration only.

---

## Pass C — Quarantine

**Status:** Not started
**Scope:** Medium
**Depends on:** Pass B (needs `killCriteriaTemplateId` / `killCriteriaOverridden` to know
who belongs in Quarantine)

- New `/quarantine` route and view.
- Entry logic: an experiment sits in Quarantine if its kill criteria are unconfirmed —
  i.e., not yet explicitly inherited or overridden. This is a genuine workflow state, not a
  filter on top of the register.
- Override confirm-step UI (the checkbox flow described in Pass B).
- Graduation flow: once kill criteria are confirmed, the experiment leaves Quarantine and
  enters the normal register flow (visible in Observatory, eligible for Planned/Running/etc.
  status).

---

## Pass D — Supercomputer

**Status:** Not started
**Scope:** Unscoped
**Depends on:** No hard dependency on B/C, but sequenced last because it's the least
defined and the original build plan (`PROJECT_BRIEF.md`) already treated it as its own
session ("Pass 3... LLM-call orchestration — different problem type... deserves its own
session").

- Agentic plan-builder (industry/stage/budget/touchpoint → ranked experiment plans) and
  roadmap generator (completed experiment → proposed next test). Same underlying engine,
  two entry points.
- No route, component, or data-model decisions made yet. Scope this properly before
  starting rather than inheriting assumptions from this document.

---

## Cross-pass risks to keep watching

Carried forward from the frontend structure audit:

- **Hardcoded routes/links.** Every pass that touches routing needs a full sweep of
  `href="/..."` strings in components, not just the route files themselves.
- **Stale naming.** Component names should track section names as sections are built —
  don't leave a `RegisterView` or `ExperimentDetail` around once its function has moved to
  Observatory/Laboratory/Microscope. Rename in the same pass that moves the functionality,
  not as separate cleanup later.
- **Four-axis taxonomy is locked.** Neither "section" nor `KillCriteriaTemplate` may become
  a fifth taxonomy axis. Section is UI-only; the template matrix reads existing axes.
- **Dark mode is net-new.** It was not scoped or partially built anywhere before Pass A —
  treat every existing color reference in components as needing a dark-mode check, not just
  the token block in `app/globals.css`.
