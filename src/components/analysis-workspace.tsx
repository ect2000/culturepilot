"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import type { AgentEvent, AgentState, Brief } from "@/lib/types";
import { readHistory, saveReport } from "@/lib/storage";
import { useResearchSession } from "./research-provider";
import { ResearchProgress } from "./research-progress";
import { Report } from "./report";
import { Button } from "./ui/button";
export function AnalysisWorkspace({ id }: { id: string }) {
  const session = useResearchSession(),
    [state, setState] = useState<AgentState | null>(null),
    [phase, setPhase] = useState<
      "loading" | "research" | "missing" | "failed" | "complete"
    >("loading"),
    [failure, setFailure] = useState(""),
    [saved, setSaved] = useState(true);
  const controller = useRef<AbortController | null>(null),
    [brief, setBrief] = useState<Brief | undefined>(undefined);
  async function start(input: Brief) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setState(null);
    setPhase("research");
    setFailure("");
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: abort.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Research couldn't start. Please retry.");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("The research stream couldn't be opened.");
      const decoder = new TextDecoder();
      let buffer = "",
        done = false;
      const handle = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as
          AgentEvent | { type: "error"; error: string };
        if (event.type === "error")
          throw new Error(
            event.error ?? "The research stream was interrupted.",
          );
        event.state.id = id;
        setState(event.state);
        if (event.type === "done") {
          done = true;
          if (event.state.status === "complete") {
            setSaved(saveReport(event.state));
            setPhase("complete");
          } else {
            setFailure(
              event.state.error?.message ?? "Research couldn't complete.",
            );
            setPhase("failed");
          }
        }
      };
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) handle(line);
      }
      buffer += decoder.decode();
      if (buffer.trim()) handle(buffer);
      if (!done)
        throw new Error(
          "The research connection ended before completion. Retry your brief.",
        );
    } catch (error) {
      if (abort.signal.aborted) return;
      setFailure(
        error instanceof Error ? error.message : "Research couldn't complete.",
      );
      setPhase("failed");
    }
  }
  useEffect(() => {
    // Scheduling defers the network mutation until Strict Mode's setup/cleanup settles.
    const scheduled = setTimeout(() => {
      const cached = readHistory().find((s) => s.id === id);
      if (cached) {
        setState(cached);
        setPhase("complete");
        return;
      }
      const input = session.get(id);
      setBrief(input);
      if (input) void start(input);
      else setPhase("missing");
    }, 0);
    return () => {
      clearTimeout(scheduled);
      controller.current?.abort();
    };
    // The route ID owns this analysis lifecycle; provider methods may change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  function cancel() {
    controller.current?.abort();
    setFailure(
      "Research was stopped. No completed strategy was saved. You can retry the same brief.",
    );
    setPhase("failed");
  }
  if (phase === "complete" && state)
    return <Report state={state} saved={saved} />;
  if (phase === "research" || phase === "loading")
    return <ResearchProgress state={state} onCancel={cancel} />;
  if (phase === "missing")
    return (
      <div className="page-container missing-analysis">
        <p className="eyebrow">LOCAL RESEARCH SESSION</p>
        <h1>This analysis lives in your browser.</h1>
        <p>
          There’s no brief or saved report for this link on this device. Start a
          new strategy, or open a report from your recent analyses.
        </p>
        <div className="hero-actions">
          <Button asChild>
            <Link href="/brief">
              Build a strategy <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/analyses">Recent analyses</Link>
          </Button>
        </div>
      </div>
    );
  return (
    <div className="page-container error-page">
      <Link href="/brief" className="text-link">
        <ArrowLeft size={14} /> Back to your brief
      </Link>
      <div className="error-layout">
        <div>
          <div className="error-symbol">
            <AlertTriangle size={29} strokeWidth={1.3} />
          </div>
          <p className="eyebrow">
            {state?.error?.code === "KEY_MISSING"
              ? "QLOO CONNECTION NEEDED"
              : "RESEARCH COULDN’T COMPLETE"}
          </p>
          <h1>
            {state?.error?.code === "KEY_MISSING" ? (
              <>
                The strategy starts
                <br />
                with real evidence.
              </>
            ) : (
              <>
                A pause in the
                <br />
                research journey.
              </>
            )}
          </h1>
          <p>{failure}</p>
          <div className="hero-actions">
            <Button
              onClick={() => {
                if (brief) void start(brief);
              }}
              disabled={!brief}
            >
              <RefreshCw size={15} /> Retry research
            </Button>
            <Button asChild variant="secondary">
              <Link href="/brief">Refine the brief</Link>
            </Button>
          </div>
          <div className="error-integrity">
            <ShieldCheck size={16} />
            <span>No invented signals. No fabricated strategy.</span>
          </div>
        </div>
        <aside>
          <p className="eyebrow">YOUR BRIEF IS READY</p>
          <h3>{state?.brief.idea ?? brief?.idea}</h3>
          <dl>
            <dt>MARKET</dt>
            <dd>{state?.brief.market ?? brief?.market}</dd>
            <dt>AUDIENCE</dt>
            <dd>{state?.brief.audience ?? brief?.audience}</dd>
            <dt>COMPLETED REQUESTS</dt>
            <dd>
              {state?.steps.filter(
                (s) => s.status === "complete" && s.tool.startsWith("qloo"),
              ).length ?? 0}
            </dd>
          </dl>
          <p className="micro-copy">
            {state?.error?.code === "KEY_MISSING"
              ? "Project owner: configure the event-issued QLOO_API_KEY in the server environment, then retry. The key never belongs in the browser."
              : "Any returned signals remain visible in the trace below. A completed report requires sufficient verified research."}
          </p>
        </aside>
      </div>
      {state && state.steps.length > 0 && (
        <div className="failed-trace">
          <h2>Research trace</h2>
          {state.steps.map((s) => (
            <details key={s.id}>
              <summary>
                {s.title}
                <span>{s.status}</span>
              </summary>
              <p>{s.reason}</p>
              {s.message && <p>{s.message}</p>}
              <pre>{JSON.stringify(s.input, null, 2)}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
