import { describe, it, expect, vi } from "vitest";
import { demoBrief, type AgentEvent, type AgentState } from "../src/lib/types";
import { runAgent } from "../src/lib/agent/engine";
import {
  plannedDimensions,
  nextResearchTask,
  selectAnchor,
} from "../src/lib/agent/planner";
import { addAnchor, addResearchResults } from "../src/lib/agent/graph";
import {
  unit,
  opportunityScore,
  evidenceConfidence,
} from "../src/lib/agent/scoring";
import { DeterministicNarrator } from "../src/lib/agent/narrator";
import { QlooError } from "../src/lib/qloo/errors";
import { TestTools, entities, anchor, reportFixture } from "./fixtures";

describe("bounded autonomous research", () => {
  it("runs multiple tools and adapts to discovered anchors before stopping", async () => {
    const tools = new TestTools(),
      events: AgentEvent[] = [];
    const state = await runAgent(
      "test",
      demoBrief,
      tools,
      { maxCalls: 12, maxSteps: 12 },
      (e) => events.push(e),
    );
    expect(state.status).toBe("complete");
    expect(tools.calls).toBeGreaterThan(5);
    expect(
      tools.requests.slice(5).every((r) => r.anchor.kind === "entity"),
    ).toBe(true);
    expect(state.stopReason).toMatch(/Coverage target/);
    expect(state.coverage).toBe(100);
    expect(events.some((e) => e.state.steps.at(-1)?.status === "running")).toBe(
      true,
    );
    expect(events.at(-1)?.type).toBe("done");
    expect(state.strategy.length).toBeGreaterThan(6);
  });
  it.each([3, 5, 8, 12])(
    "never exceeds a maximum of %i steps",
    async (maxSteps) => {
      const tools = new TestTools();
      const state = await runAgent(
        "test",
        demoBrief,
        tools,
        { maxSteps, maxCalls: 12 },
        () => {},
      );
      expect(state.steps.length).toBeLessThanOrEqual(maxSteps);
      expect(tools.calls).toBeLessThanOrEqual(12);
    },
  );
  it.each([2, 4, 6])(
    "never exceeds %i Qloo calls and permits a sparse report only with evidence",
    async (maxCalls) => {
      const tools = new TestTools();
      const state = await runAgent(
        "test",
        demoBrief,
        tools,
        { maxSteps: 16, maxCalls },
        () => {},
      );
      expect(tools.calls).toBeLessThanOrEqual(maxCalls);
      expect(state.qlooCalls).toBe(tools.calls);
      if (state.status === "complete")
        expect(state.entities.length).toBeGreaterThanOrEqual(3);
    },
  );
  it("chooses an untouched category before expanding", async () => {
    const state = await reportFixture();
    state.steps = state.steps.filter(
      (s) =>
        s.tool !== "qloo.insights" ||
        s.input["filter.type"] === "urn:entity:brand",
    );
    expect(nextResearchTask(state)?.category).toBe("place");
  });
  it("prioritizes places for a location objective", () =>
    expect(
      plannedDimensions({ ...demoBrief, objective: "Find locations" })[0],
    ).toBe("place"));
  it("refuses an ambiguous anchor", () => {
    expect(
      selectAnchor("coffee", [
        { ...anchor, id: "a" },
        { ...anchor, id: "b" },
      ]),
    ).toBeUndefined();
    expect(
      selectAnchor("coffee", [{ ...anchor, name: "Coffin" }]),
    ).toBeUndefined();
  });
  it("excludes unresolved supplied seeds instead of claiming a match", async () => {
    const tools = new TestTools();
    tools.search = async () => [
      { ...entities("brand", 1)[0], name: "An unrelated result" },
    ];
    const state = await runAgent(
      "test",
      { ...demoBrief, seeds: ["Specific Seed"] },
      tools,
      { maxSteps: 12, maxCalls: 12 },
      () => {},
    );
    expect(state.anchors[0].kind).toBe("tag");
    expect(state.limitations.join(" ")).toContain("not resolved unambiguously");
  });
  it("empty data produces no fabricated report", async () => {
    const tools = new TestTools();
    tools.insights = async () => {
      tools.calls++;
      return [];
    };
    const state = await runAgent(
      "test",
      demoBrief,
      tools,
      { maxSteps: 12, maxCalls: 12 },
      () => {},
    );
    expect(state.status).toBe("error");
    expect(state.error?.code).toBe("EMPTY");
    expect(state.opportunities).toEqual([]);
    expect(state.strategy).toEqual([]);
  });
  it("aborted research performs no request", async () => {
    const tools = new TestTools(),
      controller = new AbortController();
    controller.abort();
    const state = await runAgent(
      "test",
      demoBrief,
      tools,
      { maxSteps: 12, maxCalls: 12, signal: controller.signal },
      () => {},
    );
    expect(state.error?.code).toBe("CANCELLED");
    expect(tools.calls).toBe(0);
  });
  it("rate limit stops further research and exposes a safe message", async () => {
    const tools = new TestTools();
    tools.insights = vi.fn(async () => {
      throw new QlooError("RATE_LIMIT");
    });
    const state = await runAgent(
      "test",
      demoBrief,
      tools,
      { maxSteps: 12, maxCalls: 12 },
      () => {},
    );
    expect(tools.insights).toHaveBeenCalledTimes(1);
    expect(state.error?.message).toContain("rate limit");
    expect(state.strategy).toEqual([]);
  });
});
describe("graph provenance", () => {
  it("deduplicates entity nodes, retains distinct observed edges, and avoids self edges", async () => {
    const state = await reportFixture();
    const count = state.entities.length;
    addResearchResults(state, entities("brand"), anchor, "brand", "test-step");
    addResearchResults(state, entities("brand"), anchor, "brand", "test-step");
    expect(state.entities.length).toBe(count);
    expect(new Set(state.nodes.map((n) => n.id)).size).toBe(state.nodes.length);
    expect(new Set(state.edges.map((e) => e.id)).size).toBe(state.edges.length);
    expect(state.edges.every((e) => e.source !== e.target)).toBe(true);
  });
  it("all graph edges resolve to nodes and research steps", async () => {
    const state = await reportFixture(),
      nodeIds = new Set(state.nodes.map((n) => n.id)),
      stepIds = new Set(state.steps.map((s) => s.id));
    for (const e of state.edges) {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
      expect(stepIds.has(e.stepId)).toBe(true);
    }
    expect(
      state.edges
        .filter((e) => e.sourceType === "qloo")
        .every((e) => e.relation === "affinity" && e.weight !== null),
    ).toBe(true);
  });
  it("brief connections are derived and do not acquire affinity scores", async () => {
    const state = await reportFixture();
    addAnchor(state, anchor, "step-2");
    const edge = state.edges.find((e) => e.source === "brief");
    expect(edge?.sourceType).toBe("derived");
    expect(edge?.weight).toBeNull();
  });
  it("place research alone establishes geographic verification", async () => {
    const state = await reportFixture();
    expect(
      state.opportunities.find((o) => o.category === "place")?.breakdown
        .geographicRelevance,
    ).toBe(1);
    expect(
      state.opportunities
        .filter((o) => o.category !== "place")
        .every((o) => o.breakdown.geographicRelevance === 0),
    ).toBe(true);
  });
});
describe("transparent scoring and deterministic strategy", () => {
  it("normalizes invalid and out-of-range values", () => {
    expect(unit(NaN)).toBe(0);
    expect(unit(Infinity)).toBe(0);
    expect(unit(-1)).toBe(0);
    expect(unit(2)).toBe(1);
  });
  it("keeps the score within 0–100", () => {
    expect(
      opportunityScore({
        affinity: 4,
        evidenceDensity: 2,
        crossCategorySupport: 1,
        geographicRelevance: 1,
      }),
    ).toBe(100);
    expect(
      opportunityScore({
        affinity: -2,
        evidenceDensity: 0,
        crossCategorySupport: 0,
        geographicRelevance: 0,
      }),
    ).toBe(0);
  });
  it.each([
    "affinity",
    "evidenceDensity",
    "crossCategorySupport",
    "geographicRelevance",
  ] as const)("is monotonic in %s", (key) => {
    let last = 0;
    for (let value = 0; value <= 1; value += 0.1) {
      const score = opportunityScore({
        affinity: 0.2,
        evidenceDensity: 0.2,
        crossCategorySupport: 0.2,
        geographicRelevance: 0.2,
        [key]: value,
      });
      expect(score).toBeGreaterThanOrEqual(last);
      last = score;
    }
  });
  it("category coverage contributes to confidence and cannot exceed 100", () => {
    expect(evidenceConfidence(12, 5, 80)).toBeGreaterThan(
      evidenceConfidence(12, 1, 20),
    );
    expect(evidenceConfidence(1000, 70, 120)).toBe(100);
  });
  it("all recommendations retain evidence with actual scores", async () => {
    const state = await reportFixture();
    for (const o of state.opportunities) {
      expect(o.edgeIds.length).toBeGreaterThan(0);
      expect(o.score).toBe(opportunityScore(o.breakdown));
      expect(
        o.evidenceIds.every((id) => state.nodes.some((n) => n.id === id)),
      ).toBe(true);
    }
  });
  it("narration is reproducible and includes limits and testable actions", async () => {
    const state = await reportFixture(),
      narrator = new DeterministicNarrator();
    expect(narrator.narrate(state)).toEqual(
      narrator.narrate(structuredClone(state)),
    );
    expect(
      narrator
        .narrate(state)
        .some(
          (s) =>
            s.title === "Risks & uncertain signals" &&
            s.body.includes("not causality"),
        ),
    ).toBe(true);
    expect(
      narrator.narrate(state).find((s) => s.title === "Launch actions")?.body,
    ).toContain("conversion");
  });
  it("no opportunities means no narration", () =>
    expect(
      new DeterministicNarrator().narrate({
        opportunities: [],
      } as unknown as AgentState),
    ).toEqual([]));
});
