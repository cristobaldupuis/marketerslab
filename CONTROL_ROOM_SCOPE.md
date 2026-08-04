# CONTROL_ROOM_SCOPE.md — the external-data section

Scoping document for the read-only ad-platform section provisionally called "Control Room".
Nothing here is built. Read [`DECISIONS.md`](./DECISIONS.md), [`DEFINITIONS.md`](./DEFINITIONS.md)
and [`ROADMAP.md`](./ROADMAP.md) first — this document assumes their conventions and does not
restate them.

---

## Premise — read this before the rest

**This document proposes a reversal; it does not record one.** There is no "Control Room"
section in `PROJECT_BRIEF.md`, `DECISIONS.md` or `ROADMAP.md`, and no Pass E covering external
data. Real platform integrations are still listed as **cut** in three places
(`DECISIONS.md` §"What's explicitly cut", `PROJECT_BRIEF.md` §"Explicitly out of scope",
`README.md` §"Deliberately not built yet"), and `README.md` still opens with "No database, no
API calls, no auth."

Everything below is written as if the founder has decided to reverse that cut. If that decision
hasn't actually been made, stop at §7 — the open questions are the live part. See §7.1–7.3 for
the three places this document's brief and the repository disagree about what exists.

**Pass letter.** `ROADMAP.md`'s Pass E is already spent on the Observatory redesign (Done). This
work is scoped below as **Pass F**. `ROADMAP.md`'s Pass E "Watch" note also speculatively calls a
touchpoint level on the priority tree "a natural Pass F" — one of the two needs a different
letter, see §7.2.

---

## 1. Naming

**Decision: `Field Station`, not `Control Room`.**

**Reason:** the remote outpost where readings are taken from a population you observe but do not
control — samples travel back to the lab, never the reverse.

Three things the replacement buys, in descending order of how much they matter:

- **`control` is already load-bearing vocabulary.** Every seeded record's `design.arms` reads
  `"Control — flat 10% basket discount"`. A section called Control Room in a product whose central
  concept is the control arm is a collision the demo has to talk its way out of.
- **The metaphor does enforcement work.** A control room is where you pull levers on the plant. This
  section will never write to a live ad account (§5, and `PROJECT_BRIEF.md`'s permanent boundary).
  Naming it after a room full of levers means every future session has to be told the levers don't
  exist. "Samples travel back to the lab, never the reverse" states the read-only boundary in the
  name itself.
- **It fits the existing six.** Observatory, Laboratory, Microscope, Vivarium, Quarantine,
  Supercomputer are places and instruments a scientist uses. Control Room is mission control — a
  different film. Field Station is the same film, and the field-station → quarantine → main
  population pipeline is literally how specimen handling works, which is the exact shape of §5's
  write path.

**Sidebar placement:** *Signal* group (Observatory, Vivarium, Field Station). You watch here; you
don't do anything to the register from here except the single hand-off in §5, and that hand-off
lands in *Protocol*.

**Honest counter:** "Control Room" is the more legible label to a marketer who has never read
`DEFINITIONS.md`, and it is closer to what a buyer would call this. Legibility in a 3-minute demo is
a stated constraint in this repo. Flagged as §7.4 rather than decided unilaterally.

### DEFINITIONS.md entry (drafted for paste, same register as the existing six)

> ## Field Station
>
> **Metaphor:** The remote outpost where readings are taken from a population you observe but do not
> control. Instruments run continuously, samples travel back to the lab, and nothing travels the
> other way.
>
> **Function:** Read-only observation of connected ad accounts (Meta, Google Ads), normalized so one
> recommendation layer reads both. Answers "what is the live spend actually doing," which no other
> section can — every other section reads the register, and the register is what the team chose to
> test. Underperforming units are flagged by deterministic rules, narrated by the Supercomputer's
> engine, and can be drafted into an experiment that lands in Quarantine. It never writes to the
> platforms. That is a permanent boundary, not a not-yet.
>
> **Route:** `/field-station` (planned)
>
> **Status:** Not started. See [`CONTROL_ROOM_SCOPE.md`](./CONTROL_ROOM_SCOPE.md) and `ROADMAP.md`
> Pass F.

---

## 2. Data model

**Decision: the whole schema lives in `lib/external/`, and `lib/types.ts` does not change. At all.**

Not one field. The precedent is `lib/generate/types.ts` — `GeneratedProposal` is deliberately not in
`lib/types.ts` because a proposal is not a register record. An ad set is not a register record
either, and for a stronger reason: it is not even a thing this product owns. Same move, same file
layout.

```
lib/external/types.ts      the shapes below
lib/external/metrics.ts    derived readers (ctr, cpa, roas, trend) — pure, no stored derivations
lib/external/rules.ts      the flagging heuristics (Pass F3)
lib/external/facts.ts      fact assembly for the narrative layer (Pass F4)
lib/external/data/*.ts     fabricated accounts and metrics, static, same convention as lib/data/
```

### The shapes

snake_case throughout, matching `Experiment` and `KillCriteriaTemplate`. `Pass B` already settled
that an established codebase convention beats an inline sketch — no camelCase creeps in here either.

```ts
export type AdPlatform = "meta" | "google_ads";

/** One connected ad account. `brand_id` maps it onto the existing brand axis;
 *  it does not extend that axis. Null means unmapped, which is a real state. */
export interface ConnectedAccount {
  id: string;
  platform: AdPlatform;
  /** The platform's own id, verbatim — Meta `act_<id>`, Google Ads customer id. */
  platform_account_id: string;
  name: string;
  /** ISO 4217, as the platform reports it. Never converted — see §7.8. */
  currency: string;
  /** IANA, as the platform reports it. Dates below are local to this. */
  timezone: string;
  brand_id: string | null;
  connected_at: string;
  last_synced_at: string | null;
  /** Recorded so the UI can prove read-only rather than assert it. */
  scopes: string[];
  status: "connected" | "needs_reauth" | "revoked";
}

/** Meta: campaign → ad set → ad. Google Ads: campaign → ad group → ad.
 *  Normalized to Meta's vocabulary; `ad_group` maps to `ad_set`. */
export type AdUnitLevel = "campaign" | "ad_set" | "ad";

export interface AdUnit {
  /** Namespaced per platform and account, the way the pooled tree namespaces
   *  node ids per brand: "meta:act_1234:ad_set:98765". */
  id: string;
  account_id: string;
  platform: AdPlatform;
  level: AdUnitLevel;
  platform_unit_id: string;
  parent_id: string | null;
  name: string;
  status: "active" | "paused" | "archived";
  /** Meta objective / Google campaign type, verbatim. Not normalized — the two
   *  vocabularies don't map cleanly and a forced mapping would invent meaning. */
  objective: string | null;
  created_at: string;
}

/** One row per unit per day. Daily, not cumulative: the flagging rules need a
 *  trend, and a snapshot cannot produce one. */
export interface AdMetrics {
  unit_id: string;
  /** Local date in the account's timezone, as the platform reported it. */
  date: string;
  impressions: number;
  clicks: number;
  /** Account currency, major units. */
  spend: number;
  conversions: number;
  conversion_value: number;
  /** Null where the platform doesn't report it at this level. */
  reach: number | null;
  frequency: number | null;
}

export interface UnitFlag {
  id: string;
  unit_id: string;
  /** Which heuristic fired. Rule ids live in lib/external/rules.ts. */
  rule_id: string;
  severity: "watch" | "act";
  /** The numbers the rule fired on, so the card shows its own evidence rather
   *  than asserting a conclusion. */
  observed: { window_days: number; metric: string; value: number; reference: number };
  detected_at: string;
}
```

### What is deliberately absent

- **No stored `ctr`, `cpa`, `roas`, or trend.** Derived by `lib/external/metrics.ts`, the same
  discipline as `findReversal` — "the reversal is derived, not tagged" (`DECISIONS.md`, Pass 2). A
  stored rate is a rate that can disagree with the row it came from.
- **No `platform` field on anything in `lib/types.ts`.** The temptation is a fifth axis — `source`,
  or `platform`, to tell register records from platform records apart. It isn't needed: they are
  different types in different modules and never appear in the same list. Four axes is the ceiling
  and this section doesn't touch it. `paid_media` already exists as a touchpoint; a flagged ad set
  needs no new one.
- **No cross-currency total.** Never converted, never summed across currencies. §7.8.
- **No unified attribution window.** Two platforms' "conversions" are not the same measurement.
  §7.9.

### Field mapping

| Normalized | Meta Marketing API | Google Ads API |
| --- | --- | --- |
| `date` | `date_start`, with `time_increment=1` | `segments.date` |
| `impressions` | `impressions` | `metrics.impressions` |
| `clicks` | `inline_link_clicks` (**not** `clicks`, which counts every click on the unit) | `metrics.clicks` |
| `spend` | `spend` (string, major units — parse) | `metrics.cost_micros ÷ 1e6` |
| `conversions` | `actions`, filtered to one chosen `action_type` — **per-account config, see §7.7** | `metrics.conversions` (float) |
| `conversion_value` | `action_values`, same filter | `metrics.conversions_value` |
| `reach` / `frequency` | `reach` / `frequency` | not reported — null |

The `clicks` and `conversions` rows are the two that silently produce wrong numbers if mapped
naively. Both are called out because a normalizer that quietly picks the wrong Meta field is exactly
the false confidence this product exists to prevent.

---

## 3. Pass D / Pass F shared engine

**Decision: share the whole engine. The seam is the facts assembler, and it already exists.**

Correcting the brief: Pass D is **built**, not unbuilt (§7.3). `lib/generate/*`, `app/api/generate/
route.ts`, `app/supercomputer/page.tsx` and `components/supercomputer-view.tsx` are all shipped and
wired. So this is not "propose a shared engine" — it is "confirm the existing one extends," and it
does, cleanly, because `GenerateRequest` is already a discriminated union on `mode` and the route
already dispatches on it.

### Shared unchanged

- `PROPOSAL_SCHEMA` and `buildTool()` (`prompts.ts`) — the output shape is identical. A field-station
  proposal is an experiment proposal.
- `coerceProposal` / `coerceProposals` (`validate.ts`) — including the two invariants that matter:
  `rigor_tier` is always `RISK_BY[risk_category].rigor_default` and never model-set, and
  `loop_stage` is always `"brief"`. Both hold for a flagged-ad-set draft without amendment.
- `TAXONOMY_BRIEFING` (`prompts.ts`) — the model needs the same taxonomy briefing whatever it is
  reading.
- `GeneratedProposal`, `GenerateResponse`, `GenerateSource` (`generate/types.ts`).
- `ProposalCard` — renders a field-station draft with no changes.
- The whole route contract: `MODEL = "claude-sonnet-5"`, `thinking: disabled`, 12s timeout,
  `maxRetries: 0`, and the mandatory fallback. Every path ends in a 200 with `source: "model"` or
  `source: "fallback"`. Field Station inherits all of it.

### Differs, and only this

- `lib/external/facts.ts` → `FieldStationFacts`, the analogue of `roadmapFacts()`: the unit, its
  account and brand, the metric window, which rules fired with their observed numbers, and the
  reference cohort it underperformed against.
- `fieldStationSystemPrompt()` / `fieldStationUserPrompt(facts)` in `lib/generate/prompts.ts`.
- `buildFieldStationFallback(facts)` in `lib/generate/fallback.ts`, composed from the real metric
  window the way `buildRoadmapFallback` composes from the real tree.
- One `mode: "field_station"` branch in the route, plus `{ mode: "field_station"; unit_id: string }`
  on the `GenerateRequest` union.

### Naming the seam precisely

**The boundary is structured facts, not raw data.** Every mode computes its analysis
deterministically in code and hands the model a fact sheet. `roadmapUserPrompt` feeds
`findDriver`/`findReversal` output as `Structural fact — driver:` / `Structural fact — reversal:`
lines; the field-station prompt feeds rule hits in the same form. The model never sees raw metric
rows and never re-derives an analysis the code already did. That is the engine, and it is already
the shape of `lib/generate/facts.ts`.

The corollary, which matters for Pass F3: **flagging is not the model's job.** Rules are
deterministic code in `lib/external/rules.ts` — same discipline as `lib/priority.ts`'s pipeline
prompts. The model writes the narrative around a flag it did not decide.

### The one asymmetry, named rather than waved at

`RoadmapFacts` come from fabricated seed data that is internally consistent by construction.
`FieldStationFacts` come from a live account and can be missing, stale, zero, or actively
misleading — an ad set with spend and no conversions because conversion tracking broke, not because
the creative is bad. `validate.ts` protects the model's *output*; nothing in `lib/generate/*`
protects its *input*, because until now the input was seeded.

So the one genuinely new piece is an input-side gate: `eligibleForNarrative(unit)`, the analogue of
`eligibleForRoadmap(e)` in `facts.ts`. Minimum spend, minimum window length, non-null conversion
tracking. Below the gate a unit can still be flagged by a heuristic — the heuristic states what it
observed — but gets no LLM narrative. Handed a broken-tracking unit, a model will confidently write
"this ad set is underperforming," which is precisely the false confidence the pattern view's
inverse-variance weighting exists to prevent elsewhere in this codebase.

---

## 4. OAuth + read path

**Decision: this requires infrastructure that does not exist anywhere in this codebase, and Passes
F1–F5 are designed so it isn't needed until F6.**

No hand-waving: `README.md` says "No database, no API calls, no auth. All data is a static
TypeScript module," and that is accurate. The only server-side surface is
`app/api/generate/route.ts` — stateless, reads one env var, stores nothing.

### What OAuth needs that has no precedent here

1. **A persistent, writable store.** Refresh tokens are long-lived, per-account, and mutate on
   refresh. `lib/data/*.ts` is a static module compiled into the bundle. **This is the blocking
   gap** — everything else is downstream of it.
2. **An identity to hang tokens off.** There is no auth and no user, and `DECISIONS.md` cuts
   multi-tenancy deliberately. A single-instance deployment sidesteps it (tokens belong to the
   instance) — honest for a demo, not the shape of a product.
3. **Encryption at rest, and a key to manage.** An ad-account refresh token is a credential of real
   commercial value.
4. **Callback routes and CSRF `state` handling** — `app/api/oauth/[platform]/start` and `/callback`.
5. **Registered apps at both platforms, with lead times measured in weeks.** Meta requires App
   Review for `ads_read` on any account the app doesn't own. Google Ads requires a developer token,
   and a basic-access token only reaches test accounts — production access is a separate
   application. These are calendar dependencies, not build tasks, and they cannot be compressed by
   working faster.

### Scopes — read-only, permanently

- **Meta:** `ads_read`. Never `ads_management`.
- **Google Ads:** `https://www.googleapis.com/auth/adwords` — and here the brief's "read-only scopes
  only" is **not achievable as stated**. Google Ads ships a single scope granting read *and* mutate;
  there is no read-only variant. Read-only on Google is therefore enforced by our code (only
  `search`/`searchStream` GAQL queries are ever issued) and optionally by granting the connected
  user read-only access at the manager-account level — not by the grant. Genuine asymmetry with
  Meta, written down rather than smoothed over. §7.6.

### Where tokens would live — three options, recommendation first

- **A. No real OAuth (recommended for F1–F5).** Fabricated accounts in `lib/external/data/`,
  following the existing static-data convention exactly. The "Connect account" affordance explains
  what it would do and doesn't do it. Zero infrastructure, keeps the repo's no-backend promise
  intact, and demos identically — a normalized ad set renders the same whether the row came from a
  seed file or a sync job.
- **B. Single-instance encrypted store (first real integration).** SQLite file or one Postgres row,
  tokens encrypted with a key from env, one instance, one operator. This is the honest minimum for
  a single real connected account, and it is the point where README's and DECISIONS' "no database,
  no auth" lines get formally retired — with a decision entry, not silently.
- **C. Proper multi-tenant.** Auth provider, per-user token store, KMS-managed key, background
  refresh worker. This is the product. It is also a different project from the one `DECISIONS.md`
  describes, and `DECISIONS.md`'s repo strategy already says the plan is to port working pieces into
  the founder's Growth OS after the event. A real token store is the most obvious candidate for
  belonging there rather than here. §7.5.

### Read path, once tokens exist

Sync is a **background job, not a request-time fetch**. Meta's insights API is asynchronous for any
meaningful window (submit, poll, download); Google Ads `searchStream` is synchronous but
developer-token quota-limited. Either way a page render must never block on a platform call. The job
writes normalized rows; the UI reads the store; `ConnectedAccount.last_synced_at` is the honest
thing to display.

Note the collision: Observatory's masthead already shows a "last synced" timestamp derived from
`max(updated_at)` across the register. Two different meanings for one label on adjacent pages. §7.10.

---

## 5. The one write path

**Decision: a flagged unit drafts a `GeneratedProposal`, and the confirm step lands a `planned`
record in Quarantine with `kill_criteria.registered_at` unset.**

That last clause is the whole design. Everything else follows from it.

### The sequence

1. **Flagged unit in Field Station** → "Draft an experiment from this".
2. **`POST /api/generate` with `mode: "field_station"`** → a `GeneratedProposal`, rendered in the
   existing `ProposalCard`. **Nothing has been written.** A proposal has no id, no brand and no dates
   — that comment is already in `lib/generate/types.ts` and it stays true here.
3. **Confirm step** — a form pre-filled from the proposal plus the account mapping, requiring a human
   to supply what a machine cannot know.
4. **On confirm** → an `Experiment` with `status: "planned"` that sits in **Quarantine** until its
   kill criteria are confirmed or overridden (Pass C's graduation flow).

### Pre-filled, machine-derivable

| Field | Source |
| --- | --- |
| `title`, `hypothesis`, `summary` | the proposal |
| `touchpoint` | **forced to `"paid_media"`**, overriding the coerced value — a flagged ad set is paid media by construction, so the model does not get a vote |
| `risk_category` | the proposal (human-confirmable, below) |
| `rigor_tier` | `RISK_BY[risk_category].rigor_default` — never set directly, as everywhere else |
| `loop_stage` | `"brief"` — already what `coerceProposal` hardcodes |
| `brand_id` | `ConnectedAccount.brand_id` |
| `design.*` | `ProposalDesign`, with `collected_per_arm: null`, `actual_runtime_days: null` |
| `kill_criteria_template_id` | `templateIdFor("paid_media", risk_category)` |
| `kill_criteria_overridden` | `false` |
| `kill_criteria.rule`, `.checkpoint` | the proposal |
| `kill_criteria.disposition` | `"not_yet_evaluated"`, `disposition_note: null` |
| `status` | `"planned"` |
| `created_at`, `updated_at` | now |
| `launched_at`, `concluded_at` | `null` |
| `verdict`, `outcome`, `headline`, `segment_tree` | `null` |
| `id` | next `EXP-####` |

### Requires human confirmation — cannot be auto-filled

- **`kill_criteria.registered_at`.** The load-bearing one. `AGENTS.md`: `registered_at` always
  precedes `launched_at`, and the UI leans on that gap as proof the criteria were pre-registered. A
  machine-stamped registration is a timestamp, not a pre-registration — nobody committed to
  anything. The stamp is set when a human accepts or overrides the inherited criteria, which is
  exactly Quarantine's graduation step. **This is why the hand-off target is Quarantine and not
  Observatory**, and why Pass C is a hard dependency (§6).
- **`owner`** — a name. Not derivable from an ad account.
- **`brand_id`** when `ConnectedAccount.brand_id` is null — must be picked.
- **`risk_category`** — confirmable and overridable. The franchise/loonshot call changes rigor
  defaults and kill posture; a human owns that, not a model reading a 14-day metric window.
- **The `design` numbers** — editable. A power sketch off two weeks of platform data is a sketch,
  and `budgetScale()` already documents that honesty about its own numbers.

### Provenance

The draft carries which unit and which flag prompted it — as a join in the external module, not a
field on `Experiment`:

```ts
export interface ExperimentOrigin {
  experiment_id: string;
  unit_id: string;
  flag_id: string;
  drafted_at: string;
}
```

`lib/types.ts` stays untouched. Laboratory can show "drafted from Sundry Market · Meta · ad set
*Prospecting — Benefit LP*" by looking the join up; the register never looks down at platform data.

### The boundary, restated

The write path terminates at Quarantine. Nothing in Field Station writes to Meta or Google — no
pause, no budget change, no "apply this recommendation". The flagged-unit card must not carry a
"pause this ad set" affordance **even disabled or greyed out**, because a disabled control reads as
a not-yet, and this is a permanent product boundary.

---

## 6. Build passes

Scoped as **Pass F** (see Premise and §7.2 on the letter). Each sub-pass is shippable on its own and
leaves the app in a working state, the same way A–E were broken up.

### F1 — Normalized schema + fabricated accounts
**Depends on:** nothing.
`lib/external/types.ts` (§2). `lib/external/data/` with 2–3 fabricated connected accounts mapped
onto the existing three brands, a realistic unit tree per account, and ~30 days of daily
`AdMetrics` per unit. `lib/external/metrics.ts` derived readers — pure functions, mirroring
`lib/segments.ts`'s style. No platform calls, no UI. This is deliberately the Pass B move: data
model first, seeded directly, nothing rendering it yet.

Seed with the same discipline as `lib/data/experiments.ts` — numbers invented but internally
consistent, and at least one unit that is genuinely ambiguous (falling CPA on rising spend) so F3's
rules have something to be wrong about.

### F2 — The section, read-only
**Depends on:** F1.
`/field-station` route, sidebar row under *Signal*, `DEFINITIONS.md` entry, `README.md` table row.
Account list → unit tree → unit detail with the metric window. Reads F1 only. Reuses existing chips,
marks and tokens; introduces no new colour.

### F3 — Heuristic flagging
**Depends on:** F1. Sequence after F2 (needs somewhere to render).
`lib/external/rules.ts`, `UnitFlag`, deterministic rules that carry their observed numbers so a flag
shows its evidence rather than asserting a verdict. Same "compute the prompt, don't assert it"
discipline as `lib/priority.ts`.

### F4 — Narrative layer
**Depends on:** F3 (needs a flag to narrate) and the shipped Pass D engine.
`mode: "field_station"` on `/api/generate`, `lib/external/facts.ts`, the two prompt builders,
`buildFieldStationFallback`, and the `eligibleForNarrative` gate (§3). Mandatory fallback, as
everywhere.

### F5 — The Quarantine hand-off
**Depends on:** F4. **Pass C shipped, so the hard dependency is cleared** (`ROADMAP.md`).
The confirm step, the draft→`planned` write, `ExperimentOrigin`. Why this was blocked: without
Quarantine's kill-criteria confirmation there was nowhere for a draft to land that respects
`registered_at`, and dropping it straight into Observatory with a machine-stamped registration
would break the one invariant `AGENTS.md` calls out by name. The landing pad exists now — a draft
is written with `kill_criteria.registered_at: ""` **and `kill_criteria_confirmed_at: null`** (the
field Pass C added), and it is held on the second of those. F5 builds §5's pre-fill form and
`ExperimentOrigin`; it does not need to touch `components/quarantine-view.tsx`, which reads any
held record whatever wrote it.

### F6 — Real OAuth and sync
**Depends on:** a persistence decision (§4), Meta App Review, and a Google Ads production developer
token.
Swaps the data source behind F1's types. **No UI change.** That is the structural point of putting it
last: F1–F5 demo completely without any of the infrastructure this section would eventually need,
which is the same move `fallback.ts` already makes for the model call — the feature works when the
dependency isn't there.

### Dependency summary

```
F1 ──> F2 ──> F3 ──> F4 ──> F5
 └──────────────────────────> F6
                    Pass C ──> F5
```

---

## 7. Open questions for the founder

1. **The source sections don't exist.** No "Control Room" in `PROJECT_BRIEF.md`, `DECISIONS.md` or
   `ROADMAP.md`; nothing about Meta or Google Ads anywhere except the line cutting them. This
   document proposes the reversal rather than recording one. Confirm before any session treats it as
   source of truth.
2. **Pass letter.** `ROADMAP.md`'s Pass E is the Observatory redesign (Done), so this is scoped as
   Pass F — but Pass E's own "Watch" note calls a touchpoint level on the priority tree "a natural
   Pass F". Two candidates, one letter. Which keeps it?
3. **Pass D is built; three documents say it isn't.** `ROADMAP.md` Pass D reads "Not started /
   Unscoped", `DEFINITIONS.md`'s Supercomputer entry reads "Not started", and `README.md` reads "Not
   started (deferred)" plus "New `app/api/` route — nothing exists yet". All of
   `app/supercomputer/page.tsx`, `components/supercomputer-view.tsx`, `app/api/generate/route.ts`
   and `lib/generate/*` are shipped and wired (commit `d33e1f7`). §3 assumes the code, not the docs.
   Want those three files corrected in a follow-up?
4. **Naming: Field Station or Control Room.** §1 states the case for Field Station — `control` is
   already the comparison arm in every record's `design.arms`, and a control room implies levers this
   section will never have. The counter is real: Control Room is more legible to a buyer in three
   minutes. Founder's call.
5. **Reversing the cut costs the "no backend" claim.** F1–F5 keep `README.md`'s "no database, no API
   calls, no auth" true. F6 does not. `DECISIONS.md`'s repo strategy already says the plan is to port
   working pieces into Growth OS after the event — is F6 in this project, or is it the thing that
   goes home to Growth OS?
6. **Google Ads has no read-only OAuth scope.** The `adwords` scope grants read and mutate together.
   "Read-only scopes only" is achievable on Meta (`ads_read`) but on Google it is code-level
   discipline, not a grant-level guarantee. Accept that, or additionally require the connected user
   to hold read-only access at the manager-account level?
7. **Which Meta conversion counts?** Meta returns `actions` as an array of action types; picking one
   (purchase, add-to-cart, a custom event) is per-account configuration, not a constant. Without a
   choice per account, the normalized `conversions` field means different things in different rows.
   Who picks it, and is it exposed in the connect flow?
8. **Multi-currency.** Proposal: never convert, never sum across currencies. An agency with a US and
   a UK client will want one blended number and will be told no. Confirm that's the right answer.
9. **Attribution windows differ between platforms**, and Meta's default has changed over time. Two
   `conversions` figures are not the same measurement. Proposal: display each account's window
   verbatim and never pool across platforms. Confirm.
10. **Does Field Station get a stat tile on Observatory?** The masthead already shows "last synced"
    from `max(updated_at)` across the register. A real external sync timestamp would make one label
    mean two things on one page.
11. ~~**Pass C is a hard dependency for F5 and hasn't started.**~~ **Resolved:** Pass C was built
    first. F5 is unblocked, and the hand-off target is `kill_criteria_confirmed_at: null`.
12. ~~**"Pass D or Pass E first" is moot.**~~ **Resolved:** Pass D and Pass C are both built. F1
    is the next thing this document blocks on, and it blocks on §7.1 — whether the reversal in
    the Premise was actually decided.
