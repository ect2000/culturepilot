import {
  categoryNames,
  type AgentState,
  type Category,
  type Opportunity,
  type ScoreBreakdown,
} from "../types";

export function unit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
export function opportunityScore(b: ScoreBreakdown): number {
  return Math.round(
    100 *
      (0.5 * unit(b.affinity) +
        0.2 * unit(b.evidenceDensity) +
        0.2 * unit(b.crossCategorySupport) +
        0.1 * unit(b.geographicRelevance)),
  );
}
export function evidenceConfidence(
  evidenceCount: number,
  categoryCount: number,
  coverage: number,
): number {
  return Math.round(
    100 *
      (0.4 * unit(evidenceCount / 20) +
        0.35 * unit(categoryCount / 5) +
        0.25 * unit(coverage / 100)),
  );
}
const actions: Record<Category, { title: string; verb: string; plan: string }> =
  {
    brand: {
      title: "Build a partnership shortlist",
      verb: "Evaluate a collaboration",
      plan: "Compare audience fit, price position and brand values, then test one small collaboration before a larger commitment.",
    },
    place: {
      title: "Meet your audience in place",
      verb: "Test a local activation",
      plan: "Visit shortlisted venues, verify access and commercial terms, and run a small event with attendance and conversion tracking.",
    },
    artist: {
      title: "Set the cultural soundtrack",
      verb: "Explore a music-led campaign",
      plan: "Test the creative direction with audience interviews. Secure permissions before using an artist's identity or recordings.",
    },
    book: {
      title: "Create a story worth sharing",
      verb: "Explore an editorial experience",
      plan: "Use these reading affinities to shape a discussion or editorial theme; validate the concept with a small audience before production.",
    },
    movie: {
      title: "Find your visual territory",
      verb: "Test a film-inspired direction",
      plan: "Translate the cultural territory into original creative work. Compare two concepts and measure qualified engagement; license any referenced assets.",
    },
    podcast: {
      title: "Join the conversations that matter",
      verb: "Evaluate a podcast partnership",
      plan: "Check the actual audience and advertising terms with the publisher, then test a small placement with a trackable landing page.",
    },
    tv_show: {
      title: "Turn shared stories into a campaign",
      verb: "Test a shared-story theme",
      plan: "Develop original storytelling around the observed cultural territory and test recall; obtain licenses for any third-party material.",
    },
  };
export function buildOpportunities(state: AgentState): Opportunity[] {
  return state.researchedDimensions
    .flatMap((category) => {
      const primary = state.entities
        .filter((e) => e.category === category && e.affinity !== null)
        .sort((a, b) => b.affinity! - a.affinity!)
        .slice(0, 4);
      if (!primary.length) return [];
      const primaryIds = new Set(primary.map((e) => e.id));
      const relevant = state.edges.filter(
        (e) => e.relation === "affinity" && primaryIds.has(e.target),
      );
      const relatedIds = new Set([
        ...primaryIds,
        ...relevant.map((e) => e.source),
      ]);
      const support = state.entities.filter((e) => relatedIds.has(e.id));
      const cats = new Set(support.map((e) => e.category));
      // Average actual edge affinity; do not reuse the highest entity score from another request.
      const affinity = relevant.length
        ? relevant.reduce((sum, e) => sum + (e.weight ?? 0), 0) /
          relevant.length
        : 0;
      const b: ScoreBreakdown = {
        affinity,
        evidenceDensity: unit(relevant.length / 6),
        crossCategorySupport: unit(cats.size / 5),
        geographicRelevance: relevant.some((e) => e.geographic) ? 1 : 0,
      };
      const a = actions[category];
      const names = primary
        .slice(0, 3)
        .map((e) => e.name)
        .join(", ");
      const description = `${a.verb} around ${names}. These are Qloo affinity signals for the resolved taste profile; the business opportunity is a CulturePilot interpretation.`;
      return [
        {
          id: `opportunity:${category}`,
          title: a.title,
          category,
          score: opportunityScore(b),
          description,
          action: a.plan,
          evidenceIds: [...relatedIds],
          edgeIds: relevant.map((e) => e.id),
          breakdown: b,
          confidence: evidenceConfidence(
            relevant.length,
            cats.size,
            state.coverage,
          ),
          reasoning: [
            `Resolved anchor: ${state.anchors.map((a) => a.name).join(", ")}.`,
            `${relevant.length} observed Qloo relationships support ${primary.length} ${categoryNames[category].toLowerCase()} candidates.`,
            `${cats.size} connected entity categories contribute context. Repeated signals can be correlated; categories are not independent studies.`,
            b.geographicRelevance
              ? `Place results were constrained by Qloo to ${state.brief.market}. Verify real-world availability.`
              : "These cultural affinities are not geographically verified or evidence of local market demand.",
            "Treat this opportunity as a hypothesis to test, not a predicted commercial outcome.",
          ],
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
