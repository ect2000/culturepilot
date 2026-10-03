import type { Anchor, Brief, Category, Entity } from "../types";
import { QlooError } from "./errors";
import { normalizeEntities, normalizeTags } from "./normalizer";

export interface QlooTools {
  readonly calls?: number;
  tags(query: string): Promise<Anchor[]>;
  search(query: string): Promise<Entity[]>;
  insights(category: Category, anchor: Anchor, brief: Brief): Promise<Entity[]>;
}
export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxCalls?: number;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  onCall?: () => void;
}
export function ageSignal(audience: string): string | undefined {
  const range = audience.match(/\b(\d{2})\s*[-–—]\s*(\d{2})\b/);
  if (!range) return undefined;
  const low = Number(range[1]),
    high = Number(range[2]);
  if (low < 18 || high < low || high > 99) return undefined;
  return [
    [18, 24, "24_and_younger"],
    [25, 29, "25_to_29"],
    [30, 34, "30_to_34"],
    [35, 44, "35_to_44"],
    [45, 54, "45_to_54"],
    [55, 99, "55_and_older"],
  ]
    .filter(([min, max]) => Number(min) <= high && Number(max) >= low)
    .map(([, , name]) => name)
    .join(",");
}
export function insightsParams(
  category: Category,
  anchor: Anchor,
  brief: Brief,
): Record<string, string> {
  const params: Record<string, string> = {
    "filter.type": `urn:entity:${category}`,
    take: "8",
    [anchor.kind === "tag"
      ? "signal.interests.tags"
      : "signal.interests.entities"]: anchor.id,
  };
  if (category === "place") {
    params["filter.location.query"] = brief.market;
    params["filter.location.radius"] = "0";
  }
  const ages = ageSignal(brief.audience);
  if (ages) params["signal.demographics.age"] = ages;
  return params;
}
export class QlooClient implements QlooTools {
  calls = 0;
  private options: Required<
    Pick<ClientOptions, "baseUrl" | "timeoutMs" | "maxCalls" | "fetcher">
  > &
    ClientOptions;
  constructor(options: ClientOptions) {
    this.options = {
      baseUrl: "https://hackathon.api.qloo.com",
      timeoutMs: 8000,
      maxCalls: 12,
      fetcher: fetch,
      ...options,
    };
    const url = new URL(this.options.baseUrl);
    if (
      url.protocol !== "https:" ||
      ![
        "hackathon.api.qloo.com",
        "api.qloo.com",
        "staging.api.qloo.com",
      ].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      throw new QlooError("PARAMETERS");
  }
  async request(
    path: "/v2/tags" | "/search" | "/v2/insights",
    params: Record<string, string>,
  ): Promise<unknown> {
    if (!this.options.apiKey) throw new QlooError("KEY_MISSING");
    if (this.options.signal?.aborted) throw new QlooError("CANCELLED");
    if (this.calls >= this.options.maxCalls) throw new QlooError("BUDGET");
    this.calls++;
    this.options.onCall?.();
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    const signal = this.options.signal
      ? AbortSignal.any([timeout, this.options.signal])
      : timeout;
    const url = new URL(path, this.options.baseUrl);
    url.search = new URLSearchParams(params).toString();
    try {
      const res = await this.options.fetcher(url, {
        headers: {
          "X-Api-Key": this.options.apiKey,
          Accept: "application/json",
        },
        signal,
        cache: "no-store",
        redirect: "error",
      });
      if (res.status === 429) throw new QlooError("RATE_LIMIT");
      if (res.status === 401 || res.status === 403) throw new QlooError("AUTH");
      if (res.status === 400 || res.status === 422)
        throw new QlooError("PARAMETERS");
      if (res.status === 404)
        return {
          results: path === "/v2/tags" ? { tags: [] } : { entities: [] },
        };
      if (!res.ok) throw new QlooError("UNAVAILABLE");
      // Read the body within the timeout, with a bounded response size.
      const reader = res.body?.getReader();
      if (!reader) throw new QlooError("MALFORMED");
      let size = 0,
        body = "";
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 2_000_000) {
          await reader.cancel();
          throw new QlooError("MALFORMED");
        }
        body += decoder.decode(chunk.value, { stream: true });
      }
      try {
        return JSON.parse(body + decoder.decode());
      } catch {
        throw new QlooError("MALFORMED");
      }
    } catch (error) {
      if (error instanceof QlooError) throw error;
      if (this.options.signal?.aborted) throw new QlooError("CANCELLED");
      if (
        timeout.aborted ||
        (error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name))
      )
        throw new QlooError("TIMEOUT");
      throw new QlooError("UNAVAILABLE");
    }
  }
  async tags(query: string) {
    return normalizeTags(
      await this.request("/v2/tags", { "filter.query": query, take: "5" }),
    );
  }
  async search(query: string) {
    return normalizeEntities(
      await this.request("/search", { query, take: "5" }),
    );
  }
  async insights(category: Category, anchor: Anchor, brief: Brief) {
    return normalizeEntities(
      await this.request(
        "/v2/insights",
        insightsParams(category, anchor, brief),
      ),
      category,
      true,
    );
  }
}
