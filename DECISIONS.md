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
- Real multi-tenancy, auth, brand-switching permission systems. Seed 2-3
  fabricated brands in one instance; no login flows.
- Multi-model routing / cost optimization (e.g. routing to Kimi for cheaper
  tokens). Wire up **one** external model call for mockup generation if time
  allows (mirrors Replit Design's own multi-model positioning — nice thematic
  touch — but keep it to one model, not a router).
- Portfolio-level CEO/CMO rollup dashboards. Mention as roadmap only.
- "Artists and soldiers" (Loonshots org-culture concept) — doesn't map cleanly
  onto an experiment record; skip rather than force it in as unused chrome.

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

## Status

This is a tinkering/exploration build, not a shipping product yet. Today/
tomorrow's session with Claude Code is meant to produce a working, demoable
skeleton the founder can react to — not a finished designathon submission. Full
designathon scoping (exact demo script, timing, final polish pass) comes after
there's a working thing to look at.
