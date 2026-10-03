import type { AgentState, Anchor, Category, Entity } from "../types";
import { deduplicateEntities } from "../qloo/normalizer";

export function addAnchor(state: AgentState, anchor: Anchor, stepId: string) {
  if (!state.anchors.some((a) => a.id === anchor.id))
    state.anchors.push(anchor);
  if (!state.nodes.some((n) => n.id === anchor.id))
    state.nodes.push({
      id: anchor.id,
      name: anchor.name,
      type: "seed",
      category: anchor.category,
      score: null,
      source: "qloo",
    });
  if (!state.edges.some((e) => e.source === "brief" && e.target === anchor.id))
    state.edges.push({
      id: `brief:${anchor.id}`,
      source: "brief",
      target: anchor.id,
      relation: "brief-anchor",
      weight: null,
      sourceType: "derived",
      stepId,
      geographic: false,
    });
}
export function addResearchResults(
  state: AgentState,
  entities: Entity[],
  anchor: Anchor,
  category: Category,
  stepId: string,
) {
  const verified = entities.filter(
    (e) => e.id !== anchor.id && e.affinity !== null,
  );
  state.entities = deduplicateEntities([...state.entities, ...verified]);
  const clusterId = `cluster:${category}`;
  if (verified.length && !state.nodes.some((n) => n.id === clusterId)) {
    state.nodes.push({
      id: clusterId,
      name: category,
      type: "cluster",
      category,
      score: null,
      source: "derived",
      description:
        "Category grouping derived from the types of returned Qloo entities. Membership does not imply additional affinity evidence.",
    });
  }
  if (!state.nodes.some((n) => n.id === anchor.id))
    state.nodes.push({
      id: anchor.id,
      name: anchor.name,
      type: "entity",
      category: anchor.category,
      score: null,
      source: "qloo",
    });
  for (const e of verified) {
    if (e.id === anchor.id || e.affinity === null) continue;
    const old = state.nodes.find((n) => n.id === e.id);
    if (!old)
      state.nodes.push({
        id: e.id,
        name: e.name,
        type: "entity",
        category: e.category,
        score: e.affinity,
        source: "qloo",
        description: e.description,
      });
    else old.score = Math.max(old.score ?? 0, e.affinity);
    const id = `${stepId}:${anchor.id}:${e.id}`;
    if (!state.edges.some((edge) => edge.id === id))
      state.edges.push({
        id,
        source: anchor.id,
        target: e.id,
        relation: "affinity",
        weight: e.affinity,
        sourceType: "qloo",
        stepId,
        geographic: category === "place",
      });
    const membershipId = `${clusterId}:${e.id}`;
    if (!state.edges.some((edge) => edge.id === membershipId))
      state.edges.push({
        id: membershipId,
        source: e.id,
        target: clusterId,
        relation: "membership",
        weight: null,
        sourceType: "derived",
        stepId,
        geographic: false,
      });
  }
  if (verified.length && !state.researchedDimensions.includes(category))
    state.researchedDimensions.push(category);
  state.coverage = Math.round(
    (100 * state.researchedDimensions.length) / state.plannedDimensions.length,
  );
}
