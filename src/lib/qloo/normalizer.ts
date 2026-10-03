import { z } from "zod";
import { categories, type Category, type Entity, type Anchor } from "../types";
import { QlooError } from "./errors";

const rawEntity = z
  .object({
    entity_id: z.string().min(1).max(200),
    name: z.string().min(1).max(300),
    types: z.array(z.string()).optional(),
    type: z.string().optional(),
    query: z
      .object({ affinity: z.number().finite().min(0).max(1).optional() })
      .passthrough()
      .optional(),
    affinity: z.number().finite().min(0).max(1).optional(),
    properties: z
      .object({
        description: z.string().optional(),
        address: z.string().optional(),
      })
      .passthrough()
      .optional(),
    tags: z
      .array(
        z
          .object({ name: z.string(), tag_id: z.string().optional() })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
const envelope = z
  .object({
    results: z
      .union([
        z.array(z.unknown()),
        z
          .object({
            entities: z.array(z.unknown()).optional(),
            tags: z.array(z.unknown()).optional(),
          })
          .passthrough(),
      ])
      .optional(),
  })
  .passthrough();

export function normalizeEntities(
  raw: unknown,
  fallback?: Category,
  requireAffinity = false,
): Entity[] {
  const e = envelope.safeParse(raw);
  if (!e.success || e.data.results === undefined)
    throw new QlooError("MALFORMED");
  const list = Array.isArray(e.data.results)
    ? e.data.results
    : e.data.results.entities;
  if (!list) throw new QlooError("MALFORMED");
  const result: Entity[] = [];
  for (const item of list.slice(0, 100)) {
    const parsed = rawEntity.safeParse(item);
    if (!parsed.success) throw new QlooError("MALFORMED");
    const v = parsed.data;
    const cat = (v.types ?? [v.type ?? ""])
      .map((t) => t.replace("urn:entity:", ""))
      .find((t) => categories.includes(t as Category)) as Category | undefined;
    if (fallback && cat && cat !== fallback) continue;
    if (!cat && !fallback) continue;
    const affinity = v.query?.affinity ?? v.affinity ?? null;
    // Unscored backfill is not treated as cultural evidence.
    if (requireAffinity && affinity === null) continue;
    result.push({
      id: v.entity_id,
      name: v.name,
      category: cat ?? fallback!,
      affinity,
      description: v.properties?.description?.slice(0, 1200),
      address: v.properties?.address?.slice(0, 300),
      tags: v.tags?.map((t) => t.name).slice(0, 12) ?? [],
    });
  }
  return deduplicateEntities(result);
}
export function normalizeTags(raw: unknown): Anchor[] {
  const e = envelope.safeParse(raw);
  if (
    !e.success ||
    !e.data.results ||
    Array.isArray(e.data.results) ||
    !e.data.results.tags
  )
    throw new QlooError("MALFORMED");
  const schema = z
    .object({
      tag_id: z.string().min(1).max(250),
      name: z.string().min(1).max(300),
    })
    .passthrough();
  return e.data.results.tags.slice(0, 20).map((item) => {
    const v = schema.safeParse(item);
    if (!v.success) throw new QlooError("MALFORMED");
    return { id: v.data.tag_id, name: v.data.name, kind: "tag" as const };
  });
}
export function deduplicateEntities(entities: Entity[]): Entity[] {
  const map = new Map<string, Entity>();
  for (const e of entities) {
    const old = map.get(e.id);
    if (!old || (e.affinity ?? -1) > (old.affinity ?? -1)) map.set(e.id, e);
  }
  return [...map.values()];
}
