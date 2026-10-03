// Synthetic data only for tests. Never imported by src/ or shipped as a demo report.
import type { Anchor, Brief, Category, Entity } from "../src/lib/types";
import type { QlooTools } from "../src/lib/qloo/client";
import { runAgent } from "../src/lib/agent/engine";
import { demoBrief } from "../src/lib/types";
export const anchor: Anchor = {
  id: "urn:tag:test:coffee",
  name: "Coffee",
  kind: "tag",
};
export function entities(category: Category, count = 8): Entity[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-${category}-${i}`,
    name: `Test ${category.replace("_", " ")} ${i + 1}`,
    category,
    affinity: Math.max(0, 0.92 - i * 0.045),
    tags: ["Synthetic test signal"],
    description: "Synthetic test fixture; never production Qloo evidence.",
    address: category === "place" ? "Test venue address" : undefined,
  }));
}
export class TestTools implements QlooTools {
  calls = 0;
  requests: { category: Category; anchor: Anchor; brief: Brief }[] = [];
  async tags() {
    this.calls++;
    return [anchor];
  }
  async search(query: string): Promise<Entity[]> {
    this.calls++;
    return [{ ...entities("brand", 1)[0], name: query, affinity: null }];
  }
  async insights(category: Category, anchor: Anchor, brief: Brief) {
    this.calls++;
    this.requests.push({ category, anchor, brief });
    return entities(category);
  }
}
export async function reportFixture() {
  return runAgent(
    "test-report",
    demoBrief,
    new TestTools(),
    { maxCalls: 12, maxSteps: 12 },
    () => {},
  );
}
