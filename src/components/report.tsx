"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Download,
  Printer,
  ArrowUpRight,
  MapPin,
  Users,
  Check,
  Network,
  ScanLine,
  ArrowRight,
  Copy,
  Clock3,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { categoryNames, type AgentState, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { EvidenceDrawer } from "./evidence-drawer";
const CultureGraph = dynamic(() => import("./culture-graph"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton skeleton-graph"
      aria-label="Loading interactive graph"
    />
  ),
});
const CoverageChart = dynamic(() => import("./coverage-chart"), {
  ssr: false,
  loading: () => <div className="skeleton skeleton-chart" />,
});
const tabs = [
  "Overview",
  "Audience DNA",
  "Culture Graph",
  "Opportunities",
  "Strategy",
  "Research Trace",
] as const;
type Tab = (typeof tabs)[number];
export function Report({
  state,
  saved,
}: {
  state: AgentState;
  saved: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Overview"),
    [selected, setSelected] = useState<string | null>(null),
    [category, setCategory] = useState<Category | "all">("all"),
    [copied, setCopied] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const density = state.edges.filter((e) => e.relation === "affinity").length;
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `culturepilot-${state.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${state.brief.idea} — ${state.brief.market}\nAudience: ${state.brief.audience}\n${state.entities.length} verified Qloo entities across ${state.researchedDimensions.length} categories. Cultural fit index: ${state.culturalFit}/100.\n${state.opportunities
          .slice(0, 3)
          .map((o) => `${o.title}: ${o.score}/100`)
          .join(
            "\n",
          )}\nAffinity is not demand. These are hypotheses to validate.`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  function show(value: Tab) {
    setTab(value);
  }
  const opportunityList = (
    <div className="opportunity-list">
      {state.opportunities.map((o, i) => (
        <motion.article
          key={o.id}
          className="opportunity-row"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <span className="opportunity-rank">0{i + 1}</span>
          <div>
            <p className="eyebrow">{categoryNames[o.category]}</p>
            <h3>{o.title}</h3>
            <p>{o.description}</p>
            <div className="opportunity-evidence">
              <span>{o.edgeIds.length} Qloo relationships</span>
              <span>
                {
                  new Set(
                    o.evidenceIds
                      .map(
                        (id) => state.nodes.find((n) => n.id === id)?.category,
                      )
                      .filter(Boolean),
                  ).size
                }{" "}
                categories
              </span>
            </div>
          </div>
          <div className="opportunity-fit">
            <b>
              {o.score}
              <small>/100</small>
            </b>
            <span>OPPORTUNITY FIT</span>
            <button onClick={() => setSelected(o.id)}>
              Why this? <ArrowUpRight size={14} />
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
  return (
    <div className="page-container report-page">
      <div className="report-topline">
        <p className="page-eyebrow">
          <span className="status-dot" /> RESEARCH COMPLETE
        </p>
        <span className="report-saved">
          <Check size={13} />
          {saved
            ? "Saved on this device"
            : "Browser storage unavailable · Export to keep"}
        </span>
      </div>
      <div className="report-heading">
        <div>
          <h1>
            {state.brief.idea}
            <span className="accent">.</span>
          </h1>
          <div className="report-context">
            <span>
              <MapPin size={14} />
              {state.brief.market}
            </span>
            <span>
              <Users size={14} />
              {state.brief.audience}
            </span>
          </div>
        </div>
        <div className="report-actions">
          <Button size="small" variant="secondary" onClick={exportJson}>
            <Download size={14} /> JSON
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print / PDF
          </Button>
          <Button
            size="small"
            variant="ghost"
            onClick={copy}
            aria-label="Copy strategy summary"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>
      <div className="report-summary">
        <Sparkles size={16} />
        <p>
          Research around <b>{state.anchors.map((a) => a.name).join(", ")}</b>{" "}
          returned {state.entities.length} scored entities across{" "}
          {state.researchedDimensions.length} categories.{" "}
          {state.opportunities.length} opportunities translate those
          relationships into hypotheses for your next move.
        </p>
      </div>
      <div
        className="report-tabs"
        role="tablist"
        aria-label="Analysis sections"
      >
        {tabs.map((t, i) => (
          <button
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            key={t}
            id={`tab-${i}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${i}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => show(t)}
            onKeyDown={(e) => {
              let next = i;
              if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
              else if (e.key === "ArrowLeft")
                next = (i - 1 + tabs.length) % tabs.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = tabs.length - 1;
              else return;
              e.preventDefault();
              show(tabs[next]);
              tabRefs.current[next]?.focus();
            }}
            className={cn(tab === t && "active")}
          >
            {t}
            {t === "Opportunities" && <span>{state.opportunities.length}</span>}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tabs.indexOf(tab)}`}
        aria-labelledby={`tab-${tabs.indexOf(tab)}`}
        tabIndex={0}
        className="report-panel"
      >
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tab === "Overview" && (
            <>
              <div className="overview-metrics">
                <div className="fit-metric">
                  <div
                    className="score-ring"
                    style={
                      {
                        "--score": `${state.culturalFit}%`,
                      } as React.CSSProperties
                    }
                  >
                    <b>
                      {state.culturalFit}
                      <small>/100</small>
                    </b>
                  </div>
                  <div>
                    <h2>Cultural fit</h2>
                    <p>Average opportunity fit index</p>
                    <button
                      className="text-link"
                      onClick={() =>
                        setSelected(state.opportunities[0]?.id ?? null)
                      }
                    >
                      Inspect the formula <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <span>Evidence confidence</span>
                  <b>
                    {state.confidence}
                    <small>/100</small>
                  </b>
                  <p>Coverage & density heuristic</p>
                </div>
                <div>
                  <span>Qloo relationships</span>
                  <b>{density}</b>
                  <p>{state.entities.length} verified entities</p>
                </div>
                <div>
                  <span>Category coverage</span>
                  <b>
                    {state.coverage}
                    <small>%</small>
                  </b>
                  <p>
                    {state.researchedDimensions.length} of{" "}
                    {state.plannedDimensions.length} dimensions
                  </p>
                </div>
              </div>
              <div className="overview-layout">
                <div>
                  <div className="section-title">
                    <div>
                      <p className="eyebrow">YOUR AUDIENCE’S CULTURAL WORLD</p>
                      <h2>See how it connects.</h2>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => show("Culture Graph")}
                    >
                      Explore graph <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <CultureGraph state={state} onInspect={setSelected} />
                </div>
                <aside className="overview-aside">
                  <p className="eyebrow">EVIDENCE BREADTH</p>
                  <h3>A cross-category view.</h3>
                  <CoverageChart state={state} />
                  <div className="category-counts">
                    {state.researchedDimensions.map((c) => (
                      <div key={c}>
                        <span>{categoryNames[c]}</span>
                        <b>
                          {
                            state.entities.filter((e) => e.category === c)
                              .length
                          }
                        </b>
                      </div>
                    ))}
                  </div>
                  <p className="micro-copy">
                    Affinities describe a resolved taste profile. They do not
                    establish purchase intent or individual preferences.
                  </p>
                </aside>
              </div>
              <div className="section-title">
                <div>
                  <p className="eyebrow">THE NEXT MOVE</p>
                  <h2>Opportunities worth testing.</h2>
                </div>
                <button
                  onClick={() => show("Opportunities")}
                  className="text-link"
                >
                  All opportunities <ArrowRight size={13} />
                </button>
              </div>
              {opportunityList}
            </>
          )}
          {tab === "Audience DNA" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">VERIFIED QLOO SIGNALS</p>
                  <h2>The cultural DNA.</h2>
                  <p>
                    Explore scored entities connected to your resolved
                    interests.
                  </p>
                </div>
                <label className="sr-only" htmlFor="dna-category">
                  Filter audience DNA
                </label>
                <select
                  id="dna-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Category | "all")
                  }
                >
                  <option value="all">All categories</option>
                  {state.researchedDimensions.map((c) => (
                    <option key={c} value={c}>
                      {categoryNames[c]}
                    </option>
                  ))}
                </select>
              </div>
              {state.researchedDimensions
                .filter((c) => category === "all" || c === category)
                .map((c) => (
                  <section key={c} className="dna-category">
                    <div className="dna-heading">
                      <h3>{categoryNames[c]}</h3>
                      <span>
                        {state.entities.filter((e) => e.category === c).length}{" "}
                        cultural signals
                      </span>
                    </div>
                    <div className="dna-grid">
                      {state.entities
                        .filter((e) => e.category === c)
                        .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0))
                        .map((e, i) => (
                          <motion.button
                            key={e.id}
                            className="entity-card"
                            onClick={() => setSelected(e.id)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.025, 0.2) }}
                          >
                            <div>
                              <span className="entity-initial">
                                {e.name.slice(0, 1)}
                              </span>
                              <span className="entity-score">
                                {Math.round((e.affinity ?? 0) * 100)}
                                <small> / 100</small>
                              </span>
                            </div>
                            <h4>{e.name}</h4>
                            <p>
                              {e.tags.slice(0, 2).join(" · ") ||
                                `Qloo ${c} affinity`}
                            </p>
                            <div className="entity-strength">
                              <i
                                style={{ width: `${(e.affinity ?? 0) * 100}%` }}
                              />
                            </div>
                            <span className="entity-inspect">
                              Inspect connection <ArrowUpRight size={12} />
                            </span>
                          </motion.button>
                        ))}
                    </div>
                  </section>
                ))}
              <p className="micro-copy">
                Entity cards show the highest observed affinity if an entity
                appears in multiple requests. Inspect its evidence for
                request-specific scores.
              </p>
            </>
          )}
          {tab === "Culture Graph" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">
                    THE RELATIONSHIPS BEHIND THE STRATEGY
                  </p>
                  <h2>Your culture graph.</h2>
                  <p>
                    Pan, zoom, filter a category, or select a node to follow its
                    evidence.
                  </p>
                </div>
                <span className="small-tag">
                  {state.nodes.length} NODES · {state.edges.length} EDGES
                </span>
              </div>
              <div className="graph-full">
                <CultureGraph state={state} onInspect={setSelected} />
              </div>
              <div className="context-note">
                <Network size={17} />
                <span>
                  Solid connections are returned Qloo affinities from one source
                  interest and documented query context. Dashed connections are
                  CulturePilot interpretations. The graph displays a meaningful
                  subset; the JSON export contains the complete research.
                </span>
              </div>
            </>
          )}
          {tab === "Opportunities" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">RANKED BY CULTURAL EVIDENCE</p>
                  <h2>The opportunity radar.</h2>
                  <p>Use these opportunities to choose your next experiment.</p>
                </div>
                <span className="small-tag">
                  {state.opportunities.length} HYPOTHESES
                </span>
              </div>
              {opportunityList}
              <div className="context-note">
                <ScanLine size={18} />
                <span>
                  Fit combines Qloo affinity (50%), evidence density (20%),
                  category breadth (20%), and verified geography (10%). Open
                  “Why this?” for exact inputs.
                </span>
              </div>
            </>
          )}
          {tab === "Strategy" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">FROM CULTURAL SIGNAL TO ACTION</p>
                  <h2>A grounded plan for your next move.</h2>
                  <p>
                    Evidence-grounded strategy.{" "}
                    {state.language?.mode === "assisted"
                      ? "Free language assistance selected the wording."
                      : "Deterministic language mode."}{" "}
                    Validate it in the real world.
                  </p>
                </div>
                <span className="small-tag">
                  {state.brief.objective.toUpperCase()}
                </span>
              </div>
              <div className="strategy-list">
                {state.strategy.map((s, i) => (
                  <article key={s.title}>
                    <span className="strategy-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                      {s.evidenceIds.length > 0 && (
                        <div className="strategy-sources">
                          {s.evidenceIds.slice(0, 4).map((id) => (
                            <button key={id} onClick={() => setSelected(id)}>
                              {state.nodes.find((n) => n.id === id)?.name ??
                                "Cultural signal"}
                              <ArrowUpRight size={11} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "Research Trace" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">INSPECT THE AUTONOMOUS WORKFLOW</p>
                  <h2>The research, in full.</h2>
                  <p>
                    Each tool call, selection, planner decision, and stopping
                    condition.
                  </p>
                </div>
                <span className="small-tag">
                  <Clock3 size={12} />
                  {(state.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="trace-metrics">
                {[
                  { label: "Agent steps", value: state.steps.length },
                  { label: "Qloo calls", value: state.qlooCalls },
                  {
                    label: "Language calls",
                    value: state.language?.calls ?? 0,
                  },
                  {
                    label: "Strategy duration",
                    value: `${state.language?.strategyDurationMs ?? 0}ms`,
                  },
                  { label: "Graph nodes", value: state.nodes.length },
                  { label: "Graph edges", value: state.edges.length },
                ].map((m) => (
                  <div key={m.label}>
                    <span>{m.label}</span>
                    <b>{m.value}</b>
                  </div>
                ))}
              </div>
              <div className="trace-list">
                {state.steps.map((s, i) => (
                  <details key={s.id}>
                    <summary>
                      <span className="trace-index">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <b>{s.title}</b>
                        <small>
                          {s.actor ?? s.tool} · {s.resultCount} returned ·{" "}
                          {s.selectedCount} selected
                        </small>
                      </span>
                      <span className="trace-duration">{s.durationMs}ms</span>
                      <ChevronRight size={15} />
                    </summary>
                    <div className="trace-detail">
                      <h4>Activity</h4>
                      <p>
                        {s.action ?? s.tool} · {s.tool} · Planner:{" "}
                        {s.plannerActor ?? "AGENT"}
                      </p>
                      <p>
                        {s.evidenceAdded ?? 0} Qloo relationships added. Graph
                        construction: GRAPH_ENGINE.
                      </p>
                      <h4>Planner decision</h4>
                      <p>{s.reason}</p>
                      <h4>Tool input</h4>
                      <pre>{JSON.stringify(s.input, null, 2)}</pre>
                      <p>{s.message}</p>
                      <span className="small-tag">
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  </details>
                ))}
              </div>
              <div className="stop-reason">
                <Check size={16} />
                <div>
                  <b>Research stopped: {state.stopReason}</b>
                  <p>
                    Scores and graph relationships were calculated
                    deterministically.{" "}
                    {state.language?.status ?? "Deterministic language mode."}
                  </p>
                </div>
              </div>
              <div className="limitations">
                <h3>What this research does not establish</h3>
                <ul>
                  {state.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <div className="report-end">
        <span>
          <Check size={15} /> Research grounded in Qloo data
        </span>
        <Link href="/brief">
          Build another strategy <ArrowUpRight size={14} />
        </Link>
      </div>
      <EvidenceDrawer
        state={state}
        selected={selected}
        onClose={() => setSelected(null)}
      />
      <div className="print-report">
        <h2>Cultural strategy</h2>
        <p>
          Cultural fit: {state.culturalFit}/100 · Confidence index:{" "}
          {state.confidence}/100 · Coverage: {state.coverage}%
        </p>
        {state.strategy.map((s) => (
          <section key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </section>
        ))}
        <h2>Opportunities & evidence</h2>
        {state.opportunities.map((o) => (
          <section key={o.id}>
            <h3>
              {o.title} — {o.score}/100
            </h3>
            <p>{o.description}</p>
            <p>{o.action}</p>
            <ul>
              {o.reasoning.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Result</th>
                  <th>Affinity</th>
                  <th>Step</th>
                </tr>
              </thead>
              <tbody>
                {state.edges
                  .filter((e) => o.edgeIds.includes(e.id))
                  .map((e) => (
                    <tr key={e.id}>
                      <td>
                        {state.nodes.find((n) => n.id === e.source)?.name}
                      </td>
                      <td>
                        {state.nodes.find((n) => n.id === e.target)?.name}
                      </td>
                      <td>{e.weight?.toFixed(3)}</td>
                      <td>{e.stepId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ))}
        <h2>Research trace</h2>
        {state.steps.map((s) => (
          <section key={s.id}>
            <h3>
              {s.id} · {s.title}
            </h3>
            <p>{s.reason}</p>
            <pre>{JSON.stringify(s.input, null, 2)}</pre>
          </section>
        ))}
        <h2>Limitations</h2>
        <ul>
          {state.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
