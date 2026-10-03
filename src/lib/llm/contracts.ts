import { z } from "zod";
import {
  briefSchema,
  categories,
  type AgentState,
  type Brief,
  type Category,
  type StrategySection,
  type LanguageRuntime,
} from "../types";
import type { ResearchTask } from "../agent/planner";

export const ALLOWED_AGENT_ACTIONS = [
  "SEARCH_QLOO_ENTITIES",
  "EXPLORE_AFFINITIES",
  "EXPAND_CLUSTER",
  "INVESTIGATE_LOCATION",
  "STOP_RESEARCH",
] as const;
export const parsedBriefSchema = briefSchema
  .extend({
    suggestedDimensions: z.array(z.enum(categories)).min(3).max(5),
  })
  .strict();
export type ParsedCultureBrief = z.infer<typeof parsedBriefSchema>;
export const planSchema = z
  .object({
    dimensions: z.array(z.enum(categories)).length(5),
    anchorQuery: z.string().trim().min(2).max(80),
  })
  .strict();
export type ResearchPlan = z.infer<typeof planSchema>;
export const actionSchema = z
  .object({
    action: z.enum(ALLOWED_AGENT_ACTIONS),
    candidateId: z.string().max(40).nullable(),
  })
  .strict();
export type ResearchAction = z.infer<typeof actionSchema>;
export interface ActionCandidate {
  id: string;
  action: ResearchAction["action"];
  task: ResearchTask;
}
export interface NarrativeOption {
  id: string;
  title: string;
  evidenceIds: string[];
  variants: string[];
}
export interface OpportunityEvidenceContext {
  id: string;
  evidenceIds: string[];
  variants: string[];
}
export interface StrategyEvidenceContext {
  brief: Brief;
  evidence: NonNullable<AgentState["evidence"]>;
  opportunities: { id: string; score: number; evidenceIds: string[] }[];
  sections: NarrativeOption[];
  explanations: OpportunityEvidenceContext[];
  coverage: number;
}
export const narrativeSchema = z
  .object({
    sections: z
      .array(
        z
          .object({
            id: z.string().max(80),
            variant: z.number().int().min(0).max(2),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    explanations: z
      .array(
        z
          .object({
            id: z.string().max(80),
            variant: z.number().int().min(0).max(2),
          })
          .strict(),
      )
      .max(7),
  })
  .strict();
export type NarrativeSelection = z.infer<typeof narrativeSchema>;
export interface StrategyNarrative {
  sections: StrategySection[];
  explanations: Record<string, string>;
}
export interface LLMProvider {
  parseBrief(input: string): Promise<ParsedCultureBrief>;
  planResearch(state: AgentState): Promise<ResearchPlan>;
  selectNextResearchStep(
    state: AgentState,
    candidates: ActionCandidate[],
  ): Promise<ResearchAction>;
  narrateStrategy(context: StrategyEvidenceContext): Promise<StrategyNarrative>;
  explainOpportunity(context: OpportunityEvidenceContext): Promise<string>;
}
export interface LanguageAssistant extends LLMProvider {
  readonly runtime: LanguageRuntime;
}
export function normalizeBrief(candidate: unknown): ParsedCultureBrief {
  const parsed = parsedBriefSchema.parse(candidate);
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  return parsedBriefSchema.parse({
    ...parsed,
    idea: clean(parsed.idea),
    audience: clean(parsed.audience),
    market: clean(parsed.market),
    category: clean(parsed.category),
    seeds: [...new Set(parsed.seeds.map(clean))],
    suggestedDimensions: [...new Set(parsed.suggestedDimensions)],
  });
}
export function validPlan(value: unknown, brief: Brief): ResearchPlan {
  const plan = planSchema.parse(value);
  if (new Set(plan.dimensions).size !== 5)
    throw new Error("Repeated dimensions");
  const words =
    `${brief.idea} ${brief.category}`.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  if (!words.some((word) => plan.anchorQuery.toLowerCase().includes(word)))
    throw new Error("Unsupported anchor query");
  return plan;
}
export function validatedAction(
  value: unknown,
  candidates: ActionCandidate[],
  state: AgentState,
): ResearchAction {
  const action = actionSchema.parse(value);
  if (action.action === "STOP_RESEARCH") {
    if (
      action.candidateId !== null ||
      state.coverage < 40 ||
      state.entities.length < 3
    )
      throw new Error("Insufficient evidence to stop");
    return action;
  }
  if (
    !candidates.some(
      (c) => c.id === action.candidateId && c.action === action.action,
    )
  )
    throw new Error("Unsupported research action");
  return action;
}
export const actionCategory = (category: Category) =>
  category === "place"
    ? ("INVESTIGATE_LOCATION" as const)
    : ("EXPLORE_AFFINITIES" as const);
