import { z } from "zod";

export const categories = [
  "brand",
  "place",
  "artist",
  "book",
  "movie",
  "podcast",
  "tv_show",
] as const;
export type Category = (typeof categories)[number];
export const categoryNames: Record<Category, string> = {
  brand: "Brands",
  place: "Places & dining",
  artist: "Music & artists",
  book: "Books",
  movie: "Film",
  podcast: "Podcasts",
  tv_show: "Television",
};
export const objectives = [
  "Launch a product",
  "Position a brand",
  "Find partnerships",
  "Plan a campaign",
  "Explore a market",
  "Find locations",
] as const;
const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "Remove control characters.",
    );
export const briefSchema = z
  .object({
    idea: text(8, 500),
    audience: text(5, 300),
    market: text(2, 120),
    category: text(2, 100),
    objective: z.enum(objectives),
    seeds: z.array(text(2, 100)).max(3).default([]),
  })
  .strict();
export type Brief = z.infer<typeof briefSchema>;
export const demoBrief: Brief = {
  idea: "A premium specialty coffee brand",
  audience: "Urban professionals aged 25–35",
  market: "Madrid, Spain",
  category: "Coffee & hospitality",
  objective: "Launch a product",
  seeds: [],
};

export interface Entity {
  id: string;
  name: string;
  category: Category;
  affinity: number | null;
  description?: string;
  address?: string;
  tags: string[];
}
export interface Anchor {
  id: string;
  name: string;
  kind: "entity" | "tag";
  category?: Category;
}
export interface CultureNode {
  id: string;
  name: string;
  type: "brief" | "seed" | "cluster" | "entity" | "opportunity";
  category?: Category;
  score: number | null;
  source: "qloo" | "derived" | "user";
  description?: string;
}
export interface CultureEdge {
  id: string;
  source: string;
  target: string;
  relation: "brief-anchor" | "affinity" | "supports" | "membership";
  weight: number | null;
  sourceType: "qloo" | "derived";
  stepId: string;
  geographic: boolean;
}
export interface ResearchStep {
  id: string;
  title: string;
  status: "running" | "complete" | "empty" | "error";
  tool: "analyzer" | "qloo.tags" | "qloo.search" | "qloo.insights" | "scorer";
  input: Record<string, string>;
  reason: string;
  resultCount: number;
  selectedCount: number;
  durationMs: number;
  message?: string;
  stepNumber?: number;
  actor?: "AGENT" | "OPENROUTER" | "QLOO" | "GRAPH_ENGINE" | "SCORING_ENGINE";
  action?: string;
  inputSummary?: string;
  outputSummary?: string;
  evidenceAdded?: number;
  plannerActor?: "AGENT" | "OPENROUTER";
}
export interface Evidence {
  id: string;
  qlooEntityId: string;
  entityName: string;
  category?: Category;
  affinity: number | null;
  source: "qloo";
  relatedEntities: {
    id: string;
    affinity: number;
    stepId: string;
    edgeId: string;
  }[];
}
export interface LanguageRuntime {
  mode: "deterministic" | "assisted" | "fallback";
  status: string;
  model?: string;
  calls: number;
  strategyDurationMs: number;
}
export interface ScoreBreakdown {
  affinity: number;
  evidenceDensity: number;
  crossCategorySupport: number;
  geographicRelevance: number;
}
export interface Opportunity {
  id: string;
  title: string;
  category: Category;
  score: number;
  description: string;
  action: string;
  evidenceIds: string[];
  edgeIds: string[];
  breakdown: ScoreBreakdown;
  confidence: number;
  reasoning: string[];
}
export interface StrategySection {
  title: string;
  body: string;
  evidenceIds: string[];
}
export interface AgentState {
  id: string;
  brief: Brief;
  status: "researching" | "complete" | "error";
  anchors: Anchor[];
  plannedDimensions: Category[];
  researchedDimensions: Category[];
  entities: Entity[];
  nodes: CultureNode[];
  edges: CultureEdge[];
  opportunities: Opportunity[];
  strategy: StrategySection[];
  steps: ResearchStep[];
  coverage: number;
  confidence: number;
  culturalFit: number;
  qlooCalls: number;
  startedAt: string;
  durationMs: number;
  limitations: string[];
  error?: { code: string; message: string };
  stopReason?: string;
  evidence?: Evidence[];
  language?: LanguageRuntime;
  explanations?: Record<string, string>;
}
export type AgentEvent =
  { type: "state"; state: AgentState } | { type: "done"; state: AgentState };
