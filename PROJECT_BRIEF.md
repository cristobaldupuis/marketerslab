# PROJECT_BRIEF.md — Marketers Lab

Extensive context document. Read this alongside DECISIONS.md before starting
work. DECISIONS.md is the terse source-of-truth log; this is the fuller
narrative for onboarding a session that doesn't have the original conversation.

---

## The pitch, in one paragraph

Marketers Lab is a marketer's experimentation lab — the place to design an experiment
with real statistical rigor, watch it run, and understand *why* it won or lost
across any touchpoint (paid, CRM, PDP, offline), not just ad creative. It brings
pharma/MBA-case-study-grade decision-making to marketing experimentation, but
scales the rigor to the stakes: light-touch for a subject-line test, full
segment-tree analysis and pre-registered kill criteria for a pricing test. It
works the same way for a solo startup marketer and for an agency running the same
kind of test across a dozen brands — brand is just another dimension of the
system, not a separate product tier.

## Who this is for, and the two use cases it must hold simultaneously

1. **Solo/small-team marketer** at a startup: one brand, wants an
   experimentation system with real rigor without needing a data science team to
   run it. The plan-builder (industry/stage/budget → ranked experiment plan)
   does a lot of the heavy lifting here.
2. **Agency or holding company** (the founder specifically referenced a
   CSC-Generation-style structure) running the same kinds of tests across
   multiple brands/clients: wants to know which learnings are brand-specific
   noise and which are patterns that generalize. This is the cross-brand pattern
   view's whole reason for existing.

These must be **the same system**, differing only in how many brands are seeded
into the taxonomy — not two products, not two UIs, not a toggle between "startup
mode" and "agency mode."

## The reference decision-tree image (context for why trees are the centerpiece)

The founder shared a scikit-learn-style CART decision tree (diabetes-risk
prediction, splitting on BMI/HbA1c/age/blood glucose/hypertension) as a visual
reference. The point of that reference wasn't the medical content — it was the
*shape*: a tree that shows exactly which sub-population drove an outcome, and
lets you trace the reasoning path node by node. That's the gap in most marketing
experimentation tools: they report a topline lift number, not the reasoning tree
that explains which segment actually drove it, or whether the effect reversed for
a different segment entirely. This product makes that tree the primary way
results are understood, not a buried statistical appendix.

## Landscape check (why this isn't already built)

Explicitly researched before scoping, so the pitch has a real answer rather than
an assumed one:

- **Motion** — real product, does creative-performance breakdown by ad element
  (hooks, formats, messaging) after a test runs. Adjacent, but scoped to paid
  creative only; no experiment-design rigor layer, no cross-touchpoint taxonomy,
  no franchise/loonshot distinction, no agentic plan-builder, no cross-brand
  pattern view.
- **Runneth** — a content *production* flywheel (Ideate → Brief → Create →
  Launch → Analyze) integrating tools like Notion, Asana, Canva, Figma, ad
  platforms, and analytics platforms. It's workflow orchestration for getting
  creative made and shipped. Its "Analyze" step is one node in five; in Marketers Lab,
  rigorous analysis is the entire product.
- **Conductrics** — genuinely close on the "human-readable decision tree, not a
  black box" philosophy, but it's pure A/B testing/personalization
  infrastructure, not a marketer-facing planning and case-study tool.
- **Enterprise CRO platforms** (Convert, VWO, Kameleoon, Statsig, Adobe Target)
  — real statistical rigor (Bayesian/frequentist engines, guardrails, cohort
  segmentation), but built for teams with dedicated CRO/data-science headcount,
  not a dual-audience "simple by default, deep when warranted" experience, and
  none combine this with agentic plan generation or loonshot-style
  rigor-by-risk-category.

No single existing tool combines: multi-touchpoint taxonomy + tree-based
subgroup visualization as the primary UI + a simple/deep rigor dial serving both
operator and analyst in one view + an agentic plan/roadmap generator + a
cross-brand pattern view for agencies. That combination is the whitespace.

## Intellectual scaffolding: Safi Bahcall's *Loonshots*

Two ideas from the book are load-bearing in the product, not just pitch flavor:

1. **Franchise vs. loonshot needs different evaluation criteria.** Bahcall's
   central claim is that the same rigorous evaluation that correctly kills a bad
   incremental idea will also kill a genuinely novel idea before it's had a
   chance to prove out — because loonshots look bad on early, small-sample
   signal by nature. Marketers Lab encodes this directly: an experiment's
   franchise/loonshot tag changes the rigor dial's *defaults* (tighter kill
   criteria and fast death for franchise; looser kill criteria, longer runway,
   and evaluation partly on "did we learn something structurally useful" for
   loonshot).
2. **The lever, not the headline.** Bahcall's diagnostic instinct is to find the
   specific structural rule change that shifted an outcome, not just to restate
   that an outcome happened. The roadmap generator uses this framing: instead of
   just summarizing "here's what we learned," it surfaces *which lever* drove
   the result (segment, channel, offer mechanic, timing) to inform the next
   hypothesis.

Deliberately **not** built in: "artists and soldiers" (org-culture framing that
doesn't map onto an experiment record — would be unused chrome if forced in).

The "Loops" naming for the lifecycle-stage taxonomy axis deliberately does double
duty: it visually mirrors the Runneth-style Ideate→Brief→Create→Launch→Analyze
wheel (so it's instantly legible to anyone who's seen that kind of diagram) while
also nodding to Bahcall's feedback-loop framing between loonshots and the
franchise business. Same word, both references coherent — worth using in the
demo narration, not just internally.

## The taxonomy (four axes — see DECISIONS.md for full detail)

1. Touchpoint (paid media / CRM / PDP / offline)
2. Loop stage (Ideate / Brief / Create / Launch / Analyze)
3. Franchise vs. Loonshot
4. Brand/client

Four is the ceiling for the demo. Do not add a fifth axis without strong
justification — legibility in a 3-minute demo is a harder constraint than
feature completeness.

## Feature list, in build priority order

1. **Taxonomy + seeded dataset** — foundation. Fabricated experiments across all
   four axes, at least 2-3 brands, enough spread to make every other feature
   demonstrable. List/filter UI.
2. **Rigor dial (simple ↔ deep)** — same experiment, toggled depth. Simple:
   hypothesis/lift/verdict/one sentence. Deep: power calc, MDE, tree, kill
   criteria shown as pre-registered.
3. **Decision tree visualization** — the centerpiece. Interactive, click-to-drill
   nodes, segment detail on click, one experiment where the topline result is
   clearly explained (or contradicted) by a specific segment.
4. **Franchise/loonshot rigor defaults** — tag changes what "the deep view"
   actually asks for and how kill criteria are framed.
5. **Cross-brand pattern view** — aggregate one experiment type across brands,
   brand as a tree split variable, showing pattern-holds vs. brand-specific.
6. **Agentic plan-builder** — industry/stage/budget/touchpoint input →
   AI-generated ranked experiment plans with hypothesis, power, franchise/
   loonshot tag, and kill criteria.
7. **Roadmap generator** — same engine, run against a completed experiment's
   results, proposing next tests, framed around "which lever drove this."
8. **Case-study generator** — turns a full experiment record (plan + tree +
   franchise/loonshot diagnostic + outcome) into a shareable write-up. Serves
   both the solo marketer (portfolio of proof points) and the agency (client/
   leadership-facing case studies).
9. *(Optional, time-permitting)* One live external model call for creative
   mockup generation on an experiment's creative slot — thematically nice
   (mirrors Replit Design's own multi-model positioning) but not load-bearing.
   Keep to one model, not a router; do not build multi-model cost-routing.

## Explicitly out of scope for this build (see DECISIONS.md for reasoning)

- Real API integrations with ad/CRM/analytics platforms — **superseded.** Still out of
  scope for the designathon window, but no longer a permanent no: this is now the Field
  Station section, scoped in `CONTROL_ROOM_SCOPE.md` and sequenced as Pass F in
  `ROADMAP.md`. Read-only forever; it never writes to a live ad account. See "Platform
  integrations: the cut, reversed" in DECISIONS.md.
- Real multi-tenancy/auth
- Multi-model routing for cost optimization
- CEO/CMO portfolio rollup dashboards
- "Artists and soldiers" framing

## Demo script (rough shape, subject to revision once built)

1. Open on the taxonomy list — a handful of experiments across brands and
   touchpoints. Establishes "this is a real system," ~10 seconds.
2. Click into a specific experiment (a checkout discount test is a good
   fabricated example — grocery/DTC-flavored). Show simple view: verdict, lift,
   done.
3. Flip the rigor dial to deep. Tree renders. Click the node where the effect
   reverses or concentrates in one segment. This is the "wait, that's actually
   rigorous" beat.
4. Show the franchise/loonshot tag and how it shaped the kill criteria that were
   set *before* the test launched.
5. Jump to the cross-brand pattern view: same experiment type across 2-3 brands,
   showing where the pattern held and where it didn't.
6. Close on the roadmap generator proposing the next test based on the lever
   that actually drove this result.

## Status and immediate next step

This is a tinkering session, not a finished submission. The immediate goal is a
working, demoable skeleton built with Claude Code today/tomorrow, that the
founder can react to before finalizing the actual designathon scope, timing, and
polish pass. Build order should follow the priority list above, roughly two
passes:

- **Pass 1:** taxonomy, seeded dataset, rigor dial shell (no tree yet). *Done.*
- **Pass 2:** decision tree visualization (its own session — data viz problem,
  keep separate from agentic-feature work to avoid muddying context). *Done.*
- **Pass 3:** agentic plan-builder + roadmap generator (LLM-call orchestration —
  different problem type from Pass 2, deserves its own session). *Done* — shipped
  at `/supercomputer` with one server-side model call and a mandatory seeded
  fallback; this is Pass D in `ROADMAP.md`.
- **Pass 4:** cross-brand pattern view + case-study generator, once the tree and
  agentic pieces both exist to draw from. *Pattern view done; case-study
  generator not started.*

The original four-pass plan above is superseded as a sequencing document. Current
ordering lives in [`ROADMAP.md`](./ROADMAP.md), which carries the section
restructuring (Passes A–E) and what remains: Quarantine (Pass C), Field Station
(Pass F, scoped in [`CONTROL_ROOM_SCOPE.md`](./CONTROL_ROOM_SCOPE.md)), and the
case-study generator.
