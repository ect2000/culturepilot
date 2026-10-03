import type { AgentState, Anchor, Brief, Category } from "../types";
import { QlooError } from "../qloo/errors";
import { actionCategory, type ActionCandidate } from "../llm/contracts";

export function plannedDimensions(brief: Brief): Category[] {
  if (brief.objective === "Find locations")
    return ["place", "brand", "artist", "book", "movie"];
  if (/festival|music|artist/i.test(`${brief.idea} ${brief.category}`))
    return ["artist", "place", "brand", "movie", "podcast"];
  if (/skin|fashion|beauty|apparel/i.test(`${brief.idea} ${brief.category}`))
    return ["brand", "artist", "place", "movie", "book"];
  return ["brand", "place", "artist", "book", "movie"];
}
export function conceptQuery(brief: Brief): string {
  const input = `${brief.category} ${brief.idea}`.toLowerCase();
  const concepts: [RegExp, string][] = [
    [/coffee|café|cafe/, "coffee"],
    [/skin|beauty|cosmetic/, "skincare"],
    [/fitness|gym|workout/, "fitness"],
    [/music|festival/, "music"],
    [/fashion|apparel|clothing/, "fashion"],
    [/book|reading/, "books"],
    [/travel|hotel/, "travel"],
    [/food|restaurant|dining/, "dining"],
  ];
  return (
    concepts.find(([match]) => match.test(input))?.[1] ??
    brief.category.split(/[&,/]/)[0].trim().slice(0, 80)
  );
}
export function lexicalMatch(query: string, name: string): number {
  const normalize = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const q = normalize(query),
    n = normalize(name);
  if (q === n) return 1;
  const qt = q.split(" "),
    nt = n.split(" ");
  return (
    qt.filter((t) => nt.includes(t)).length / Math.max(qt.length, nt.length)
  );
}
export function selectAnchor(
  query: string,
  candidates: Anchor[],
  threshold = 0.7,
): Anchor | undefined {
  const ranked = candidates
    .map((a) => ({ a, score: lexicalMatch(query, a.name) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < threshold) return undefined;
  // Ambiguous equal matches are not silently turned into evidence.
  if (ranked[1]?.score === ranked[0].score && ranked[1].a.id !== ranked[0].a.id)
    return undefined;
  return ranked[0].a;
}
export interface ResearchTask {
  category: Category;
  anchor: Anchor;
  reason: string;
}
export function nextResearchTask(state: AgentState): ResearchTask | undefined {
  if (!state.anchors.length) return undefined;
  const done = state.steps.filter((s) => s.tool === "qloo.insights");
  const untouched = state.plannedDimensions.find(
    (c) => !done.some((s) => s.input["filter.type"] === `urn:entity:${c}`),
  );
  if (untouched)
    return {
      category: untouched,
      anchor: state.anchors[0],
      reason: `${untouched} has not been researched. Expand coverage from the resolved cultural anchor.`,
    };
  const coverage = state.plannedDimensions
    .map((category) => ({
      category,
      count: state.entities.filter((e) => e.category === category).length,
    }))
    .sort((a, b) => a.count - b.count);
  const candidates = state.entities
    .filter((e) => (e.affinity ?? 0) >= 0.35)
    .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
  for (const { category, count } of coverage) {
    for (const e of candidates) {
      if (
        e.category === category ||
        done.some(
          (s) =>
            s.input["filter.type"] === `urn:entity:${category}` &&
            s.input["signal.interests.entities"] === e.id,
        )
      )
        continue;
      const expansions = done.filter(
        (s) => s.input["signal.interests.entities"] === e.id,
      ).length;
      if (expansions >= 1) continue;
      return {
        category,
        anchor: {
          id: e.id,
          name: e.name,
          kind: "entity",
          category: e.category,
        },
        reason: `${category} has ${count} verified signals. Cross-check it using ${e.name}, a discovered ${e.category} affinity.`,
      };
    }
  }
  return undefined;
}
export function shouldStop(
  state: AgentState,
  maxSteps: number,
  maxCalls: number,
): string | undefined {
  if (state.steps.length >= maxSteps) return "Agent step budget reached";
  if (state.qlooCalls >= maxCalls) return "Qloo request budget reached";
  const expansions = state.steps.filter(
    (s) =>
      s.tool === "qloo.insights" &&
      s.input["signal.interests.entities"] &&
      !state.anchors.some((a) => a.id === s.input["signal.interests.entities"]),
  ).length;
  if (state.coverage >= 80 && state.entities.length >= 16 && expansions >= 2)
    return "Coverage target and cross-category verification reached";
  if (!nextResearchTask(state)) return "No remaining supported research path";
  return undefined;
}
export function checkBudget(
  state: AgentState,
  maxSteps: number,
  maxCalls: number,
) {
  if (state.steps.length >= maxSteps || state.qlooCalls >= maxCalls)
    throw new QlooError("BUDGET");
}

export function researchCandidates(state: AgentState): ActionCandidate[] {
  const defaultTask = nextResearchTask(state);
  if (!defaultTask) return [];
  const tasks: ResearchTask[] = [defaultTask];
  for (const category of state.plannedDimensions) {
    if (
      !state.steps.some(
        (s) =>
          s.tool === "qloo.insights" &&
          s.input["filter.type"] === `urn:entity:${category}`,
      ) &&
      category !== defaultTask.category
    )
      tasks.push({
        category,
        anchor: state.anchors[0],
        reason: `${category} has not been researched. Expand verified coverage from the resolved anchor.`,
      });
  }
  if (
    tasks.length === 1 &&
    state.plannedDimensions.every((category) =>
      state.steps.some(
        (s) =>
          s.tool === "qloo.insights" &&
          s.input["filter.type"] === `urn:entity:${category}`,
      ),
    )
  ) {
    const signals = state.entities
      .filter((e) => (e.affinity ?? 0) >= 0.35)
      .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
    for (const category of state.plannedDimensions)
      for (const entity of signals) {
        if (
          tasks.length >= 6 ||
          entity.category === category ||
          tasks.some(
            (t) => t.anchor.id === entity.id && t.category === category,
          ) ||
          state.steps.some(
            (s) =>
              s.tool === "qloo.insights" &&
              s.input["signal.interests.entities"] === entity.id,
          )
        )
          continue;
        tasks.push({
          category,
          anchor: {
            id: entity.id,
            name: entity.name,
            kind: "entity",
            category: entity.category,
          },
          reason: `Cross-check ${category} using a verified ${entity.category} signal. Current coverage contains ${state.entities.filter((e) => e.category === category).length} ${category} entities.`,
        });
      }
  }
  return tasks
    .slice(0, 6)
    .map((task, i) => ({
      id: `candidate-${i + 1}`,
      action: state.anchors.some((a) => a.id === task.anchor.id)
        ? actionCategory(task.category)
        : "EXPAND_CLUSTER",
      task,
    }));
}
