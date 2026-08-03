# DECISIONS.md — Marketers Lab

A running log of what this project is, why it's shaped the way it is, and what was
deliberately cut. Update this file whenever a scoping decision changes — it's the
source of truth for "why does the data model look like this" six weeks from now.

---

## What this is

A marketer's experimentation lab: a standalone tool that takes a marketing
experiment from idea → scoped plan → running test → tree-based results analysis →
learnings → next experiment. Built for a Replit Designathon submission, judged on
UI/UX and features, not backend integration depth.

It is **not** a rebuild of the founder's existing "Growth OS" project. It's a
separate, fresh codebase, narrated in the pitch as the natural next evolution of
that system, but built clean so 100% of demo-visible code is fresh work — this
matters both for designathon eligibility optics and for build-time focus (see
"Repo strategy" below).

## Positioning: what problem this solves that other tools don't

Mapped against adjacent tools before starting, so the pitch has a clean answer to
"isn't this just X":

- **Motion** (creative intelligence platform) — breaks down ad performance by
  creative element, after the fact. Scoped to paid creative only. No experiment
  design/rigor layer, no cross-touchpoint taxonomy, no agentic plan-builder.
- **Runneth** (creative flywheel: Ideate → Brief → Create → Launch → Analyze,
  integrating Notion/Asana/Canva/Figma/ad platforms/analytics) — a content
  **production** loop. Its "Analyze" step is one node in a workflow; in this
  product, analysis-with-rigor is the entire subject.
- **Conductrics / enterprise CRO platforms** (Convert, VWO, Kameleoon, Statsig) —
  real statistical engines, but built for teams with dedicated CRO/data-science
  resources, no dual-audience simple/deep UX, no agentic plan generation, no
  loonshot-vs-franchise rigor differentiation.

**One-line pitch when asked about overlap:** "Runneth orchestrates the production
loop — idea to shipped asset. Motion tells you which creative element won after
the test. This is the lab in between — where a marketer designs the experiment
with real statistical rigor, watches it run, and gets the tree that explains why,
across any touchpoint, not just ad creative."

## Core concept

Not a dashboard. A **lab** — the place a marketer goes to design an experiment
before it runs, understand *why* it won or lost after it runs (not just that it
did), and get help generating the next one from what was learned. Built to hold
two use cases in the same system, not as separate modes:

1. A single marketer at a startup, running experiments across touchpoints.
2. An agency or holding company (e.g. CSC-Generation-style) running experiments
   across multiple brands/clients, wanting to know which learnings are
   brand-specific noise vs. patterns that hold across brands.

These are **the same engine**, not two products. Brand is just another taxonomy
dimension — a solo marketer's instance has one brand; an agency's has several. No
separate "agency mode" toggle, no separate code path.

## The four-axis taxonomy

Every experiment is tagged along four dimensions. This is the ceiling — resist
adding a fifth without a very strong reason. The whole pitch depends on staying
legible in a 3-minute demo, not becoming a spreadsheet with tags.

1. **Touchpoint** — paid media, CRM, PDP, offline (extensible, but these four
   ship in the demo).
2. **Loop stage** — where the experiment sits in the idea-to-shipped lifecycle.
   Named "Loops" deliberately, both because the founder likes the word and
   because it double-serves two reference concepts: the Runneth-style production
   lifecycle (ideate → brief → create → launch → analyze) AND Safi Bahcall's
   loonshot/franchise feedback-loop framing (see below). Stages: Ideate, Brief,
   Create, Launch, Analyze — deliberately mirrors the Runneth wheel so the visual
   metaphor is instantly legible to anyone who's seen that kind of diagram.
3. **Franchise vs. Loonshot** — borrowed directly from Safi Bahcall's *Loonshots*.
   Not a cosmetic label: it changes the rigor dial's *defaults*.
   - **Franchise** experiments (incremental — button color, subject line copy):
     tight kill criteria, dies fast on weak signal. This is correct behavior for
     this category.
   - **Loonshot** experiments (genuinely novel — new channel, new offer
     mechanic): looser kill criteria, longer runway, judged partly on "did we
     learn something structurally useful" rather than purely win/loss against
     control. Bahcall's core argument is that using franchise evaluation
     criteria on loonshots kills good ideas before they can prove out — this
     tag is the product's way of encoding that discipline.
4. **Brand/client** — which brand or client this experiment belongs to. A single
   marketer's instance has one; an agency's has several. This is what makes the
   cross-brand pattern view possible.

## Rigor dial (simple ↔ deep)

Same experiment, two depths, toggled by the viewer's current need — not gated by
role. An operator checking status on Monday and diagnosing an anomaly on
Wednesday is the same person; this is a view switcher, not a permission system.

- **Simple view:** hypothesis, lift, verdict, one sentence. This is what the
  majority of experiments (mostly franchise-tagged) actually need.
- **Deep view:** same experiment, now showing power calculation, minimum
  detectable effect, segment decision tree, kill criteria as pre-registered
  *before* the test launched (not retrofitted after).

Pharma/MBA-case-study framing: the rigor exists so it's *available* when
warranted, not forced on every test. Most experiments don't need the deep view.
Some absolutely do. Both cases matter.

## Decision-tree visualization (the centerpiece)

The single most differentiated piece and the thing that most needs to look
excellent, since it's the demo's centerpiece. Not a report buried in an appendix —
the primary UI for understanding *why* a result happened, not just that it
happened.

- Built from a CART-style decision tree (same family as the reference image the
  founder shared — a scikit-learn-style classifier tree).
- Rendered as an interactive tree: click a node, see the sub-population, split
  variable, sample size, and effect at that node.
- The payoff moment: showing that an experiment's topline "win" was actually
  driven entirely by one segment (e.g. mobile users under 35 with 2+ prior
  sessions) and reversed or was flat elsewhere. This is what "pharma-grade rigor,
  legible to everyone" actually looks like in the product, not just in the pitch.
- Brand is available as a split variable, which is what makes the cross-brand
  pattern view (below) mostly free once the base tree view is built.

### How the tree got built (Pass 2)

Four decisions worth not re-litigating later:

- **Connectors are CSS borders on pseudo-elements, not a measured SVG overlay.**
  A measured layout would need refs and a layout effect, and the React Compiler
  rules in this repo make `setState` in an effect an error. More importantly, the
  border approach is what lets the *same markup* be a left-to-right dendrogram on
  a desktop and an indented outline on a phone — a phone is too narrow for a
  dendrogram well before it is too narrow to fit one, so the small layout is a
  different form, not a shrunken one. Breakpoint is `lg`.
- **Every node is a forest-plot row on one shared scale.** Point estimate, 95%
  interval, zero. The question at a node is "does this interval clear zero", not
  "how tall is this bar" — and per-node scales would let a −1.9% and a +14.6%
  look the same size, which is exactly the misreading the tree exists to prevent.
  Neutral tone means "the interval straddles zero", never "the effect is small".
- **The reversal is derived, not tagged.** `findReversal` in `lib/segments.ts`
  looks for the largest leaf that moved significantly against the topline's sign.
  Nothing in the seed data flags it. That matters because Pass 4 adds brand as a
  split variable, and the same function will find brand-specific reversals for
  free.
- **A population band under the tree, leaves laid end to end at true share.**
  The fastest read in the view: how much of the test actually sat in the segment
  that went the other way, drawn to scale rather than asserted in a sentence.

## Cross-brand pattern view (the agency/holding-company case)

The feature that a single-marketer tool structurally cannot offer, and the
strongest evidence for the "beyond Motion" and "holding company" pitch.

- Aggregates a given experiment *type* (e.g. "checkout discount test") across
  multiple brands.
- Shows: did the effect and the driving segment hold across brands, or was it
  brand-specific? An aggregated tree with brand as a split variable answers this
  directly — if brand is a high-importance split, the pattern doesn't
  generalize; if it isn't, it does.
- This is a small technical add on top of the base tree (brand as one more
  categorical feature) for a large narrative payoff — don't build separate
  infrastructure for it.
### How the pattern view got built (Pass 4)

- **A family is derived from the title, not from a new field.** Four taxonomy
  axes is the ceiling, and "which test is this a replication of" is a join key
  rather than a browsing axis — so it earns no schema change. Same title,
  different brand, same test. The cost is that retitling a record silently
  removes it from its family; that is written down in AGENTS.md.
- **Heterogeneity is the answer, so it is the headline.** "Does this pattern
  generalise" is not an adjective, it is I². The page leads with the pooled
  estimate and I² together, because either one alone is misleading — a pooled
  +0.9% looks like a small win until you see that 94% of the spread behind it is
  real brand difference.
- **Inverse-variance, not n-weighted.** An n-weighted average of the three runs
  gives +2.2% and looks like a modest win. Weighting by precision gives +0.9%
  with an interval that touches zero, which is the honest read. Using the wrong
  weighting here would have produced exactly the false confidence this product
  exists to prevent.
- **The tree component is reused unchanged.** The pooled tree is a real
  `SegmentNode` with `split: "Brand"` — ids namespaced per brand and shares
  renormalised to the pooled population — so `pathTo`, `findReversals` and the
  shared scale all work on it with no special-casing. That is what "brand is one
  more split variable" is supposed to mean, and it only cost a builder function.

- **The dataset for it is already seeded.** The checkout-threshold test runs at
  all three brands — `EXP-0112` (Sundry), `EXP-0116` (Marlow & Field), `EXP-0123`
  (Ridgeline) — with the same design and the same root split variable, so the
  three trees are readable against each other. They partly agree: the
  near-threshold branch lifts at all three. They partly disagree, and the
  disagreement is the point — at Sundry the effect reverses on mobile, at Marlow
  it reverses for subscribers who already had free delivery, and at Ridgeline the
  near-threshold branch is only 8% of the population so the mechanic has nowhere
  to work. Do not "tidy" these into agreeing.

## Agentic features

Two agentic surfaces, both are the same underlying engine called at different
points in the lifecycle — not two separate features to build:

1. **Plan-builder:** input industry, company stage, budget, touchpoint → AI
   generates 2-3 ranked experiment designs, each with hypothesis, expected
   power/sample size, franchise-or-loonshot classification, and kill criteria
   pre-assigned before the experiment would launch.
2. **Roadmap generator:** run the same engine against a completed experiment's
   results (including its tree output and loonshot/franchise diagnostic) to
   propose what to test next. Uses the "phase transition" idea from Loonshots —
   surfacing *which structural lever* drove the result (segment, channel, offer
   mechanic, timing), not just restating the headline lift — to inform the next
   hypothesis.

### How the agentic surfaces got built (Pass D)

Built as one route (`/supercomputer`) with a mode switch rather than two, which is
what "same engine, two entry points" has to look like in the UI to stay true. Four
decisions worth not re-litigating:

- **The fallback is mandatory, not a nicety.** No key, rate limit, timeout or
  malformed response may reach the client as an error state. `lib/generate/fallback.ts`
  composes from the real request inputs or the real segment tree, so a degraded
  response still reads as work done for *this* input. A demo that can fail live on
  someone else's rate limit is not a demo.
- **The model never sets `rigor_tier` or `loop_stage`.** Both are derived in
  `lib/generate/validate.ts` — `rigor_tier` from `RISK_BY[risk_category].rigor_default`,
  `loop_stage` pinned to `"brief"`. That makes "loonshot with franchise-tight kill
  criteria" structurally impossible rather than a bug to notice later, which is the
  whole point of the franchise/loonshot tag changing defaults.
- **The roadmap generator is handed facts, not prose.** `findDriver` and `findReversal`
  already carry the "which segment actually drove this" analysis; `lib/generate/facts.ts`
  feeds their output in as explicit structural facts. Letting the model re-derive the
  tree from a text summary would have reintroduced exactly the hallucination risk the
  tree exists to remove.
- **A proposal is not a record.** `GeneratedProposal` lives in `lib/generate/types.ts`,
  not `lib/types.ts`, and carries no id, brand or dates. Nothing generated is written to
  the register — that write path is a separate pass with a human confirm step
  (`CONTROL_ROOM_SCOPE.md` §5).

## Case-study generator

Builds a shareable case study from an experiment's full record: hypothesis, plan,
tree/segment findings, franchise-vs-loonshot diagnostic, and outcome. This is the
product's answer to "how does a marketer or agency turn scattered test results
into a reusable, presentable body of learning" — directly serves both the solo
marketer (a portfolio of proof points) and the agency (case studies to show
clients or leadership).

## What's explicitly cut from the live build (roadmap-only, mentioned in pitch)

Do not attempt to build these in the designathon window — no visual payoff
relative to effort, and real risk of eating the whole build on infrastructure
judges won't see working live anyway:

- Real API integrations with ad platforms, CRM tools, analytics platforms (Meta,
  Google Ads, GA4, etc.). Fabricate/seed all data instead.
  **Superseded — see "Platform integrations: the cut, reversed" below.** The cut
  still holds for the designathon window itself; what changed is that this is now
  a scoped section with a build plan rather than a permanent no.
- Real multi-tenancy, auth, brand-switching permission systems. Seed 2-3
  fabricated brands in one instance; no login flows.
- Multi-model routing / cost optimization (e.g. routing to Kimi for cheaper
  tokens). Wire up **one** external model call for mockup generation if time
  allows (mirrors Replit Design's own multi-model positioning — nice thematic
  touch — but keep it to one model, not a router).
- Portfolio-level CEO/CMO rollup dashboards. Mention as roadmap only.
- "Artists and soldiers" (Loonshots org-culture concept) — doesn't map cleanly
  onto an experiment record; skip rather than force it in as unused chrome.

## Platform integrations: the cut, reversed

**Original call:** real API integrations with ad platforms were cut outright — no
visual payoff relative to effort, and a real risk of eating the whole build on
infrastructure judges would never see working. That reasoning was correct for the
designathon window and still is.

**What changed:** this is now a scoped section with a build plan rather than a
permanent no. Full scope in [`CONTROL_ROOM_SCOPE.md`](./CONTROL_ROOM_SCOPE.md),
sequenced as Pass F in [`ROADMAP.md`](./ROADMAP.md). The parts worth carrying here,
because they are decisions rather than plans:

- **It's called Field Station, not Control Room.** `control` is already the
  comparison arm in every seeded record's `design.arms`, so a section named Control
  Room collides with the product's most load-bearing word. The replacement metaphor —
  the remote outpost where readings are taken from a population you observe but do
  not control, samples travelling back to the lab and never the other way — states
  the read-only boundary in the name itself, which means no future session has to be
  told the levers don't exist.
- **Read-only is permanent, not a placeholder.** Nothing writes to Meta or Google:
  no pause, no budget change, no "apply recommendation," not even as a disabled
  affordance, because a disabled control reads as a not-yet.
- **No fifth axis, and `lib/types.ts` does not change by a single field.** The whole
  schema lives in `lib/external/`, following the precedent that put `GeneratedProposal`
  in `lib/generate/types.ts` — a proposal isn't a register record, and an ad set isn't
  even a thing this product owns. `paid_media` already exists as a touchpoint;
  `AdPlatform` is not an axis.
- **One write path, and it lands in Quarantine.** A flagged ad set drafts a proposal;
  a human confirming it creates a `planned` record with `kill_criteria.registered_at`
  *unset*. A machine-stamped registration is a timestamp, not a pre-registration — so
  the record sits in Quarantine until a person accepts or overrides the inherited
  criteria. This is why Pass C blocks that sub-pass.
- **The infrastructure honesty.** Everything except the final sub-pass runs off
  fabricated accounts and needs no backend, which keeps this codebase's no-database
  promise intact. Real OAuth does not: it needs a writable store, encrypted token
  storage and an identity to hang tokens off, none of which has any precedent here.
  That sub-pass is where the "no database, no auth" line gets formally retired, and
  whether it belongs in this repo at all or in the founder's Growth OS (see "Repo
  strategy" below) is still open. The multi-tenancy cut above is *not* reversed —
  single-instance is the scoped shape.

`CONTROL_ROOM_SCOPE.md`'s open questions are still open — naming, sequencing against
Pass C, and several normalization calls (Meta's conversion action type, multi-currency,
attribution windows) need the founder before F1 starts.

## Repo strategy

Build in a **fresh, standalone Replit project** — not on top of the founder's
existing Growth OS codebase, and not in parallel with it.

Reasoning:
- Designathon is judged on UI/UX and features. A fresh repo lets every decision
  optimize for "does this look and feel excellent in 3 minutes" without dragging
  along real data models, auth, or constraints that exist for production reasons
  but add zero visual payoff.
- Sequential, not parallel, with the founder's real Growth OS: build the
  designathon version clean first; after the event, port whichever pieces worked
  into the real system as its actual v2 upgrade. Splitting attention between "is
  this demo excellent" and "does this break production" during a short build
  window makes both worse.
- Safer under whatever the designathon's actual (unconfirmed) rules turn out to
  be re: extensions of prior work vs. net-new builds — narrate it as an evolution
  in the pitch, but the code itself is new.

## Naming

Product name: **Marketers Lab**. The founder already owns the domain and is
keeping the name. Close variants (Marketer's Lab, The Marketing Lab) are in use
by a few smaller, unrelated operations (a digital marketing agency, a content
studio, a UK marketer community/newsletter) — none registered as trademarks for
software, and the term is generic enough that this isn't a legal concern.

## Observatory redesign: visual direction and nav regrouping

Prompted by a set of reference screenshots (a denser, more conventional SaaS
look — masthead bar, stat tiles, grouped sidebar, badge-heavy cards) that the
founder wants the product to move toward. Three decisions worth recording so
the next session doesn't read the "restraint, not a marketing dashboard" line
in the Design system section above and assume the screenshots were rejected:

- **The visual direction changed; the conventions didn't.** Observatory
  gained a masthead (last-synced timestamp, a "Brief new experiment" link
  into Supercomputer) and a stat-tile strip, and cards gained a
  timeline/owner meta row — all read off real fields, nothing fabricated for
  density's sake ("Cross-brand patterns" is `FAMILIES.length`; "Loonshots
  live" is a real filter; there is no inverse for "confidence %" or "Q3
  velocity" in the data model, so those reference-screenshot tiles were
  dropped rather than faked). Colour stays rationed exactly as documented
  above — the new stat tiles reuse existing semantic tokens (`live`, `won`,
  `stopped`, `loonshot`) rather than introducing new ones, and violet stays
  spent on the pre-registration stamp alone.
- **The sidebar is now two labeled groups, not six flat rows.** *Signal*
  (Observatory, Vivarium) is where you watch the register as it stands.
  *Protocol* (Quarantine, Supercomputer) is where you do something to it —
  clear a record to launch, or generate one. "Protocol" doubles deliberately
  as the pre-registration term already used for kill criteria, the same kind
  of double duty "Loops" already does for the loop-stage axis (see above).
  Laboratory and Microscope are no longer listed in the sidebar at all —
  Pass A (`ROADMAP.md`) originally shipped them as context-aware but
  *disabled* rows ("Open a record first"); a row that's dead until you've
  already navigated somewhere else isn't navigation, so they were removed
  outright rather than kept disabled. Both stay fully reachable — every card
  links into Microscope, and Microscope/Laboratory cross-link to each other
  once you're on a record — the sidebar just isn't one of the paths in.
- **The pipeline-priority tree (`components/priority-tree.tsx`) is a
  second, unrelated tree, not a variant of the segment tree.** The segment
  tree (`components/segment-tree.tsx`, `lib/segments.ts`) answers "why did
  this concluded experiment move the way it did" from a `SegmentNode` of
  effects and intervals. The priority tree answers "what should run next" by
  grouping the *not-yet-concluded* register (`lib/priority.ts`) by loop stage
  then risk category, so a stage with nothing in it, or a stage running only
  franchise or only loonshot work, reads as a visible gap rather than
  something you have to notice yourself — same "compute the prompt, don't
  assert it" discipline as `findReversal`, applied to portfolio composition
  instead of a single experiment's sub-populations. It reuses the segment
  tree's connector CSS (`.tree-sub`/`.tree-cell`/`.tree-kids`/`.tree-branch`
  in `app/globals.css`) so the two read as the same visual family, but the
  node data shapes don't unify — a stage bucket has no effect or interval to
  show, so forcing it through `SegmentNode` would mean fabricating one. Live
  as a second view on Observatory (`Cards` / `Priority tree`, a
  `SegmentedControl`), not a new route.

## Status

This is a tinkering/exploration build, not a shipping product yet. Today/
tomorrow's session with Claude Code is meant to produce a working, demoable
skeleton the founder can react to — not a finished designathon submission. Full
designathon scoping (exact demo script, timing, final polish pass) comes after
there's a working thing to look at.
