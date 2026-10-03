"use client";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import { useReducedMotion } from "motion/react";
import { Network, Layers, ArrowUpRight } from "lucide-react";
import { categoryNames, type AgentState, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import "@xyflow/react/dist/style.css";
type SignalNode = Node<{
  label: string;
  kind: string;
  category?: Category;
  score: number | null;
  source: string;
}>;
function Signal({ data, selected }: NodeProps<SignalNode>) {
  return (
    <div
      className={cn(
        "signal-node",
        `signal-${data.kind}`,
        selected && "signal-selected",
      )}
    >
      <Handle type="target" position={Position.Top} />
      <div className="signal-meta">
        <span>
          {data.kind === "brief"
            ? "YOUR IDEA"
            : data.kind === "seed"
              ? "QLOO ANCHOR"
              : data.kind === "opportunity"
                ? "OPPORTUNITY"
                : data.category
                  ? categoryNames[data.category]
                  : "SIGNAL"}
        </span>
        {data.score !== null && <b>{Math.round(data.score * 100)}</b>}
      </div>
      <strong>{data.label}</strong>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { signal: Signal };
export default function CultureGraph({
  state,
  onInspect,
}: {
  state: AgentState;
  onInspect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Category | "all">("all"),
    [mode, setMode] = useState<"compact" | "explore">("compact"),
    [focused, setFocused] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const { nodes, edges } = useMemo(() => {
    const cats = filter === "all" ? state.researchedDimensions : [filter];
    const visible = state.nodes.filter(
      (n) => n.type === "brief" || n.type === "seed",
    );
    for (const category of cats) {
      visible.push(
        ...state.nodes.filter(
          (n) => n.type === "cluster" && n.category === category,
        ),
      );
      visible.push(
        ...state.nodes
          .filter((n) => n.type === "entity" && n.category === category)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, mode === "compact" ? 3 : 7),
      );
      visible.push(
        ...state.nodes.filter(
          (n) => n.type === "opportunity" && n.category === category,
        ),
      );
    }
    const ids = new Set(visible.map((n) => n.id));
    const graphNodes: SignalNode[] = visible.map((n) => {
      let x = 0,
        y = 0;
      if (n.type === "seed") {
        x =
          (state.anchors.findIndex((a) => a.id === n.id) -
            (state.anchors.length - 1) / 2) *
          230;
        y = -280;
      }
      if (n.type === "cluster" && n.category) {
        const angle =
          -Math.PI / 2 +
          (cats.indexOf(n.category) + 0.5) *
            ((Math.PI * 2) / Math.max(1, cats.length));
        x = Math.cos(angle) * 265;
        y = Math.sin(angle) * 265 * 0.78;
      }
      if (n.category && (n.type === "entity" || n.type === "opportunity")) {
        const ring = visible.filter((s) => s.type === n.type);
        const index = ring.findIndex((s) => s.id === n.id);
        const angle =
          -Math.PI / 2 +
          (index + 0.5) * ((Math.PI * 2) / Math.max(1, ring.length));
        // Global spacing prevents adjacent labels within a category overlapping.
        const radius =
          n.type === "opportunity" ? 810 : Math.max(510, ring.length * 30);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius * 0.78;
      }
      const connected =
        !focused ||
        focused === n.id ||
        state.edges.some(
          (e) =>
            (e.source === focused && e.target === n.id) ||
            (e.target === focused && e.source === n.id),
        );
      return {
        id: n.id,
        type: "signal",
        position: { x: x - 90, y: y - 35 },
        data: {
          label:
            n.type === "cluster" && n.category
              ? categoryNames[n.category]
              : n.name,
          kind: n.type,
          category: n.category,
          score: n.score,
          source: n.source,
        },
        style: { opacity: connected ? 1 : 0.22 },
        selected: focused === n.id,
      };
    });
    const graphEdges: Edge[] = state.edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "default",
        animated: !reduced && state.status === "researching",
        style: {
          stroke: e.sourceType === "qloo" ? "#ab8968" : "#525951",
          strokeWidth: e.sourceType === "qloo" ? 1.3 : 1,
          strokeDasharray: e.sourceType === "derived" ? "4 5" : undefined,
          opacity:
            !focused || e.source === focused || e.target === focused
              ? 0.9
              : 0.12,
        },
        data: { edge: e },
      }));
    return { nodes: graphNodes, edges: graphEdges };
  }, [state, filter, mode, focused, reduced]);
  return (
    <div className="graph-wrapper">
      <div className="graph-toolbar">
        <div>
          <Network size={15} />
          <span>CULTURE GRAPH</span>
          <small>{nodes.length} visible nodes</small>
        </div>
        <div>
          <label className="sr-only" htmlFor="graph-category">
            Filter graph category
          </label>
          <select
            id="graph-category"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as Category | "all");
              setFocused(null);
            }}
          >
            <option value="all">All categories</option>
            {state.researchedDimensions.map((c) => (
              <option key={c} value={c}>
                {categoryNames[c]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMode(mode === "compact" ? "explore" : "compact")}
            title="Toggle graph detail"
          >
            <Layers size={14} />
            {mode === "compact" ? "Compact" : "Explore"}
          </button>
        </div>
      </div>
      <div className="graph-canvas">
        <ReactFlow
          key={`${filter}:${mode}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.17 }}
          minZoom={0.2}
          maxZoom={1.6}
          nodesDraggable={false}
          onNodeClick={(_, node) => {
            setFocused(node.id);
            onInspect(node.id);
          }}
          onNodeMouseEnter={(_, node) => setFocused(node.id)}
          onNodeMouseLeave={() => setFocused(null)}
          onPaneClick={() => setFocused(null)}
          onEdgeClick={(_, edge) => onInspect(`edge:${edge.id}`)}
          proOptions={{ hideAttribution: false }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={23}
            size={1}
            color="#313832"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="graph-legend">
        <span>
          <i /> Qloo affinity
        </span>
        <span>
          <i className="derived-line" /> Strategy interpretation
        </span>
        <span>
          Click a node or relationship to inspect <ArrowUpRight size={12} />
        </span>
      </div>
    </div>
  );
}
