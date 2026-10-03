import type { AgentEvent, AgentState, Brief, ResearchStep } from "../types";
import type { QlooTools } from "../qloo/client";
import { ageSignal, insightsParams } from "../qloo/client";
import { QlooError } from "../qloo/errors";
import { addAnchor, addResearchResults } from "./graph";
import {
  checkBudget,
  conceptQuery,
  nextResearchTask,
  plannedDimensions,
  selectAnchor,
  shouldStop,
  researchCandidates,
} from "./planner";
import { buildOpportunities, evidenceConfidence } from "./scoring";
import type { StrategyNarrator } from "./narrator";
import type { LanguageAssistant } from "../llm/contracts";
import { SafeLanguageAssistant } from "../llm/assistant";
import { evidenceLedger, strategyContext } from "../llm/grounding";

export interface EngineOptions {
  maxSteps: number;
  maxCalls: number;
  signal?: AbortSignal;
  narrator?: StrategyNarrator;
  language?: LanguageAssistant;
}
export async function runAgent(
  id: string,
  brief: Brief,
  tools: QlooTools,
  options: EngineOptions,
  emit: (event: AgentEvent) => void,
): Promise<AgentState> {
  const start = Date.now();
  const language = options.language ?? new SafeLanguageAssistant();
  const state: AgentState = {
    id,
    brief,
    status: "researching",
    anchors: [],
    plannedDimensions: plannedDimensions(brief),
    researchedDimensions: [],
    entities: [],
    nodes: [
      {
        id: "brief",
        name: brief.idea,
        type: "brief",
        source: "user",
        score: null,
      },
    ],
    edges: [],
    opportunities: [],
    strategy: [],
    steps: [],
    coverage: 0,
    confidence: 0,
    culturalFit: 0,
    qlooCalls: 0,
    startedAt: new Date(start).toISOString(),
    durationMs: 0,
    limitations: [
      "Qloo affinities are aggregate taste relationships, not individual predictions or causal evidence.",
      "Audience occupation and descriptive traits are brief context, not validated Qloo demographic filters.",
      "Only place results are constrained to the market. Other categories describe broader cultural affinities.",
    ],
  };
  if (ageSignal(brief.audience))
    state.limitations.push(
      `Age input maps to Qloo bins: ${ageSignal(brief.audience)}. These bins can be broader than the requested age range.`,
    );
  const publish = () => {
    state.qlooCalls = tools.calls ?? state.qlooCalls;
    state.durationMs = Date.now() - start;
    state.language = language.runtime;
    state.evidence = evidenceLedger(state);
    for (const [i, s] of state.steps.entries()) {
      s.stepNumber = i + 1;
      s.actor ??= s.tool.startsWith("qloo.")
        ? "QLOO"
        : s.tool === "scorer"
          ? "SCORING_ENGINE"
          : "AGENT";
      s.action ??=
        s.tool === "qloo.search"
          ? "SEARCH_QLOO_ENTITIES"
          : s.tool === "qloo.tags"
            ? "DISCOVER_ANCHOR"
            : s.tool === "qloo.insights"
              ? "EXPLORE_AFFINITIES"
              : s.tool === "scorer"
                ? "RANK_AND_NARRATE"
                : "PLAN_RESEARCH";
      s.inputSummary ??= Object.entries(s.input)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
        .slice(0, 600);
      s.outputSummary =
        s.message ?? `${s.resultCount} returned; ${s.selectedCount} accepted`;
      s.evidenceAdded = state.edges.filter(
        (e) => e.sourceType === "qloo" && e.stepId === s.id,
      ).length;
    }
    emit({ type: "state", state: structuredClone(state) });
  };
  const step = async <T>(
    title: string,
    tool: ResearchStep["tool"],
    input: Record<string, string>,
    reason: string,
    work: () => Promise<T[]>,
  ): Promise<{ values: T[]; id: string }> => {
    if (options.signal?.aborted) throw new QlooError("CANCELLED");
    checkBudget(state, options.maxSteps, options.maxCalls);
    const s: ResearchStep = {
      id: `step-${state.steps.length + 1}`,
      title,
      tool,
      input,
      reason,
      status: "running",
      resultCount: 0,
      selectedCount: 0,
      durationMs: 0,
    };
    state.steps.push(s);
    state.qlooCalls++;
    publish();
    const started = Date.now();
    try {
      const values = await work();
      s.resultCount = values.length;
      s.status = values.length ? "complete" : "empty";
      s.durationMs = Date.now() - started;
      return { values, id: s.id };
    } catch (error) {
      s.status = "error";
      s.durationMs = Date.now() - started;
      s.message =
        error instanceof QlooError ? error.message : "Research request failed.";
      throw error;
    }
  };
  try {
    state.steps.push({
      id: "step-1",
      title: "Interpreted your strategy brief",
      tool: "analyzer",
      input: {
        market: brief.market,
        objective: brief.objective,
        concept: conceptQuery(brief),
      },
      reason:
        "Choose supported categories and resolve cultural interests before requesting affinities.",
      status: "running",
      resultCount: state.plannedDimensions.length,
      selectedCount: state.plannedDimensions.length,
      durationMs: Date.now() - start,
    });
    publish();
    const plan = await language.planResearch(state);
    if (options.signal?.aborted) throw new QlooError("CANCELLED");
    state.plannedDimensions = plan.dimensions;
    state.steps[0].status = "complete";
    state.steps[0].actor =
      language.runtime.mode === "assisted" ? "OPENROUTER" : "AGENT";
    state.steps[0].durationMs = Date.now() - start;
    state.steps[0].message = `Brief understood. Research plan created across ${plan.dimensions.join(", ")}. ${language.runtime.status}`;
    publish();
    for (const seed of brief.seeds) {
      const response = await step(
        `Resolve seed: ${seed}`,
        "qloo.search",
        { query: seed, take: "5" },
        "A user-supplied named entity provides a precise cultural anchor.",
        () => tools.search(seed),
      );
      const anchor = selectAnchor(
        seed,
        response.values.map((e) => ({
          id: e.id,
          name: e.name,
          kind: "entity" as const,
          category: e.category,
        })),
        0.85,
      );
      if (anchor) {
        addAnchor(state, anchor, response.id);
        state.steps.at(-1)!.selectedCount = 1;
      } else
        state.limitations.push(
          `Seed '${seed}' was not resolved unambiguously and was excluded. Try its exact Qloo entity name.`,
        );
      publish();
    }
    if (!state.anchors.length) {
      const query = plan.anchorQuery;
      const response = await step(
        `Discover cultural anchor: ${query}`,
        "qloo.tags",
        { "filter.query": query, take: "5" },
        "Map the business category to a Qloo-supported interest tag; reject weak or ambiguous lexical matches.",
        () => tools.tags(query),
      );
      const anchor = selectAnchor(query, response.values);
      if (anchor) {
        addAnchor(state, anchor, response.id);
        state.steps.at(-1)!.selectedCount = 1;
      }
      publish();
    }
    if (!state.anchors.length) throw new QlooError("EMPTY");
    if (state.anchors.length > 1)
      state.limitations.push(
        "Initial discovery uses the first resolved seed. Additional seeds provide brief context; they are not automatically combined into one audience.",
      );
    let languageSelections = 0;
    while (true) {
      const stop = shouldStop(state, options.maxSteps - 1, options.maxCalls);
      if (stop) {
        state.stopReason = stop;
        break;
      }
      let task = nextResearchTask(state)!;
      let plannerActor: "AGENT" | "OPENROUTER" = "AGENT";
      if (
        languageSelections === 0 ||
        (languageSelections === 1 &&
          state.researchedDimensions.length >= state.plannedDimensions.length)
      ) {
        const candidates = researchCandidates(state);
        const action = await language.selectNextResearchStep(state, candidates);
        languageSelections++;
        if (options.signal?.aborted) throw new QlooError("CANCELLED");
        if (action.action === "STOP_RESEARCH") {
          state.stopReason =
            "Validated planner stop with sufficient Qloo evidence";
          break;
        }
        const selected = candidates.find((c) => c.id === action.candidateId);
        if (selected) task = selected.task;
        plannerActor =
          language.runtime.mode === "assisted" ? "OPENROUTER" : "AGENT";
      }
      const response = await step(
        `Explore ${task.category} affinities`,
        "qloo.insights",
        insightsParams(task.category, task.anchor, brief),
        task.reason,
        () => tools.insights(task.category, task.anchor, brief),
      );
      addResearchResults(
        state,
        response.values,
        task.anchor,
        task.category,
        response.id,
      );
      state.steps.at(-1)!.plannerActor = plannerActor;
      state.steps.at(-1)!.action =
        task.category === "place"
          ? "INVESTIGATE_LOCATION"
          : state.anchors.some((a) => a.id === task.anchor.id)
            ? "EXPLORE_AFFINITIES"
            : "EXPAND_CLUSTER";
      state.steps.at(-1)!.selectedCount = response.values.filter(
        (e) => e.id !== task.anchor.id && e.affinity !== null,
      ).length;
      state.steps.at(-1)!.message =
        `Found ${response.values.length} scored ${task.category} affinities from ${task.anchor.name}.`;
      publish();
    }
    if (
      state.entities.length < 3 ||
      state.edges.filter((e) => e.relation === "affinity").length < 3
    )
      throw new QlooError("EMPTY");
    state.opportunities = buildOpportunities(state);
    state.culturalFit = Math.round(
      state.opportunities.reduce((s, o) => s + o.score, 0) /
        Math.max(1, state.opportunities.length),
    );
    state.confidence = evidenceConfidence(
      state.edges.filter((e) => e.relation === "affinity").length,
      state.researchedDimensions.length,
      state.coverage,
    );
    const synthesisId = `step-${state.steps.length + 1}`;
    state.steps.push({
      id: synthesisId,
      title:
        "Building Culture Graph, ranking opportunities and generating strategy",
      tool: "scorer",
      input: {
        narrator: language.runtime.mode,
        weights: "affinity=.50,density=.20,breadth=.20,geography=.10",
      },
      reason: state.stopReason ?? "Research complete",
      status: "running",
      resultCount: state.opportunities.length,
      selectedCount: state.opportunities.length,
      durationMs: 0,
    });
    publish();
    const synthesisStarted = Date.now();
    if (options.narrator) state.strategy = options.narrator.narrate(state);
    else {
      const narrative = await language.narrateStrategy(strategyContext(state));
      state.strategy = narrative.sections;
      state.explanations = narrative.explanations;
    }
    if (options.signal?.aborted) throw new QlooError("CANCELLED");
    state.steps.at(-1)!.status = "complete";
    state.steps.at(-1)!.durationMs = Date.now() - synthesisStarted;
    state.steps.at(-1)!.input.narrator = language.runtime.mode;
    state.steps.at(-1)!.message =
      `Graph built and opportunities ranked deterministically. ${language.runtime.status}`;
    for (const o of state.opportunities) {
      state.nodes.push({
        id: o.id,
        name: o.title,
        type: "opportunity",
        category: o.category,
        score: o.score / 100,
        source: "derived",
      });
      for (const target of o.evidenceIds.slice(0, 4))
        state.edges.push({
          id: `${o.id}:${target}`,
          source: target,
          target: o.id,
          relation: "supports",
          weight: null,
          sourceType: "derived",
          stepId: synthesisId,
          geographic: false,
        });
    }
    state.status = "complete";
    publish();
    state.durationMs = Date.now() - start;
    emit({ type: "done", state: structuredClone(state) });
  } catch (error) {
    const safe =
      error instanceof QlooError ? error : new QlooError("UNAVAILABLE");
    state.qlooCalls = tools.calls ?? state.qlooCalls;
    state.status = "error";
    state.error = { code: safe.code, message: safe.message };
    publish();
    state.durationMs = Date.now() - start;
    emit({ type: "done", state: structuredClone(state) });
  }
  return state;
}
