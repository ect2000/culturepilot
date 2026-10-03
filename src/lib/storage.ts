import { z } from "zod";
import { briefSchema, categories, type AgentState, type Brief } from "./types";
const category = z.enum(categories);
const node = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["brief", "seed", "cluster", "entity", "opportunity"]),
  category: category.optional(),
  score: z.number().nullable(),
  source: z.enum(["qloo", "derived", "user"]),
  description: z.string().optional(),
});
const edge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relation: z.enum(["brief-anchor", "affinity", "supports", "membership"]),
  weight: z.number().nullable(),
  sourceType: z.enum(["qloo", "derived"]),
  stepId: z.string(),
  geographic: z.boolean(),
});
const report = z.object({
  id: z.string(),
  brief: briefSchema,
  status: z.literal("complete"),
  anchors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: z.enum(["entity", "tag"]),
      category: category.optional(),
    }),
  ),
  plannedDimensions: z.array(category),
  researchedDimensions: z.array(category),
  entities: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        category,
        affinity: z.number().nullable(),
        description: z.string().optional(),
        address: z.string().optional(),
        tags: z.array(z.string()),
      }),
    )
    .max(200),
  nodes: z.array(node).max(300),
  edges: z.array(edge).max(500),
  opportunities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category,
      score: z.number(),
      description: z.string(),
      action: z.string(),
      evidenceIds: z.array(z.string()),
      edgeIds: z.array(z.string()),
      breakdown: z.object({
        affinity: z.number(),
        evidenceDensity: z.number(),
        crossCategorySupport: z.number(),
        geographicRelevance: z.number(),
      }),
      confidence: z.number(),
      reasoning: z.array(z.string()),
    }),
  ),
  strategy: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      evidenceIds: z.array(z.string()),
    }),
  ),
  steps: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["running", "complete", "empty", "error"]),
      tool: z.enum([
        "analyzer",
        "qloo.tags",
        "qloo.search",
        "qloo.insights",
        "scorer",
      ]),
      input: z.record(z.string(), z.string()),
      reason: z.string(),
      resultCount: z.number(),
      selectedCount: z.number(),
      durationMs: z.number(),
      message: z.string().optional(),
      stepNumber: z.number().optional(),
      actor: z
        .enum(["AGENT", "OPENROUTER", "QLOO", "GRAPH_ENGINE", "SCORING_ENGINE"])
        .optional(),
      action: z.string().optional(),
      inputSummary: z.string().optional(),
      outputSummary: z.string().optional(),
      evidenceAdded: z.number().optional(),
      plannerActor: z.enum(["AGENT", "OPENROUTER"]).optional(),
    }),
  ),
  coverage: z.number(),
  confidence: z.number(),
  culturalFit: z.number(),
  qlooCalls: z.number(),
  startedAt: z.string(),
  durationMs: z.number(),
  limitations: z.array(z.string()),
  stopReason: z.string().optional(),
  language: z
    .object({
      mode: z.enum(["deterministic", "assisted", "fallback"]),
      status: z.string(),
      model: z.string().optional(),
      calls: z.number(),
      strategyDurationMs: z.number(),
    })
    .optional(),
  explanations: z.record(z.string(), z.string()).optional(),
  evidence: z
    .array(
      z.object({
        id: z.string(),
        qlooEntityId: z.string(),
        entityName: z.string(),
        category: category.optional(),
        affinity: z.number().nullable(),
        source: z.literal("qloo"),
        relatedEntities: z.array(
          z.object({
            id: z.string(),
            affinity: z.number(),
            stepId: z.string(),
            edgeId: z.string(),
          }),
        ),
      }),
    )
    .optional(),
});
const historyKey = "culturepilot:history:v1";
export function readHistory(): AgentState[] {
  try {
    const value = localStorage.getItem(historyKey);
    if (!value || value.length > 2_000_000) return [];
    const parsed = z.array(report).max(8).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
export function saveReport(state: AgentState): boolean {
  if (state.status !== "complete") return false;
  try {
    localStorage.setItem(
      historyKey,
      JSON.stringify(
        [state, ...readHistory().filter((s) => s.id !== state.id)].slice(0, 8),
      ),
    );
    return true;
  } catch {
    return false;
  }
}
export function clearHistory() {
  try {
    localStorage.removeItem(historyKey);
  } catch {}
}
export function saveBrief(id: string, brief: Brief) {
  try {
    sessionStorage.setItem(`culturepilot:brief:${id}`, JSON.stringify(brief));
  } catch {}
}
export function readBrief(id: string): Brief | undefined {
  try {
    const parsed = briefSchema.safeParse(
      JSON.parse(sessionStorage.getItem(`culturepilot:brief:${id}`) ?? "null"),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
