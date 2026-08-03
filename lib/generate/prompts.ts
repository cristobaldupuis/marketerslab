import type Anthropic from "@anthropic-ai/sdk";
import { formatCount, formatEffect, formatPercent, formatShare } from "../format";
import { CONSISTENCY_COPY } from "../patterns";
import { RISK_CATEGORIES, TOUCHPOINTS } from "../taxonomy";
import type { RoadmapFacts } from "./facts";
import type { PlanRequest } from "./types";

/**
 * Tool schema both request kinds share. `rigor_tier` and `loop_stage` are
 * deliberately absent — those are never model-controlled (see
 * `lib/generate/validate.ts`), so there is nothing for the model to get wrong
 * there.
 */
const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short, specific test name — not generic." },
    hypothesis: {
      type: "string",
      description:
        "2-4 sentences. What you believe and why, including the mechanism — not just what metric should move.",
    },
    touchpoint: { type: "string", enum: TOUCHPOINTS.map((t) => t.value) },
    risk_category: { type: "string", enum: RISK_CATEGORIES.map((r) => r.value) },
    summary: { type: "string", description: "One sentence a busy operator reads and moves on." },
    rationale: {
      type: "string",
      description: "Why this specific test, now. For a roadmap proposal: name the lever explicitly.",
    },
    design: {
      type: "object",
      properties: {
        primary_metric: { type: "string" },
        baseline: { type: "string", description: "Current value of the primary metric, with a unit." },
        mde: { type: "string", description: "Minimum detectable effect, e.g. '5% relative'." },
        power: { type: "number", description: "Statistical power, e.g. 0.8." },
        alpha: { type: "number", description: "Significance level, e.g. 0.05." },
        sample_per_arm: { type: "integer" },
        arms: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
        planned_runtime_days: { type: "integer" },
        allocation: { type: "string" },
        guardrails: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        design_note: { type: "string", description: "One sentence on why the design is sized this way." },
      },
      required: [
        "primary_metric",
        "baseline",
        "mde",
        "power",
        "alpha",
        "sample_per_arm",
        "arms",
        "planned_runtime_days",
        "allocation",
        "guardrails",
        "design_note",
      ],
    },
    kill_criteria: {
      type: "object",
      properties: {
        rule: {
          type: "string",
          description: "Phrased as a pre-registered commitment: 'Stop if X by Y.'",
        },
        checkpoint: { type: "string", description: "When the rule gets evaluated, in plain words." },
      },
      required: ["rule", "checkpoint"],
    },
  },
  required: ["title", "hypothesis", "touchpoint", "risk_category", "summary", "rationale", "design", "kill_criteria"],
};

export const SUBMIT_TOOL_NAME = "submit_experiment_proposals";

export function buildTool(minItems: number, maxItems: number): Anthropic.Tool {
  return {
    name: SUBMIT_TOOL_NAME,
    description: "Submit the ranked experiment proposal(s), best first.",
    input_schema: {
      type: "object",
      properties: {
        proposals: {
          type: "array",
          items: PROPOSAL_SCHEMA,
          minItems,
          maxItems,
        },
      },
      required: ["proposals"],
    },
  };
}

const TAXONOMY_BRIEFING = `Touchpoints: ${TOUCHPOINTS.map((t) => `${t.value} (${t.blurb})`).join("; ")}.

Risk category changes real behaviour, not a label:
${RISK_CATEGORIES.map(
  (r) =>
    `- ${r.value}: ${r.blurb} Kill posture: ${r.kill_posture} Judged on: ${r.judged_on}`,
).join("\n")}

Kill criteria must always be phrased as a pre-registered commitment — "stop if X by Y" — never as a retrospective observation.`;

export function planSystemPrompt(): string {
  return `You are the plan-builder inside Marketers Lab, a marketing experimentation register. You propose ranked, pre-registered experiment plans — not chat, not advice. Every field you return becomes a rendered record, so be specific and concrete rather than generic.

${TAXONOMY_BRIEFING}

Return proposals via the ${SUBMIT_TOOL_NAME} tool only. Do not write any other text.`;
}

export function planUserPrompt(req: PlanRequest): string {
  return `Industry: ${req.industry}
Company stage: ${req.stage}
Test budget: ${req.budget}
Touchpoint: ${TOUCHPOINTS.find((t) => t.value === req.touchpoint)?.label ?? req.touchpoint}

Propose 2 ranked experiments for this touchpoint, best first. Give the pair real range: at least one franchise-tagged test (incremental, tight kill criteria) and at least one loonshot-tagged test (genuinely novel — new channel, new mechanic — looser kill criteria, longer runway). Size the sample and runtime to the stated budget: a smaller budget means a smaller sample and a longer runtime to reach it, not a smaller effect size. Ground the hypothesis in the stated industry and stage, not in generic marketing language.`;
}

export function roadmapSystemPrompt(): string {
  return `You are the roadmap generator inside Marketers Lab. You are handed a completed experiment plus the specific structural facts its segment-decision-tree analysis already found — which sub-population actually drove the result, and whether any segment moved against the topline. Your job is Safi Bahcall's "lever, not the headline": propose the next test built on that specific lever (segment, channel, offer mechanic, or timing), not a restatement of what the headline said. A roadmap proposal that ignores the tree facts given to you and re-derives a generic "test the winning variant more broadly" idea has failed the assignment.

${TAXONOMY_BRIEFING}

Return exactly one proposal via the ${SUBMIT_TOOL_NAME} tool only. Do not write any other text.`;
}

export function roadmapUserPrompt(facts: RoadmapFacts): string {
  const { experiment: e, brand, tree, driver, reversal, leverVariable, family } = facts;

  const lines: string[] = [
    `Completed experiment: ${e.title} (${e.id}, ${brand.name})`,
    `Hypothesis: ${e.hypothesis}`,
    `Touchpoint: ${e.touchpoint} · Risk category: ${e.risk_category} · Rigor tier: ${e.rigor_tier}`,
    `Verdict: ${e.verdict ?? "—"}`,
    `Topline: ${e.design.primary_metric} moved ${formatEffect(tree.effect)}, 95% CI ${formatEffect(tree.interval[0])} to ${formatEffect(tree.interval[1])}, n = ${formatCount(tree.n)}.`,
    `The tree's root split variable is "${tree.split ?? "none"}".`,
  ];

  if (driver) {
    lines.push(
      `Structural fact — driver: the topline is carried by "${driver.label}" (${formatShare(driver.share)} of the population), which moved ${formatEffect(driver.effect)}. ${driver.note}`,
    );
  }

  if (reversal) {
    lines.push(
      `Structural fact — reversal: "${reversal.label}" (${formatShare(reversal.share)} of the population) moved ${formatEffect(reversal.effect)} — the opposite direction from the topline. ${reversal.note}`,
    );
  } else {
    lines.push(
      `Structural fact: no segment reversed against the topline. The effect held direction in every branch of the tree.`,
    );
  }

  if (leverVariable) {
    lines.push(`The variable that actually separates these branches is "${leverVariable}" — this is the lever.`);
  }

  if (family?.pooled) {
    lines.push(
      `Structural fact — cross-brand pattern: this test also ran at ${family.studies.length} brands. Pooled effect ${formatEffect(family.pooled.effect)}, I² ${formatPercent(family.pooled.i2)} — ${CONSISTENCY_COPY[family.pooled.consistency].label.toLowerCase()}. ${CONSISTENCY_COPY[family.pooled.consistency].blurb}`,
    );
  }

  lines.push(
    `\nPropose the next test. Build it explicitly on the lever above — do not propose "roll out the winning treatment more broadly" as though the topline were the whole finding. In your rationale, name the specific segment or lever this test is built on.`,
  );

  return lines.join("\n");
}
