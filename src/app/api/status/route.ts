export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    {
      qlooConfigured: Boolean(process.env.QLOO_API_KEY),
      mode: "live-only",
      narrator:
        languageStatus().status === "configured"
          ? "optional-free-assistance"
          : "deterministic",
      language: languageStatus(),
      evidenceEngine: "ready",
      graphEngine: "ready",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
import { languageStatus } from "@/lib/server/language";
