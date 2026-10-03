import { describe, it, expect, vi } from "vitest";
import { QlooClient, ageSignal, insightsParams } from "../src/lib/qloo/client";
import {
  normalizeEntities,
  normalizeTags,
  deduplicateEntities,
} from "../src/lib/qloo/normalizer";
import { briefSchema, demoBrief } from "../src/lib/types";
import { anchor, entities } from "./fixtures";
const raw = {
  results: {
    entities: [
      {
        entity_id: "test-1",
        name: "Test Brand",
        types: ["urn:entity:brand"],
        query: { affinity: 0.81 },
        tags: [{ name: "test" }],
      },
    ],
  },
};
describe("Qloo client contracts", () => {
  it("sends the secret only as a server request header and uses GET query parameters", async () => {
    const fetcher = vi.fn(async () => Response.json(raw));
    const client = new QlooClient({ apiKey: "test-secret", fetcher });
    await client.insights("brand", anchor, demoBrief);
    const [url, options] = fetcher.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.hostname).toBe("hackathon.api.qloo.com");
    expect(url.pathname).toBe("/v2/insights");
    expect(url.searchParams.get("filter.type")).toBe("urn:entity:brand");
    expect(url.toString()).not.toContain("test-secret");
    expect(options.headers).toHaveProperty("X-Api-Key", "test-secret");
    expect(options.cache).toBe("no-store");
    expect(options.redirect).toBe("error");
  });
  it("missing key makes zero network calls", async () => {
    const fetcher = vi.fn();
    const client = new QlooClient({ fetcher });
    await expect(client.search("coffee")).rejects.toHaveProperty(
      "code",
      "KEY_MISSING",
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(client.calls).toBe(0);
  });
  it("enforces a hard request budget without retries", async () => {
    const fetcher = vi.fn(async () => Response.json(raw));
    const client = new QlooClient({ apiKey: "key", fetcher, maxCalls: 1 });
    await client.search("test");
    await expect(client.search("test")).rejects.toHaveProperty(
      "code",
      "BUDGET",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    [429, "RATE_LIMIT"],
    [401, "AUTH"],
    [403, "AUTH"],
    [500, "UNAVAILABLE"],
    [400, "PARAMETERS"],
  ])("maps HTTP %i to safe %s", async (status, code) => {
    const client = new QlooClient({
      apiKey: "key",
      fetcher: async () =>
        new Response("internal secret message", { status: Number(status) }),
    });
    await expect(client.search("test")).rejects.toMatchObject({
      code,
      message: expect.not.stringContaining("internal secret"),
    });
  });
  it("handles real fetch cancellation on timeout", async () => {
    const fetcher: typeof fetch = async (_, options) =>
      new Promise((_, reject) =>
        options?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        ),
      );
    const client = new QlooClient({ apiKey: "key", fetcher, timeoutMs: 20 });
    await expect(client.search("test")).rejects.toHaveProperty(
      "code",
      "TIMEOUT",
    );
  });
  it("stops an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = new QlooClient({ apiKey: "key", signal: controller.signal });
    await expect(client.search("test")).rejects.toHaveProperty(
      "code",
      "CANCELLED",
    );
  });
  it("turns an empty 404 into empty results", async () => {
    const client = new QlooClient({
      apiKey: "key",
      fetcher: async () => new Response(null, { status: 404 }),
    });
    expect(await client.search("missing")).toEqual([]);
  });
  it("rejects malformed JSON safely", async () => {
    const client = new QlooClient({
      apiKey: "key",
      fetcher: async () => new Response("not json"),
    });
    await expect(client.search("test")).rejects.toHaveProperty(
      "code",
      "MALFORMED",
    );
  });
  it("never forwards credentials to an arbitrary host", () => {
    expect(
      () =>
        new QlooClient({ apiKey: "key", baseUrl: "https://unknown.example" }),
    ).toThrow();
    expect(
      () =>
        new QlooClient({
          apiKey: "key",
          baseUrl: "http://hackathon.api.qloo.com",
        }),
    ).toThrow();
  });
  it("applies market filters only to place, and explicit Qloo age bins", () => {
    const place = insightsParams("place", anchor, demoBrief),
      brand = insightsParams("brand", anchor, demoBrief);
    expect(place["filter.location.query"]).toBe("Madrid, Spain");
    expect(place["filter.location.radius"]).toBe("0");
    expect(brand["filter.location.query"]).toBeUndefined();
    expect(ageSignal(demoBrief.audience)).toBe("25_to_29,30_to_34,35_to_44");
    expect(ageSignal("Gen Z professionals")).toBeUndefined();
  });
});
describe("normalization and input validation", () => {
  it("preserves scored Qloo entities", () =>
    expect(normalizeEntities(raw, "brand", true)[0]).toMatchObject({
      id: "test-1",
      name: "Test Brand",
      affinity: 0.81,
      category: "brand",
    }));
  it.each([
    null,
    {},
    { results: {} },
    { results: { entities: [{ name: "missing ID" }] } },
    {
      results: {
        entities: [
          { entity_id: "id", name: "bad score", query: { affinity: 6 } },
        ],
      },
    },
  ])("rejects malformed response %j", (value) =>
    expect(() => normalizeEntities(value, "brand", true)).toThrow(),
  );
  it("unscored entities cannot become affinity evidence", () =>
    expect(
      normalizeEntities(
        {
          results: {
            entities: [
              {
                entity_id: "id",
                name: "No score",
                types: ["urn:entity:brand"],
              },
            ],
          },
        },
        "brand",
        true,
      ),
    ).toEqual([]));
  it("does not invent a category for unsupported search entities", () =>
    expect(
      normalizeEntities({
        results: {
          entities: [
            { entity_id: "id", name: "Album", types: ["urn:entity:album"] },
          ],
        },
      }),
    ).toEqual([]));
  it("deduplicates by ID while retaining stronger observations", () => {
    const e = entities("brand", 1)[0];
    const result = deduplicateEntities([e, { ...e, affinity: 0.99 }]);
    expect(result).toHaveLength(1);
    expect(result[0].affinity).toBe(0.99);
  });
  it("normalizes verified tags and rejects invalid IDs", () => {
    expect(
      normalizeTags({
        results: { tags: [{ tag_id: "urn:tag:test", name: "Coffee" }] },
      })[0].kind,
    ).toBe("tag");
    expect(() =>
      normalizeTags({ results: { tags: [{ name: "Coffee" }] } }),
    ).toThrow();
  });
  it("validates, bounds, and rejects unknown input fields", () => {
    expect(briefSchema.safeParse(demoBrief).success).toBe(true);
    expect(
      briefSchema.safeParse({ ...demoBrief, idea: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      briefSchema.safeParse({ ...demoBrief, apiKey: "not allowed" }).success,
    ).toBe(false);
    expect(
      briefSchema.safeParse({ ...demoBrief, market: "Madrid\u0000" }).success,
    ).toBe(false);
  });
});
