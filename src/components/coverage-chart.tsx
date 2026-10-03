"use client";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { useReducedMotion } from "motion/react";
import { categoryNames, type AgentState } from "@/lib/types";
export default function CoverageChart({ state }: { state: AgentState }) {
  const reduced = useReducedMotion();
  const data = state.plannedDimensions.map((category) => ({
    category: categoryNames[category].split(" &")[0],
    signals: Math.min(
      8,
      state.entities.filter((e) => e.category === category).length,
    ),
    full: 8,
  }));
  return (
    <div
      className="coverage-chart"
      role="img"
      aria-label={`Evidence coverage: ${state.coverage} percent across ${state.researchedDimensions.length} categories`}
    >
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#343a32" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#a7aa9b", fontSize: 11 }}
          />
          <Radar
            name="Evidence target"
            dataKey="full"
            stroke="#42483e"
            fill="transparent"
            isAnimationActive={false}
          />
          <Radar
            name="Verified signals"
            dataKey="signals"
            stroke="#cea77e"
            fill="#cea77e"
            fillOpacity={0.16}
            isAnimationActive={!reduced}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
