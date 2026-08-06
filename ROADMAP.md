# ROADMAP.md — Marketers Lab

Sequencing for the "sections as places/tools of science" restructuring, following the
[frontend structure audit](./DEFINITIONS.md) and the product decisions made since. Read
[`DEFINITIONS.md`](./DEFINITIONS.md) for what each section means before touching its route.

Passes are meant to be done in order — each depends on state the previous pass leaves
behind. Do not start a pass out of sequence without updating this file to say why.

---

## Pass A — Navigation + IA

**Status:** Done
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

**Decisions made while building this pass** (the original scoping note left these open;
recorded here so they're easy to revisit rather than archaeology later):

- **Microscope got its own route**, `/microscope/[id]`, in this pass rather than being
  deferred. The alternative (leaving simple-read at the old `/experiments/[id]` path) would
  have left Laboratory and Microscope inconsistently named for no real savings, and the
  sidebar needed a real destination for Microscope anyway once it's context-aware (see
  below).
- **Old routes redirect**, they don't 404. `/experiments/[id]` → `/microscope/[id]`;
  `/patterns/[id]` → `/laboratory/[id]?tab=patterns`.
- **Dark mode is a manual light/dark/system toggle**, not system-only. Sidebar footer,
  persisted in `localStorage`, using `useSyncExternalStore` rather than an effect (React
  Compiler's `react-hooks/set-state-in-effect` rule rejects the naive
  `useEffect`-plus-`setState` sync pattern — see `components/theme-toggle.tsx`).
- **Quarantine and Supercomputer show in the sidebar now, disabled**, labeled "Coming
  soon," so the six-section IA reads as a whole before Pass C/D exist.
  **Superseded in Pass D and again in Pass C** — Supercomputer shipped first, Quarantine
  second, and `comingSoon` no longer exists in `components/sidebar-nav.tsx`. Quarantine's
  badge slot now carries its live held count.
- **Sidebar's Laboratory/Microscope links are context-aware**: disabled ("Open a record
  first") until you're already viewing one of the two, at which point both links jump to
  the *same record* in the other section — lets you flip Microscope ↔ Laboratory while
  reading rather than dead-ending back at Observatory.
  **Superseded in Pass E** — both were dropped from the sidebar list entirely rather than
  kept as a disabled row. The Microscope ↔ Laboratory cross-navigation this decision
  describes still works, it just lives on the records themselves (`RecordHeader`'s
  back-link, `MicroscopeView`'s "Open in Laboratory" hint) rather than in the sidebar.
- **Laboratory's Patterns tab lives on every family member's URL**, not just the anchor's.
  `familyOf(id)` is computed per-record, so viewing a sibling experiment's Laboratory page
  and switching to Patterns shows the same pooled family data — no forced navigation to
  the anchor record just to see the cross-brand read.

---

## Pass B — Kill-criteria data model

**Status:** Done
**Scope:** Medium
**Depends on:** Pass A (routes stable enough that Quarantine has somewhere to link into
once Pass C starts)

- New standalone type, `KillCriteriaTemplate` (`lib/types.ts`), keyed by touchpoint × risk
  class. Not a full cross-product — CRM shares the `digital-*` templates with paid media,
  since both are high-velocity digital channels with comparable sample accrual:

  ```ts
  interface KillCriteriaTemplate {
    id: string;
    touchpoint: Touchpoint;
    risk_class: RiskClass;
    min_sample_size: number;
    min_runtime_days: number;
    max_runtime_days: number;
    win_threshold: string; // e.g. "+5% vs control at 95% confidence"
  }
  ```

- `Experiment` gained (`lib/types.ts`):

  ```ts
  kill_criteria_template_id: string;
  kill_criteria_overridden: boolean;
  kill_criteria_overrides?: Partial<KillCriteriaFields>;
  ```

- Six templates in `lib/data/kill-criteria-templates.ts` cover all eight touchpoint × risk
  cells (`digital-franchise`, `digital-loonshot`, `pdp-franchise`, `pdp-loonshot`,
  `offline-franchise`, `offline-loonshot`), plus `templateFor()` / `templateIdFor()` lookups
  and a `MATRIX` table showing which cells share a template.
- All 20 seeded experiments in `lib/data/experiments.ts` reference a template ID. Their
  existing freely-typed `kill_criteria` (the pre-registration record, stamp, timeline) is
  untouched — the template reference sits alongside it, not in place of it. Three records
  (`EXP-0130`, `EXP-0128`, `EXP-0143`) carry `kill_criteria_overridden: true` with a
  `max_runtime_days` override, chosen because their `rigor_tier` already diverges from their
  risk category's default — a team reading a franchise test at deep tier or a loonshot at
  standard tier is exactly the situation where the standard runway wouldn't fit either.
- **Does not touch the four-axis taxonomy.** `KillCriteriaTemplate` reads `touchpoint` and
  `risk_class` off the existing axes; `RiskClass` is a type alias for `RiskCategory`, not a
  new value set.
- **Field naming**: the original scoping note used camelCase (`killCriteriaTemplateId`,
  `riskClass` as a distinct field, etc.). Every existing field on `Experiment` and its
  siblings (`brand_id`, `risk_category`, `loop_stage`, `registered_at`, ...) is snake_case,
  so the implementation followed that convention instead
  (`kill_criteria_template_id`, `risk_class`) — an established codebase convention overrides
  an inline sketch of the shape, not a scope change.
- Override UX (design now, build later): experiments inherit criteria from their matrix
  cell by default. Editing any inherited value triggers a lightweight confirm step — a
  checkbox acknowledging the deviation, no justification text field. Pass B was the data
  model and migration only, seeded directly rather than through a UI flow.
  **Built in Pass C**, as specified — `components/quarantine-view.tsx`. Pass C also found
  the gap this entry left open: `kill_criteria_overridden: false` could not tell "inherited
  on purpose" from "never looked at", so confirmation needed a representation of its own
  (`kill_criteria_confirmed_at`). See Pass C's first decision.

---

## Pass C — Quarantine

**Status:** Done
**Scope:** Medium
**Depends on:** Pass B (needs `kill_criteria_template_id` / `kill_criteria_overridden` to
know who belongs in Quarantine)

- New `/quarantine` route (`app/quarantine/page.tsx`, `components/quarantine-view.tsx`),
  and Quarantine is no longer the sidebar's one `comingSoon` row — its badge slot now
  carries a live held count instead of the "Soon" label. `comingSoon` is gone from
  `components/sidebar-nav.tsx` entirely; nothing else used it.
- Entry is one condition, and it lives on the record: `kill_criteria_confirmed_at === null`.
  `lib/quarantine.ts` holds the pools (`registerPool` / `heldPool`), the session store
  behind graduation, and the `useRegister()` hook the three affected surfaces share.
- The confirm step Pass B specified and deferred: criteria are inherited from the record's
  matrix cell, editing any of the four values raises a deviation, and a deviation must be
  acknowledged with a checkbox — no justification text field — before Confirm enables.
  Setting `kill_criteria_overridden` is this UI's job, as Pass B said it would be.
- Five records are held. Two (`EXP-0136`, `EXP-0145`) were already unregistered at ideate
  stage and needed no new data; three are new (`EXP-0146`, `EXP-0149`, `EXP-0151`). All five
  have `launched_at: null`, which the AGENTS.md invariant forces rather than merely permits:
  criteria precede launch, so a record whose criteria are unconfirmed cannot have launched.

**Three decisions made before any UI was written** (they are the actual work of this pass;
recorded here the way A/B/D/E record theirs):

- **"Unconfirmed" gets its own field: `kill_criteria_confirmed_at: string | null` on
  `Experiment`.** Pass B left `kill_criteria_overridden: false` meaning two different things —
  "inherited on purpose" and "nobody has looked at this" — so under the old model Quarantine
  was empty by construction. The tempting zero-cost alternative was to read
  `kill_criteria.registered_at === ""`, which two seeded records already carried. It was
  rejected because those are two different commitments about two different objects:
  `registered_at` stamps *the freely-typed rule*, `kill_criteria_overridden` describes *the
  template relationship*, and the Pass B migration produced exactly the divergence — 17
  records whose prose rule was pre-registered while their template relationship was defaulted
  by a migration, not decided by a person. `EXP-0146` is seeded to hold that divergence open
  on purpose: a rule locked by hand on 16 July, a template cell never reconciled with it.
  Overloading one field to answer both questions would have deleted that state.

  **It is not a fifth taxonomy axis, and the distinction is not a matter of framing.** The
  four axes are browsing dimensions: each has several values, every record carries one for
  life, and the filter bar, the pattern view and the priority tree all group by them. This
  is a one-way gate with two states that flips exactly once, is never filtered on, and no
  record ever moves back through. An axis you can only traverse in one direction, once, is a
  state — the same category as `launched_at` and `concluded_at`, which is also why it is a
  nullable date rather than a boolean: this codebase already spells "has this happened yet"
  as a nullable timestamp, and a boolean could not be read against `launched_at`.

- **Confirming writes nothing, and the page says so in the page.** There is no persistence
  layer to write to. The confirmation lives in a module-scope store in `lib/quarantine.ts`
  for the session — the same module-scope-over-`sessionStorage` reasoning as `lastFilters`
  in `components/observatory-view.tsx`, read through `useSyncExternalStore` so there is no
  `setState` in an effect and no first frame to reconcile. Graduating a record really does
  move it: the Observatory grid, the six stat tiles, the priority tree and the sidebar count
  all update on the next client render, and a reload restores the seeded state. The page
  carries a "How this saves — it doesn't" note rather than a button that implies a write it
  does not make, which is the posture Pass D already takes about proposals.

  The corollary, stated rather than hidden: **the record's own detail views are unchanged by
  a confirmation.** Microscope and Laboratory still render the seeded `kill_criteria`. The
  confirm step shows exactly what it *would* write — the four criteria, `overridden`, the
  overrides map, `confirmed_at`, and the `registered_at` stamp it lands — in a receipt under
  "Cleared this session". Overlaying session state onto the two server-rendered record routes
  would be a persistence layer with extra steps.

- **Held records are excluded from the Observatory, not marked in it.** DEFINITIONS.md says a
  record becomes visible there once it graduates, so a state mark on a card that shouldn't be
  on the page would contradict the definition. Every count on the Observatory therefore reads
  one pool out of `useRegister()` — grid, "N records", all six tiles, `lastSyncedAt`, and the
  priority tree — so a tile cannot disagree with the grid beneath it. The blast radius, checked
  surface by surface:
  - `lib/priority.ts`'s `activeExperiments()` now **takes** the register instead of reading
    `EXPERIMENTS`; `PriorityTree` takes it as a prop. Nothing uncleared is an answer to "what
    should run next."
  - The sidebar's "N brands · M records" reads the register too — it sat directly under a
    number the Observatory was no longer showing.
  - The masthead gains one line, not a seventh tile: "· N held in Quarantine", linking there.
    A held record is invisible, so where it went has to be legible; six tiles in a six-column
    grid is also the shape that survives.
  - **Vivarium is deliberately untouched.** It filters `status: "running"`, and a held record
    has never launched, so it cannot be running. Checked, not assumed.
  - **`lib/patterns.ts` is untouched for a different reason.** Families are derived from
    titles across every record, and a held record has no `segment_tree` to pool, so
    `FAMILIES.length` — the "Cross-brand patterns" tile — is unaffected. The three new records
    carry unique titles so none of them joins or creates a family.

**Seam for Pass F5, per `CONTROL_ROOM_SCOPE.md` §5** — built, not deferred: a Field Station
draft lands as a `planned` record with `kill_criteria.registered_at` unset **and
`kill_criteria_confirmed_at: null`**, and it is held on the second of those. Confirming is what
lands the pre-registration stamp (`CriteriaConfirmation.registered_at`), which is the whole
reason §5 routes the write path through Quarantine rather than Observatory — a machine-stamped
registration is a timestamp, not a pre-registration. F5 itself is not built here.

**Watch:** `RegisteredStamp` / `UnregisteredStamp` moved out of `components/laboratory-view.tsx`
into `components/marks.tsx`, since Quarantine's graduation step is where the stamp is earned and
the Laboratory only reads it back. Violet is still spent on one meaning, in two places — if a
third appears, that is the moment to check it is still the same meaning.

---

## Follow-on — criteria reconciliation

**Status:** Done
**Scope:** Small
**Depends on:** Pass C
**Unlettered on purpose:** Pass F is Field Station, and this is Pass C's own follow-on
rather than a new direction — same reason Pass E's touchpoint-level tree note stays
unlettered.

Pass C's confirm step reads a record's design against its criteria, but only inside
Quarantine — so the check only ever ran on records that had *not* been cleared. Run over
the register it found 16 of 18 records disagreed with the cell they are standardized
against. Full reasoning in "What the checkpoint exposed" in `DECISIONS.md`; this is the
build log.

- **`lib/criteria.ts`** — the check, extracted from `components/quarantine-view.tsx` so
  Quarantine and the Laboratory run one implementation. `effectiveCriteria()` (cell plus
  override), `criteriaFit()`, `disagreements()`, `movedFields()`. Computed, never tagged,
  the same discipline as `findReversal` and `lib/priority.ts`'s prompts — fixing a seeded
  number makes a finding disappear on its own.
- **Runtime is read off `actual_runtime_days ?? planned_runtime_days`.** A maximum is a
  stop rule, so the question is what a test ran to, not what someone wrote down before it
  started. This is why `EXP-0094` is not flagged: it planned 42 days against a 35-day cap
  and was stopped at 28. It is also what surfaces `EXP-0123`, stopped at day 7 against a
  10-day minimum.
- **`ExperimentDesign` gained `randomisation_unit`** (`household` / `visitor` / `order` /
  `geo` / `budget`) — the machine-readable half of the `allocation` prose already on every
  record. `min_sample_size` is only comparable at a user-level unit; a geo- or budget-split
  test does not accrue people per arm, so the reader states that the floor does not apply
  rather than asserting a breach. Not an axis: it sits inside `ExperimentDesign` next to
  `power` and `alpha`, and nothing browses or groups by it.
- **Two seeded overrides fixed.** `EXP-0130` capped at 21 days against a 28-day design it
  is currently running; `EXP-0143` capped at 21 against a 42-day design whose primary
  metric is monthly — its override now runs upward to 42, which is the clearest case in
  the register for what an override is *for*. Pass B chose those three from `rigor_tier`
  divergence without reading the designs.
- **New block on the Laboratory's Kill criteria section**, under the pre-registration
  timeline: the governing criteria, which fields an override moved, and any disagreement —
  with the caveat that cells were assigned after these records were written, so a
  disagreement is an unreconciled record rather than a broken rule.
- `DECISIONS.md` gained a "Kill criteria" section. It had no entry for Pass B or Pass C,
  and it is the file that owns the four-axis ceiling — the place someone would look to
  check whether `kill_criteria_confirmed_at` broke it.

**Watch:** the audit is evidence against Pass B's decision to share the `digital-*`
templates between paid media and CRM — CRM records accrue households in the tens of
thousands, paid-media records accrue acquisitions in the hundreds. Splitting that cell is
a matrix change and a founder call, so it is flagged in `DECISIONS.md`, not made here.

---

## Pass D — Supercomputer

**Status:** Done
**Scope:** Large
**Depends on:** No hard dependency on B/C. Built as its own session, as the original build
plan (`PROJECT_BRIEF.md`) always intended ("Pass 3... LLM-call orchestration — different
problem type... deserves its own session").

- Agentic plan-builder (industry/stage/budget/touchpoint → ranked experiment plans) and
  roadmap generator (completed experiment → proposed next test) at `/supercomputer`, behind
  a `SegmentedControl` mode switch rather than as two routes — same engine, two entry
  points, so the mode switch is the honest shape. `?tab=roadmap` and `?id=` are both
  addressable, which is what lets the Observatory masthead link straight into the
  plan-builder.
- **One server-side model call, and a mandatory fallback.** `app/api/generate/route.ts` is
  the only outbound call in the codebase. No key, rate limit, timeout or malformed response
  may reach the client as an error state — every path ends in a 200 carrying either
  `source: "model"` or `source: "fallback"`, and `lib/generate/fallback.ts` composes the
  fallback from the real request inputs or the real segment tree so it reads as work done
  for this input, not canned copy.
- **A proposal is not a record.** `GeneratedProposal` lives in `lib/generate/types.ts`, not
  `lib/types.ts`, and is deliberately a smaller shape than `Experiment` — no id, no brand,
  no dates. Nothing generated here is written to the register; turning a proposal into a
  record is a separate write path with its own confirm step (Pass F5).
- **The model never sets `rigor_tier` or `loop_stage`.** `lib/generate/validate.ts` derives
  `rigor_tier` from `RISK_BY[risk_category].rigor_default` and pins `loop_stage` to
  `"brief"`, which makes "loonshot with franchise-tight kill criteria" structurally
  impossible rather than a bug to catch later. `touchpoint` and `risk_category` are coerced
  against the taxonomy enums or the proposal is dropped — a silently invented touchpoint is
  worse than one fewer proposal.
- **The roadmap generator is handed facts, not a summary.** `lib/generate/facts.ts` reads
  `findDriver` / `findReversal` / `pathTo` off the record's segment tree and `familyOf` off
  the pattern view, then feeds them in as explicit "Structural fact —" lines. The model
  builds on the lever the code already found rather than re-deriving the analysis from
  prose. Only a `complete` record carrying a `segment_tree` is eligible.
- **Does not touch the four-axis taxonomy.** `lib/generate/*` reads `TOUCHPOINTS` and
  `RISK_CATEGORIES` off `lib/taxonomy.ts`; it adds nothing to them.
- `components/proposal-card.tsx` reuses the register's own chips, marks and loop meter but is
  deliberately not `ExperimentCard` — a proposal has to show its power sketch and kill
  criteria on the card, which the compact register card never does.

**Watch:** `lib/generate/*` is the shared engine the Field Station narrative layer extends
(Pass F4) — `GenerateRequest` is already a discriminated union on `mode`, and the seam is
the facts assembler. Read `CONTROL_ROOM_SCOPE.md` §3 before adding a second one.

---

## Pass E — Observatory redesign & nav regrouping

**Status:** Done
**Scope:** Medium
**Depends on:** Pass A (the six-section IA and sidebar it restructures)

Prompted by reference screenshots showing a denser, more conventional SaaS visual
direction. See "Observatory redesign: visual direction and nav regrouping" in
`DECISIONS.md` for the full reasoning; this is the build-log summary.

- **Sidebar regrouped into two labeled sections**, replacing the flat six-row list:
  *Signal* (Observatory, Vivarium) and *Protocol* (Quarantine, Supercomputer).
  Laboratory and Microscope no longer appear in the sidebar at all — see the
  superseded note on Pass A above. `components/sidebar-nav.tsx` gained small line
  icons per section (`components/nav-icons.tsx`) in place of the two-letter marks,
  and a "Growth science" tagline under the wordmark.
- **New pipeline-priority tree**, a second Observatory view (`Cards` / `Priority
  tree` via `SegmentedControl`) answering "what should run next" — distinct from
  the segment tree; see the DECISIONS.md entry for why these are two separate
  things that happen to share connector CSS. New files: `lib/priority.ts` (pure
  grouping/prompt logic, mirrors `lib/segments.ts`'s style) and
  `components/priority-tree.tsx`.
- **Observatory masthead + stat-tile strip**: last-synced timestamp (real —
  max `updated_at` across the register), a "Brief new experiment" link into
  Supercomputer's plan-builder (no new create-flow was built; this reuses the
  existing agentic plan-builder rather than fabricating a form the data model
  can't persist), and six stat tiles (Running, Planned, Won, Killed, Loonshots
  live, Cross-brand patterns) — all derived, none fabricated.
- **`ExperimentCard` gained a timeline/owner meta row** — "Launched {date}" once
  launched, else "Briefed {date}" off `created_at`, plus an owner initials mark
  (`OwnerMark` in `components/marks.tsx`, round where `BrandMark` is square).
  Deliberately not a live "N days running" figure — that needs a moving "now"
  reference, and `ExperimentCard` renders through a server-rendered path
  (`ObservatoryView` is a client component, but Next still renders it on the
  server for the initial HTML), so a `Date.now()`-based figure risks exactly the
  hydration drift `AGENTS.md` already warns about for date formatting.

**Watch:** the priority tree currently ignores brand and touchpoint as split
variables — it only reads loop stage and risk category. Adding a third level
(touchpoint) is a natural follow-on pass if the active register grows past what
two levels can show cleanly; not needed yet at 20 seeded records. This note
originally called that work "a natural Pass F" — Pass F is Field Station (below),
so the third level stays unlettered until someone picks it up.

---

## Pass F — Field Station

**Status:** Not started
**Scope:** Large — broken into F1–F6
**Depends on:** Pass D for the shared generation engine (F4), and Pass C for the Quarantine
hand-off (F5). **Both are now Done** — F5's blocker is cleared, and the field it lands on is
`kill_criteria_confirmed_at: null`.

Scoped in full in [`CONTROL_ROOM_SCOPE.md`](./CONTROL_ROOM_SCOPE.md). Do not re-derive its
calls from this summary — it is the source of truth for the schema, the engine seam, the
OAuth gap and the write path.

- Read-only observation of connected ad accounts (Meta, Google Ads), normalized so one
  recommendation layer reads both. Named **Field Station**, not "Control Room": `control` is
  already the comparison arm in every record's `design.arms`, and a control room implies
  levers this section will never have.
- **Never writes to the platforms.** Read-only is a permanent product boundary, not a
  placeholder — no pause, no budget change, no "apply recommendation", not even as a
  disabled affordance.
- **`lib/types.ts` does not change.** The whole schema lives in `lib/external/`, following
  the `lib/generate/types.ts` precedent — an ad set is not a register record. No fifth
  taxonomy axis under any framing; `paid_media` already exists as a touchpoint.
- The single write path is a drafted proposal landing in Quarantine with
  `kill_criteria.registered_at` **unset** — a machine-stamped registration is a timestamp,
  not a pre-registration. That is why the hand-off target is Quarantine. Pass C built the
  seam: a draft is held on `kill_criteria_confirmed_at: null`, and confirming is what lands
  the stamp.

| Sub-pass | Scope | Depends on |
| --- | --- | --- |
| **F1** | Normalized schema + fabricated accounts, derived metric readers | nothing |
| **F2** | `/field-station` route and read-only UI | F1 |
| **F3** | Deterministic flagging heuristics (`lib/external/rules.ts`) | F1, sequence after F2 |
| **F4** | LLM narrative layer — `mode: "field_station"` on the Pass D engine | F3 |
| **F5** | The Quarantine hand-off write path | F4 and Pass C (Done) |
| **F6** | Real OAuth and sync | a persistence decision, plus platform review lead times |

**Watch:** F6 is the only sub-pass that needs infrastructure this codebase has never had — a
writable store, encrypted token storage, and an identity to hang tokens off. F1–F5 are
sequenced so they demo completely off fabricated accounts without it, the same move
`lib/generate/fallback.ts` already makes for the model call. Note also that Google Ads ships
no read-only OAuth scope; read-only there is code-level discipline, not a grant-level
guarantee. See `CONTROL_ROOM_SCOPE.md` §4 and its open questions before starting F6.

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
  a fifth taxonomy axis. Section is UI-only; the template matrix reads existing axes. The
  same holds for Pass F: `AdPlatform` is not an axis, and `ConnectedAccount.brand_id` points
  at the existing brand axis rather than extending it.
- **Dark mode is net-new.** It was not scoped or partially built anywhere before Pass A —
  treat every existing color reference in components as needing a dark-mode check, not just
  the token block in `app/globals.css`.
