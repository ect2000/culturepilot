import type { AgentState, StrategySection } from "../types";
import { categoryNames } from "../types";
export interface StrategyNarrator {
  narrate(state: AgentState): StrategySection[];
}
export class DeterministicNarrator implements StrategyNarrator {
  narrate(state: AgentState): StrategySection[] {
    const best = state.opportunities[0];
    if (!best) return [];
    const all = state.opportunities.flatMap((o) => o.evidenceIds).slice(0, 8);
    const anchorNames = state.anchors.map((a) => a.name).join(", ");
    const top = state.entities
      .filter((e) => e.affinity !== null)
      .sort((a, b) => b.affinity! - a.affinity!)
      .slice(0, 3);
    const strategy: StrategySection[] = [
      {
        title: "Market position",
        body: `Position ${state.brief.idea.toLowerCase()} through the cultural territory around ${anchorNames}. In ${state.brief.market}, test ${best.title.toLowerCase()} before committing a larger budget.`,
        evidenceIds: best.evidenceIds,
      },
      {
        title: "Audience profile",
        body: `Your intended audience is ${state.brief.audience.toLowerCase()}. Research describes affinities around ${anchorNames}, not a validated description of every member of that audience.`,
        evidenceIds: state.anchors.map((a) => a.id),
      },
      {
        title: "Cultural territory",
        body: `${top.map((e) => e.name).join(", ")} are among the strongest scored results. Explore how these signals connect your idea across ${state.researchedDimensions.map((c) => categoryNames[c].toLowerCase()).join(", ")}.`,
        evidenceIds: top.map((e) => e.id),
      },
      {
        title: "Brand direction",
        body: `Build an original creative direction with references from ${top
          .slice(0, 2)
          .map((e) => e.name)
          .join(
            " and ",
          )}. Use interviews to confirm tone, and check intellectual-property permissions before using third-party assets.`,
        evidenceIds: top.slice(0, 2).map((e) => e.id),
      },
    ];
    for (const opportunity of state.opportunities)
      strategy.push({
        title: opportunity.title,
        body: opportunity.action,
        evidenceIds: opportunity.evidenceIds,
      });
    strategy.push({
      title: "Launch actions",
      body: `For your goal to ${state.brief.objective.toLowerCase()}: 1. Interview five prospective customers about the resolved anchors. 2. Test one activation from the top opportunity. 3. Track qualified interest and conversion. 4. Keep, revise or reject the hypothesis using observed outcomes.`,
      evidenceIds: best.evidenceIds,
    });
    strategy.push({
      title: "Risks & uncertain signals",
      body: `Affinity is not causality, intent to buy or willingness to pay. ${state.coverage < 100 ? "Some planned categories returned no evidence. " : ""}The ${state.confidence}/100 evidence-confidence index measures research coverage and density, not statistical certainty. Validate price, competition and local demand separately.`,
      evidenceIds: all,
    });
    return strategy;
  }
}
