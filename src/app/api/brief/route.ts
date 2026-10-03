import { z } from "zod";
import { createLanguageAssistant } from "@/lib/server/language";
import { LanguageError } from "@/lib/llm/errors";
import { admit } from "@/lib/server/abuse";
export const runtime = "nodejs";
export const maxDuration = 30;
const input = z.object({ text: z.string().trim().min(12).max(1600) }).strict();
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (
      origin &&
      new URL(origin).host !==
        (request.headers.get("host") ?? new URL(request.url).host)
    )
      return Response.json(
        { error: "Use CulturePilot to prepare your brief." },
        { status: 403 },
      );
  } catch {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Expected JSON." }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Enter your brief." }, { status: 400 });
  let size = 0,
    body = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return Response.json(
          { error: "Keep your brief under 8 KB." },
          { status: 413 },
        );
      }
      body += decoder.decode(next.value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    return Response.json(
      { error: "Couldn't read your brief." },
      { status: 400 },
    );
  }
  let parsed;
  try {
    parsed = input.safeParse(JSON.parse(body));
  } catch {
    return Response.json({ error: "Expected valid JSON." }, { status: 400 });
  }
  if (!parsed.success)
    return Response.json(
      { error: "Enter a brief between 12 and 1600 characters." },
      { status: 400 },
    );
  const release = admit(
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "local",
  );
  if (!release)
    return Response.json(
      { error: "Please retry shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const assistant = createLanguageAssistant(request.signal);
  try {
    const brief = await assistant.parseBrief(parsed.data.text);
    return Response.json(
      {
        brief,
        language: assistant.runtime,
        message: "Review the extracted fields before starting Qloo research.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        brief: null,
        language: assistant.runtime,
        message:
          error instanceof LanguageError
            ? error.message
            : "Complete the structured form to continue.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    release();
  }
}
