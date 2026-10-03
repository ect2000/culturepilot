import { conceptQuery, plannedDimensions } from "../agent/planner";
import type { AgentState } from "../types";
import type {
  LLMProvider,
  StrategyEvidenceContext,
  OpportunityEvidenceContext,
  ActionCandidate,
} from "./contracts";
import { LanguageError } from "./errors";
export class DeterministicFallbackProvider implements LLMProvider {
  async parseBrief(): Promise<never> {
    throw new LanguageError("FORM_REQUIRED");
  }
  async planResearch(state: AgentState) {
    return {
      dimensions: plannedDimensions(state.brief),
      anchorQuery: conceptQuery(state.brief),
    };
  }
  async selectNextResearchStep(
    _state: AgentState,
    candidates: ActionCandidate[],
  ) {
    const first = candidates[0];
    return first
      ? { action: first.action, candidateId: first.id }
      : { action: "STOP_RESEARCH" as const, candidateId: null };
  }
  async narrateStrategy(context: StrategyEvidenceContext) {
    return {
      sections: context.sections.map((s) => ({
        title: s.title,
        body: s.variants[0],
        evidenceIds: [...s.evidenceIds],
      })),
      explanations: Object.fromEntries(
        context.explanations.map((e) => [e.id, e.variants[0]]),
      ),
    };
  }
  async explainOpportunity(context: OpportunityEvidenceContext) {
    return context.variants[0];
  }
}
