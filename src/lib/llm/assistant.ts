import type { AgentState, LanguageRuntime } from "../types";
import { DeterministicFallbackProvider } from "./fallback";
import {
  actionSchema,
  normalizeBrief,
  validPlan,
  validatedAction,
  type LLMProvider,
  type LanguageAssistant,
  type ActionCandidate,
  type StrategyEvidenceContext,
  type OpportunityEvidenceContext,
  type StrategyNarrative,
} from "./contracts";
import { LanguageError } from "./errors";

export class SafeLanguageAssistant implements LanguageAssistant {
  private fallback = new DeterministicFallbackProvider();
  private failed = false;
  private status: LanguageRuntime;
  constructor(
    private readonly provider?: LLMProvider & {
      readonly calls?: number;
      readonly lastModel?: string;
    },
    configurationError?: LanguageError,
  ) {
    this.status = {
      mode: configurationError ? "fallback" : "deterministic",
      status:
        configurationError?.message ??
        (provider
          ? "Optional language assistant ready."
          : "Optional language key is not configured. Using deterministic mode."),
      calls: 0,
      strategyDurationMs: 0,
    };
    if (configurationError) this.failed = true;
  }
  get runtime(): LanguageRuntime {
    return {
      ...this.status,
      calls: this.provider?.calls ?? this.status.calls,
      model: this.provider?.lastModel,
    };
  }
  private async safely<T>(
    work: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    if (!this.provider || this.failed) return fallback();
    try {
      const value = await work();
      this.status.mode = "assisted";
      this.status.status =
        "Free language assistance active. Qloo evidence remains authoritative.";
      return value;
    } catch (error) {
      this.failed = true;
      this.status.mode = "fallback";
      this.status.status =
        error instanceof LanguageError
          ? error.message
          : new LanguageError("INVALID_OUTPUT").message;
      return fallback();
    }
  }
  async parseBrief(input: string) {
    return this.safely(
      async () => normalizeBrief(await this.provider!.parseBrief(input)),
      () => this.fallback.parseBrief(),
    );
  }
  async planResearch(state: AgentState) {
    return this.safely(
      async () =>
        validPlan(
          await this.provider!.planResearch(structuredClone(state)),
          state.brief,
        ),
      () => this.fallback.planResearch(state),
    );
  }
  async selectNextResearchStep(
    state: AgentState,
    candidates: ActionCandidate[],
  ) {
    return this.safely(
      async () =>
        validatedAction(
          actionSchema.parse(
            await this.provider!.selectNextResearchStep(
              structuredClone(state),
              structuredClone(candidates),
            ),
          ),
          candidates,
          state,
        ),
      () => this.fallback.selectNextResearchStep(state, candidates),
    );
  }
  async narrateStrategy(context: StrategyEvidenceContext) {
    const start = Date.now();
    const result = await this.safely(
      async () => {
        const value: StrategyNarrative = await this.provider!.narrateStrategy(
          structuredClone(context),
        );
        if (value.sections.length !== context.sections.length)
          throw new LanguageError("INVALID_OUTPUT");
        for (let i = 0; i < value.sections.length; i++) {
          const actual = value.sections[i],
            expected = context.sections[i];
          if (
            actual.title !== expected.title ||
            !expected.variants.includes(actual.body) ||
            JSON.stringify(actual.evidenceIds) !==
              JSON.stringify(expected.evidenceIds)
          )
            throw new LanguageError("INVALID_OUTPUT");
        }
        for (const [id, explanation] of Object.entries(value.explanations)) {
          if (
            !context.explanations
              .find((e) => e.id === id)
              ?.variants.includes(explanation)
          )
            throw new LanguageError("INVALID_OUTPUT");
        }
        return {
          sections: value.sections.map((s) => ({
            title: s.title,
            body: s.body,
            evidenceIds: [...s.evidenceIds],
          })),
          explanations: { ...value.explanations },
        };
      },
      () => this.fallback.narrateStrategy(context),
    );
    this.status.strategyDurationMs = Date.now() - start;
    return result;
  }
  async explainOpportunity(context: OpportunityEvidenceContext) {
    return this.safely(
      async () => {
        const value = await this.provider!.explainOpportunity(
          structuredClone(context),
        );
        if (!context.variants.includes(value) || !context.evidenceIds.length)
          throw new LanguageError("INVALID_OUTPUT");
        return value;
      },
      () => this.fallback.explainOpportunity(context),
    );
  }
}
