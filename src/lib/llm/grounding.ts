import type { AgentState, Evidence } from "../types";
import { DeterministicNarrator } from "../agent/narrator";
import {
  narrativeSchema,
  type StrategyEvidenceContext,
  type StrategyNarrative,
  type OpportunityEvidenceContext,
} from "./contracts";

export function evidenceLedger(state: AgentState): Evidence[] {
  const entities: Evidence[] = state.entities.map((e) => ({
    id: e.id,
    qlooEntityId: e.id,
    entityName: e.name,
    category: e.category,
    affinity: e.affinity,
    source: "qloo",
    relatedEntities: state.edges
      .filter(
        (edge) =>
          edge.relation === "affinity" &&
          edge.target === e.id &&
          edge.weight !== null,
      )
      .map((edge) => ({
        id: edge.source,
        affinity: edge.weight!,
        stepId: edge.stepId,
        edgeId: edge.id,
      })),
  }));
  for (const anchor of state.anchors)
    if (!entities.some((e) => e.id === anchor.id))
      entities.push({
        id: anchor.id,
        qlooEntityId: anchor.id,
        entityName: anchor.name,
        category: anchor.category,
        affinity: null,
        source: "qloo",
        relatedEntities: [],
      });
  return entities;
}
// The model selects authored, evidence-grounded language. It never supplies prose,
// entity IDs, scores or graph mutations. This is stronger than prompt-only grounding.
export function strategyContext(state: AgentState): StrategyEvidenceContext {
  const evidence = evidenceLedger(state);
  const known = new Set(evidence.map((e) => e.id));
  const sections = new DeterministicNarrator()
    .narrate(state)
    .map((section, i) => {
      if (
        !section.evidenceIds.length ||
        section.evidenceIds.some((id) => !known.has(id))
      )
        throw new Error("Unknown strategy evidence");
      const proposal = state.opportunities.find(
        (o) => o.title === section.title,
      );
      const variants = [
        section.body,
        proposal
          ? `Start with a small experiment. ${proposal.action} These Qloo signals are references for testing, rather than evidence of purchase intent.`
          : `Strategy direction: ${section.body}`,
        proposal
          ? `Treat this as a partnership or creative hypothesis. ${proposal.action} Validate the outcome with prospective customers before scaling.`
          : `For your next decision, use this evidence as a hypothesis. ${section.body}`,
      ];
      return {
        id: `section-${i + 1}`,
        title: section.title,
        evidenceIds: [...section.evidenceIds],
        variants,
      };
    });
  const explanations: OpportunityEvidenceContext[] = state.opportunities.map(
    (o) => ({
      id: o.id,
      evidenceIds: [...o.evidenceIds],
      variants: [
        `This opportunity ranks at ${o.score}/100 using ${o.edgeIds.length} Qloo affinity relationships. ${o.reasoning[3]} The recommendation is a hypothesis to test.`,
        `Qloo supplies the relationships; CulturePilot calculates the ${o.score}/100 score from affinity, evidence density, category breadth and geographic relevance. Inspect the supporting requests below before acting.`,
        `Prioritize this as a small test, supported by ${o.edgeIds.length} observed Qloo relationships. The deterministic score is ${o.score}/100; it does not predict commercial success.`,
      ],
    }),
  );
  return {
    brief: structuredClone(state.brief),
    evidence,
    opportunities: state.opportunities.map((o) => ({
      id: o.id,
      score: o.score,
      evidenceIds: [...o.evidenceIds],
    })),
    sections,
    explanations,
    coverage: state.coverage,
  };
}
export function resolveNarrative(
  candidate: unknown,
  context: StrategyEvidenceContext,
): StrategyNarrative {
  const selected = narrativeSchema.parse(candidate);
  const known = new Set(context.evidence.map((e) => e.id));
  const sectionIds = selected.sections.map((s) => s.id);
  if (
    new Set(sectionIds).size !== sectionIds.length ||
    sectionIds.length !== context.sections.length ||
    context.sections.some((s) => !sectionIds.includes(s.id))
  )
    throw new Error("Incomplete narrative");
  if (
    new Set(selected.explanations.map((e) => e.id)).size !==
    selected.explanations.length
  )
    throw new Error("Repeated explanation");
  const sections = context.sections.map((section) => {
    const choice = selected.sections.find((s) => s.id === section.id)!;
    if (
      section.evidenceIds.some((id) => !known.has(id)) ||
      !section.evidenceIds.length ||
      !section.variants[choice.variant]
    )
      throw new Error("Unknown evidence or variant");
    return {
      title: section.title,
      body: section.variants[choice.variant],
      evidenceIds: [...section.evidenceIds],
    };
  });
  const explanations: Record<string, string> = {};
  for (const selection of selected.explanations) {
    const option = context.explanations.find((e) => e.id === selection.id);
    if (
      !option ||
      option.evidenceIds.some((id) => !known.has(id)) ||
      !option.variants[selection.variant]
    )
      throw new Error("Unknown explanation evidence");
    explanations[option.id] = option.variants[selection.variant];
  }
  return { sections, explanations };
}
