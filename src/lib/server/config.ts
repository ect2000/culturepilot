import "server-only";
const integer = (name: string, fallback: number, min: number, max: number) => {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.floor(value)))
    : fallback;
};
export function agentConfig() {
  return {
    maxSteps: integer("MAX_AGENT_STEPS", 12, 3, 16),
    maxCalls: integer("MAX_QLOO_CALLS", 12, 2, 14),
    timeoutMs: integer("QLOO_TIMEOUT_MS", 8000, 1000, 10000),
  };
}
