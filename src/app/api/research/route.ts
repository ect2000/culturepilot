import { briefSchema } from "@/lib/types";
import { QlooClient } from "@/lib/qloo/client";
import { runAgent } from "@/lib/agent/engine";
import { agentConfig } from "@/lib/server/config";
import { admit } from "@/lib/server/abuse";
import { createLanguageAssistant } from "@/lib/server/language";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedHost = request.headers.get("host") ?? new URL(request.url).host;
  let foreignOrigin = false;
  try {
    foreignOrigin = Boolean(origin && new URL(origin).host !== expectedHost);
  } catch {
    foreignOrigin = true;
  }
  if (foreignOrigin)
    return Response.json(
      { error: "Use CulturePilot to start research." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Expected a JSON brief." }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "A brief is required." }, { status: 400 });
  let body = "",
    size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return Response.json(
          { error: "Keep your brief under 8 KB." },
          { status: 413 },
        );
      }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    return Response.json(
      { error: "Couldn't read the brief." },
      { status: 400 },
    );
  }
  let parsed;
  try {
    parsed = briefSchema.safeParse(JSON.parse(body));
  } catch {
    return Response.json(
      { error: "The brief must be valid JSON." },
      { status: 400 },
    );
  }
  if (!parsed.success)
    return Response.json(
      {
        error: "Check your brief fields and try again.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const release = admit(
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "local",
  );
  if (!release)
    return Response.json(
      { error: "Research is busy. Please retry shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const config = agentConfig();
  const encoder = new TextEncoder();
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, request.signal]);
  const stream = new ReadableStream({
    async start(streamController) {
      try {
        const tools = new QlooClient({
          apiKey: process.env.QLOO_API_KEY,
          baseUrl:
            process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com",
          timeoutMs: config.timeoutMs,
          maxCalls: config.maxCalls,
          signal,
        });
        await runAgent(
          crypto.randomUUID(),
          parsed.data,
          tools,
          { ...config, signal, language: createLanguageAssistant(signal) },
          (event) => {
            if (!signal.aborted)
              streamController.enqueue(
                encoder.encode(JSON.stringify(event) + "\n"),
              );
          },
        );
      } catch {
        if (!signal.aborted)
          streamController.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error:
                  "Couldn't start research. Check the server configuration.",
              }) + "\n",
            ),
          );
      } finally {
        release();
        if (!signal.aborted) streamController.close();
      }
    },
    cancel() {
      controller.abort();
      release();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
