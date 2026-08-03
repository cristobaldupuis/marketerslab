import Anthropic from "@anthropic-ai/sdk";
import { roadmapFacts } from "@/lib/generate/facts";
import { buildPlanFallback, buildRoadmapFallback } from "@/lib/generate/fallback";
import { INDUSTRIES, STAGES, BUDGETS } from "@/lib/generate/inputs";
import {
  buildTool,
  planSystemPrompt,
  planUserPrompt,
  roadmapSystemPrompt,
  roadmapUserPrompt,
  SUBMIT_TOOL_NAME,
} from "@/lib/generate/prompts";
import type { GenerateRequest, GenerateResponse, GeneratedProposal, PlanRequest } from "@/lib/generate/types";
import { coerceProposals } from "@/lib/generate/validate";
import { TOUCHPOINTS } from "@/lib/taxonomy";
import type { Touchpoint } from "@/lib/types";

/**
 * The one server-side model call in this codebase. A seeded fallback is
 * mandatory, not optional — no key, rate limit, timeout or malformed response
 * may reach the client as an error state. Every code path below ends in a 200
 * with either `source: "model"` or `source: "fallback"`.
 */

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 12_000;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 })
  : null;

const TOUCHPOINT_VALUES = new Set<Touchpoint>(TOUCHPOINTS.map((t) => t.value));

function isPlanRequest(body: unknown): body is PlanRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    b.mode === "plan" &&
    typeof b.industry === "string" &&
    (INDUSTRIES as readonly string[]).includes(b.industry) &&
    typeof b.stage === "string" &&
    (STAGES as readonly string[]).includes(b.stage) &&
    typeof b.budget === "string" &&
    (BUDGETS as readonly string[]).includes(b.budget) &&
    typeof b.touchpoint === "string" &&
    TOUCHPOINT_VALUES.has(b.touchpoint as Touchpoint)
  );
}

function isRoadmapRequest(body: unknown): body is { mode: "roadmap"; experimentId: string } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return b.mode === "roadmap" && typeof b.experimentId === "string";
}

async function callModel(system: string, user: string, minItems: number, maxItems: number): Promise<GeneratedProposal[]> {
  if (!client) return [];
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: user }],
      tools: [buildTool(minItems, maxItems)],
      tool_choice: { type: "tool", name: SUBMIT_TOOL_NAME },
    });

    if (response.stop_reason === "refusal") return [];

    const toolUse = response.content.find((b) => b.type === "tool_use" && b.name === SUBMIT_TOOL_NAME);
    if (!toolUse || toolUse.type !== "tool_use") return [];

    return coerceProposals(toolUse.input, maxItems);
  } catch {
    // Any failure — network, auth, rate limit, timeout, malformed response —
    // degrades to the caller falling back. Never surface this to the client.
    return [];
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed request body" }, { status: 400 });
  }

  const req = body as GenerateRequest;

  if (isPlanRequest(req)) {
    const proposals = await callModel(planSystemPrompt(), planUserPrompt(req), 2, 3);
    const result: GenerateResponse =
      proposals.length > 0
        ? { source: "model", proposals }
        : { source: "fallback", proposals: buildPlanFallback(req) };
    return Response.json(result);
  }

  if (isRoadmapRequest(req)) {
    const facts = roadmapFacts(req.experimentId);
    if (!facts) {
      return Response.json({ error: "No eligible experiment with that id" }, { status: 400 });
    }
    const proposals = await callModel(roadmapSystemPrompt(), roadmapUserPrompt(facts), 1, 1);
    const result: GenerateResponse =
      proposals.length > 0
        ? { source: "model", proposals: [proposals[0]] }
        : { source: "fallback", proposals: [buildRoadmapFallback(facts)] };
    return Response.json(result);
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}
