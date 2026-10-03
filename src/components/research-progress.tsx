"use client";
import { motion } from "motion/react";
import {
  Check,
  LoaderCircle,
  Circle,
  ArrowUpRight,
  Network,
  StopCircle,
  Radio,
} from "lucide-react";
import { type AgentState } from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
export function ResearchProgress({
  state,
  onCancel,
}: {
  state: AgentState | null;
  onCancel: () => void;
}) {
  const events = state?.steps ?? [];
  return (
    <div className="page-container research-page">
      <p className="page-eyebrow">
        <span className="status-dot" /> AUTONOMOUS RESEARCH IN PROGRESS
      </p>
      <div className="page-heading">
        <div>
          <h1>
            Following the cultural connections<span className="accent">.</span>
          </h1>
          <p>
            Your agent is researching {state?.brief.market ?? "your market"}.
            Every signal comes from Qloo.
          </p>
        </div>
        <Button variant="secondary" size="small" onClick={onCancel}>
          <StopCircle size={14} /> Stop research
        </Button>
      </div>
      <div className="research-metrics">
        {[
          { label: "Qloo requests", value: state?.qlooCalls ?? 0 },
          { label: "Language calls", value: state?.language?.calls ?? 0 },
          { label: "Entities discovered", value: state?.entities.length ?? 0 },
          {
            label: "Categories explored",
            value: `${state?.researchedDimensions.length ?? 0} / ${state?.plannedDimensions.length ?? 5}`,
          },
          {
            label: "Graph connections",
            value:
              state?.edges.filter((e) => e.relation === "affinity").length ?? 0,
          },
        ].map((m) => (
          <div key={m.label}>
            <span>{m.label}</span>
            <motion.b
              key={m.value}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
            >
              {m.value}
            </motion.b>
          </div>
        ))}
      </div>
      <div className="research-layout">
        {state?.language && (
          <p className="language-status" role="status">
            {state.language.status}
          </p>
        )}
        <div className="research-timeline">
          <div className="panel-heading">
            <Radio size={16} />
            <h2>Research activity</h2>
            <span className="live-label">LIVE</span>
          </div>
          <div className="timeline-items" aria-live="polite">
            {events.map((s, i) => (
              <motion.div
                className={cn(
                  "timeline-item",
                  s.status === "running" && "timeline-active",
                )}
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="timeline-icon">
                  {s.status === "running" ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : s.status === "error" ? (
                    <Circle size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                </div>
                <div>
                  <small>
                    STEP {String(i + 1).padStart(2, "0")} · {s.actor ?? s.tool}
                  </small>
                  <h3>{s.title}</h3>
                  <p>{s.message ?? s.reason}</p>
                  {s.status !== "running" && (
                    <span>
                      {s.resultCount} results ·{" "}
                      {(s.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            {!events.length && (
              <div className="timeline-item timeline-active">
                <LoaderCircle className="spin" size={17} />
                <div>
                  <h3>Preparing your research plan</h3>
                  <p>
                    Validating the brief and opening a live research stream.
                  </p>
                </div>
              </div>
            )}
            <div className="timeline-next">
              <Circle size={14} />
              <span>Score opportunities & generate strategy</span>
            </div>
          </div>
        </div>
        <div className="research-map">
          <div className="research-map-header">
            <Network size={17} />
            <span>THE EMERGING CULTURAL WORLD</span>
          </div>
          <svg
            viewBox="0 0 600 400"
            role="img"
            aria-label="Verified research connections appearing as results arrive"
          >
            <defs>
              <radialGradient id="research-glow">
                <stop stopColor="#c99b6f" stopOpacity=".12" />
                <stop offset="1" stopColor="#c99b6f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="200" r="170" fill="url(#research-glow)" />
            <circle
              cx="300"
              cy="200"
              r="105"
              fill="none"
              stroke="#3b4037"
              strokeDasharray="2 12"
            />
            {(state?.entities ?? []).slice(0, 20).map((e, i) => {
              const a = i * 2.4,
                r = 120 + (i % 3) * 35,
                x = 300 + Math.cos(a) * r,
                y = 200 + Math.sin(a) * r;
              return (
                <motion.g
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <path
                    d={`M300 200 ${x} ${y}`}
                    stroke="#b18962"
                    strokeOpacity=".3"
                  />
                  <circle cx={x} cy={y} r="4" fill="#c99b6f" />
                  <text x={x + 8} y={y + 3} fill="#aba597" fontSize="9">
                    {e.name.slice(0, 21)}
                  </text>
                </motion.g>
              );
            })}
            <circle cx="300" cy="200" r="40" fill="#1a1e18" stroke="#6b5843" />
            <text
              x="300"
              y="203"
              textAnchor="middle"
              fontSize="9"
              letterSpacing="1.5"
              fill="#d3b393"
            >
              YOUR IDEA
            </text>
          </svg>
          <div className="coverage-track">
            <div>
              <span>Research coverage</span>
              <b>{state?.coverage ?? 0}%</b>
            </div>
            <div className="progress-bar">
              <motion.i animate={{ width: `${state?.coverage ?? 0}%` }} />
            </div>
            <p>
              {state?.entities.length
                ? "Mapping verified Qloo signals into your cultural graph."
                : "Verified connections appear when Qloo returns evidence."}
            </p>
          </div>
        </div>
      </div>
      <p className="research-footnote">
        <ArrowUpRight size={13} /> Your agent evaluates coverage after each
        request, then chooses the next dimension to explore.
      </p>
    </div>
  );
}
