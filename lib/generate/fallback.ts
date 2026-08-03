import { formatEffect, formatPercent, formatShare } from "../format";
import { CONSISTENCY_COPY } from "../patterns";
import { RISK_BY } from "../taxonomy";
import type { Touchpoint } from "../types";
import type { RoadmapFacts } from "./facts";
import { budgetScale } from "./inputs";
import type { GeneratedProposal, PlanRequest } from "./types";

/**
 * Seeded fallback — mandatory, not optional. No key, rate limit, timeout or
 * malformed response may degrade to an error state; it degrades to this.
 * Composed from the real request inputs (plan-builder) or the real segment
 * tree (roadmap generator) rather than static copy, so it reads as work done
 * for this input, not a canned placeholder.
 */

function rigorFor(risk: "franchise" | "loonshot") {
  return RISK_BY[risk].rigor_default;
}

/* -------------------------------------------------------------------------- */
/* Plan-builder                                                               */
/* -------------------------------------------------------------------------- */

interface TouchpointTemplate {
  franchise: (industry: string, stage: string) => Pick<GeneratedProposal, "title" | "hypothesis" | "summary" | "rationale"> & {
    metric: string;
    baseline: string;
    mde: string;
    arms: string[];
    guardrails: string[];
    allocation: string;
    designNote: string;
    killRule: string;
    killCheckpoint: string;
  };
  loonshot: TouchpointTemplate["franchise"];
}

const TEMPLATES: Record<Touchpoint, TouchpointTemplate> = {
  paid_media: {
    franchise: (industry) => ({
      title: "Benefit-led vs. offer-led creative on prospecting",
      hypothesis: `In ${industry}, prospecting creative built around a category benefit rather than a discount should hold cost per acquisition while improving downstream retention — the same shape that generalised across networks in EXP-0103.`,
      summary: "Incremental creative swap on an existing prospecting placement. Cheap to fail, cheap to roll out.",
      rationale: "Franchise-tagged: a copy swap on a channel that already works, so tight kill criteria and a fast read are correct here, not a badge.",
      metric: "Second order within 45 days of first",
      baseline: "26.0%",
      mde: "8% relative",
      arms: ["Control — current offer-led creative", "Treatment — category-benefit creative"],
      guardrails: ["First-order CAC", "Impression share", "Basket size on first order"],
      allocation: "50/50 budget split across the two largest prospecting placements",
      designNote: "Runtime set by the second-order window rather than acquisition volume — the primary metric needs the cohort to mature before it can be read.",
      killRule: "Stop at the day-6 interim if first-order CAC in the treatment arm runs more than 10% above control.",
      killCheckpoint: "Day-6 interim read",
    }),
    loonshot: (industry) => ({
      title: "Retail media as a new prospecting channel",
      hypothesis: `${industry} acquisition currently concentrates in one or two channels. Retail media placements at the point of category intent should acquire households at a comparable CAC with materially higher second-order rates, because intent is closer to the moment of decision.`,
      summary: "A genuinely new channel, not a variant of an existing one. Judged partly on structural learning, not purely win/loss.",
      rationale: "Loonshot-tagged: no prior on this channel for this brand, so the evaluation criteria have to be loose enough that a slow first read isn't mistaken for a loss.",
      metric: "Blended CAC vs. existing channel mix",
      baseline: "Existing blended CAC",
      mde: "15% relative",
      arms: ["Control — existing channel mix, budget held flat", "Treatment — 15% of prospecting budget to retail media"],
      guardrails: ["Blended CAC", "Second-order rate", "Channel concentration risk"],
      allocation: "85/15 budget split, new channel capped at 15% of prospecting spend",
      designNote: "Sized for a slower read than a franchise test — a new channel's early signal is noisy by nature, and franchise-tight criteria would kill it before the audience has time to season.",
      killRule: "Do not stop on CAC alone in the first two weeks. Stop if blended CAC exceeds the existing mix by more than 25% at the day-21 checkpoint with no improving trend.",
      killCheckpoint: "Day-21 checkpoint, first read at day 14",
    }),
  },
  crm: {
    franchise: (industry) => ({
      title: "Subject-line specificity test on the top lifecycle send",
      hypothesis: `Specific, numeric subject lines ("3 items low on your usual list") should outperform generic ones on the highest-volume lifecycle email in ${industry}, the same way small specificity gains compound at scale.`,
      summary: "A copy test on an email that already sends every week. Low risk, fast read.",
      rationale: "Franchise-tagged: incremental copy change on a proven send, correctly held to a tight, fast-dying bar.",
      metric: "Click-to-open rate",
      baseline: "11.4%",
      mde: "10% relative",
      arms: ["Control — current subject line pattern", "Treatment — specific, numeric subject line"],
      guardrails: ["Unsubscribe rate", "Spam complaint rate", "Revenue per recipient"],
      allocation: "50/50, randomised at recipient level, held for two full send cycles",
      designNote: "Two send cycles rather than one, since the top lifecycle send has enough weekly volume to read cleanly without needing a long runway.",
      killRule: "Stop after the second send if unsubscribe rate in treatment runs more than 15% above control.",
      killCheckpoint: "After the second send cycle",
    }),
    loonshot: (industry, stage) => ({
      title: "Milestone-triggered win-back flow",
      hypothesis: `Standard time-based win-back ("we miss you") underperforms because it ignores what the household actually did. A flow triggered on a specific behavioural milestone should recover meaningfully more of the ${stage.toLowerCase().includes("pre-seed") || stage.toLowerCase().includes("seed") ? "early" : "existing"} base in ${industry} than a blanket time-based trigger.`,
      summary: "A new lifecycle mechanic, not a tune on the existing one. The flow itself is the thing being tested.",
      rationale: "Loonshot-tagged: a new trigger logic with no prior read, so runway and kill criteria are looser than a copy test would get.",
      metric: "Reactivation within 30 days of trigger",
      baseline: "4.2%",
      mde: "20% relative",
      arms: ["Control — existing time-based win-back", "Treatment — milestone-triggered win-back"],
      guardrails: ["Unsubscribe rate", "Send volume per household", "Revenue per reactivated household"],
      allocation: "50/50, randomised at household level, held for a full 45-day reactivation window",
      designNote: "Runway set to a full reactivation window rather than a single send cycle — a new trigger's effect only shows up once enough eligible households have actually crossed the milestone.",
      killRule: "Do not stop on week-one volume. Stop if unsubscribe rate exceeds 1.5x control at the day-21 checkpoint.",
      killCheckpoint: "Day-21 checkpoint, full read at day 45",
    }),
  },
  pdp: {
    franchise: (industry) => ({
      title: "Trust signal placement above the fold",
      hypothesis: `Moving the strongest trust signal (reviews, guarantee, or delivery promise) above the fold on the PDP should lift add-to-cart in ${industry}, where the drop-off between view and add is usually a hesitation gap, not a discovery gap.`,
      summary: "A layout change to an existing PDP. Fast to build, fast to read.",
      rationale: "Franchise-tagged: incremental to a page that already converts, so the tight kill criteria are the correct default.",
      metric: "Add-to-cart rate",
      baseline: "18.6%",
      mde: "6% relative",
      arms: ["Control — current PDP layout", "Treatment — trust signal above the fold"],
      guardrails: ["Page load time", "Scroll depth to purchase CTA", "Return rate"],
      allocation: "50/50, randomised at visitor level, sticky across sessions",
      designNote: "Sized for a 6% relative lift on current baseline — big enough to justify a permanent layout change, small enough to reach in three weeks.",
      killRule: "Stop at the day-7 interim if add-to-cart trails control by more than 2% relative.",
      killCheckpoint: "Day-7 interim read",
    }),
    loonshot: (industry) => ({
      title: "New offer mechanic: threshold incentive at checkout",
      hypothesis: `Replacing a flat discount with a spend-threshold incentive should change behaviour, not just economics, in ${industry} — it pulls near-threshold baskets over the line rather than uniformly discounting every basket. The risk is a reversal for shoppers who lose a discount they were counting on.`,
      summary: "A new pricing mechanic, not a tune on the current one. Read at segment level from day one, since the mechanism is expected to behave unevenly.",
      rationale: "Loonshot-tagged: genuinely novel mechanic, looser kill criteria and a longer runway so early noise doesn't kill a real structural effect.",
      metric: "Completed checkouts ÷ checkout starts",
      baseline: "58.0%",
      mde: "3% relative",
      arms: ["Control — current flat discount", "Treatment — spend-threshold incentive"],
      guardrails: ["Average basket value", "Refund rate", "Repeat order within 30 days"],
      allocation: "50/50, randomised at household level, sticky across sessions",
      designNote: "Segment-tagged design from launch — prior runs of this mechanic reversed for a specific sub-population, so the tree needs to exist before the topline is trusted.",
      killRule: "Stop at the day-7 interim if completed checkouts trail control by more than 2% relative, or if average basket value falls more than 5% in either arm.",
      killCheckpoint: "Day-7 interim read",
    }),
  },
  offline: {
    franchise: (industry) => ({
      title: "Packaging insert: benefit copy vs. social proof",
      hypothesis: `Swapping the current packaging insert's discount-forward copy for a benefit-led message should lift repeat-purchase rate in ${industry} without costing anything on the print run.`,
      summary: "A copy swap on an insert that already ships in every order. Zero incremental cost, fast to read against a repeat-purchase window.",
      rationale: "Franchise-tagged: incremental to an existing touchpoint, correctly held to a tight bar.",
      metric: "Repeat purchase within 60 days",
      baseline: "22.4%",
      mde: "8% relative",
      arms: ["Control — current discount-forward insert", "Treatment — benefit-led insert"],
      guardrails: ["Print cost per unit", "Return rate", "Customer service contact rate"],
      allocation: "50/50, randomised at order level, held for a full 60-day repeat window",
      designNote: "Runway set to the repeat-purchase window itself — nothing about this test can be read faster than the behaviour it's measuring.",
      killRule: "Stop at the day-21 interim if customer service contacts referencing the insert rise more than 20% above baseline.",
      killCheckpoint: "Day-21 interim read",
    }),
    loonshot: (industry) => ({
      title: "Direct mail to lapsed high-value households",
      hypothesis: `A physical, high-production-value mail piece to the top decile of lapsed households in ${industry} should reactivate more of them than another email — the channel itself, not the offer, is the untested variable.`,
      summary: "A new offline channel for this base, not a variant of the existing print run. Judged partly on whether it's structurally worth scaling.",
      rationale: "Loonshot-tagged: no channel prior for this segment, so runway and kill criteria are set loose enough to let the channel prove itself.",
      metric: "Reactivation within 45 days of mail date",
      baseline: "2.1%",
      mde: "30% relative",
      arms: ["Control — standard win-back email only", "Treatment — direct mail plus standard email"],
      guardrails: ["Cost per reactivated household", "Complaint rate", "Reactivated household 90-day value"],
      allocation: "50/50 within the top-decile lapsed cohort, randomised at household level",
      designNote: "Sized against the top decile only — mail cost per household is high enough that a blanket test would burn the budget before the effect could be read.",
      killRule: "Do not stop before day 21 — mail has a delivery and response lag a digital channel doesn't. Stop if cost per reactivated household exceeds 3x the email-only baseline at day 45.",
      killCheckpoint: "Day-45 checkpoint, first read at day 21",
    }),
  },
};

export function buildPlanFallback(req: PlanRequest): GeneratedProposal[] {
  const template = TEMPLATES[req.touchpoint];
  const { samplePerArm, runtimeDays } = budgetScale(req.budget);

  return (["franchise", "loonshot"] as const).map((risk) => {
    const t = template[risk](req.industry, req.stage);
    return {
      title: t.title,
      hypothesis: t.hypothesis,
      touchpoint: req.touchpoint,
      risk_category: risk,
      rigor_tier: rigorFor(risk),
      loop_stage: "brief",
      summary: t.summary,
      design: {
        primary_metric: t.metric,
        baseline: t.baseline,
        mde: t.mde,
        power: 0.8,
        alpha: risk === "loonshot" ? 0.1 : 0.05,
        sample_per_arm: risk === "loonshot" ? Math.round(samplePerArm * 0.6) : samplePerArm,
        arms: t.arms,
        planned_runtime_days: risk === "loonshot" ? Math.round(runtimeDays * 1.6) : runtimeDays,
        allocation: t.allocation,
        guardrails: t.guardrails,
        design_note: t.designNote,
      },
      kill_criteria: { rule: t.killRule, checkpoint: t.killCheckpoint },
      rationale: t.rationale,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Roadmap generator                                                          */
/* -------------------------------------------------------------------------- */

export function buildRoadmapFallback(facts: RoadmapFacts): GeneratedProposal {
  const { experiment: e, tree, driver, reversal, leverVariable, family } = facts;
  const lever = leverVariable ?? tree.split ?? "the segment that carried the result";

  if (reversal) {
    const risk = "loonshot" as const;
    return {
      title: `${e.title} — isolating ${lever.toLowerCase()}`,
      hypothesis: `${e.title} read ${formatEffect(tree.effect)} on the topline, but that average sits between two real, opposite effects: ${driver ? `${driver.label} moved ${formatEffect(driver.effect)} on ${formatShare(driver.share)} of the population` : "a large positive branch"}, while ${reversal.label} moved ${formatEffect(reversal.effect)} on ${formatShare(reversal.share)} — the opposite direction. Rolling the current mechanic out broadly helps one group and costs the other. This test holds the mechanic for the segment where it works and tries a distinct treatment, sized to what actually differs about ${reversal.label}, for the segment where it reverses.`,
      touchpoint: e.touchpoint,
      risk_category: risk,
      rigor_tier: rigorFor(risk),
      loop_stage: "brief",
      summary: `Splits the mechanic by ${lever.toLowerCase()} instead of shipping one version to everyone.`,
      design: {
        primary_metric: e.design.primary_metric,
        baseline: `${formatEffect(reversal.effect)} in the ${reversal.label} branch today`,
        mde: "5% relative, read within the reversal segment specifically",
        power: 0.8,
        alpha: 0.1,
        sample_per_arm: Math.max(2000, Math.round(reversal.n * 0.9)),
        arms: [
          `Control — current mechanic, unsegmented`,
          `Treatment — mechanic held for the driver segment, distinct treatment for ${reversal.label}`,
        ],
        guardrails: [e.design.primary_metric, "Segment-level effect (not just topline)", ...e.design.guardrails.slice(0, 2)],
        planned_runtime_days: Math.round(e.design.planned_runtime_days * 1.4),
        allocation: `Segmented at launch on ${lever.toLowerCase()} — not read into segments after the fact`,
        design_note: `Genuinely novel because the treatment now differs by segment rather than being one mechanic for everyone — the previous run already showed the single-mechanic version doesn't transfer to ${reversal.label}.`,
      },
      kill_criteria: {
        rule: `Stop if the ${reversal.label} branch moves against its new treatment by more than 3% relative at the interim, or if the driver segment's gain erodes by more than half.`,
        checkpoint: "Day-10 interim read, segment-level",
      },
      rationale: `The lever, not the headline: ${e.title} did not win because of the mechanic broadly — it won because of ${driver ? driver.label : "one segment"}, and it cost ${reversal.label} on the way. ${family?.pooled ? `${CONSISTENCY_COPY[family.pooled.consistency].label} across the ${family.studies.length} brands that have run this test (I² ${formatPercent(family.pooled.i2)}) — ` : ""}the next test should target the lever directly rather than repeating the same unsegmented rollout somewhere else.`,
    };
  }

  const risk = "franchise" as const;
  const driverLabel = driver?.label ?? tree.children[0]?.label ?? "the strongest branch";
  return {
    title: `${e.title} — scaling on ${lever.toLowerCase()}`,
    hypothesis: `${e.title} held direction across every branch of the tree split on ${lever}${driver ? `, strongest in ${driverLabel} at ${formatEffect(driver.effect)}` : ""}. ${family?.pooled ? `${formatPercent(family.pooled.i2)} of the spread across the ${family.studies.length} brands that ran this is real brand difference rather than noise, and the direction still held everywhere. ` : ""}The open question isn't whether the mechanic works — it's whether it scales further along ${lever.toLowerCase()}, or has already captured most of the available lift.`,
    touchpoint: e.touchpoint,
    risk_category: risk,
    rigor_tier: rigorFor(risk),
    loop_stage: "brief",
    summary: `Tests whether the win generalises further along ${lever.toLowerCase()}, now that the direction is proven.`,
    design: {
      primary_metric: e.design.primary_metric,
      baseline: e.headline?.value ?? formatEffect(tree.effect),
      mde: "5% relative vs. the proven effect",
      power: 0.8,
      alpha: 0.05,
      sample_per_arm: Math.max(2000, Math.round((driver?.n ?? tree.n) * 0.5)),
      arms: [`Control — current rollout scope`, `Treatment — extended along ${lever.toLowerCase()}`],
      planned_runtime_days: Math.max(10, Math.round(e.design.planned_runtime_days * 0.7)),
      allocation: "50/50, randomised within the extended scope only",
      guardrails: e.design.guardrails.slice(0, 4),
      design_note: `Franchise-tagged because the mechanic is proven — this is scaling, not discovery, so a tight, fast-dying bar is the correct default.`,
    },
    kill_criteria: {
      rule: `Stop at the first interim if the extended scope trails the proven effect (${e.headline?.value ?? formatEffect(tree.effect)}) by more than 40% relative.`,
      checkpoint: "First interim read, roughly a third into runtime",
    },
    rationale: `The lever, not the headline: what carried ${e.title} was ${lever.toLowerCase()}${driver ? `, specifically ${driverLabel}` : ""} — not an unsegmented average. ${reversal ? "" : "Nothing in the tree reversed against it, "}so the honest next step is to extend along that same lever rather than declare the mechanic finished.`,
  };
}
