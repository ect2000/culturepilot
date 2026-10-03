"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ExternalLink, Network, ScanLine } from "lucide-react";
import { categoryNames, type AgentState } from "@/lib/types";
export function EvidenceDrawer({
  state,
  selected,
  onClose,
}: {
  state: AgentState;
  selected: string | null;
  onClose: () => void;
}) {
  const opportunity = state.opportunities.find((o) => o.id === selected),
    node = state.nodes.find((n) => n.id === selected),
    edge = state.edges.find((e) => `edge:${e.id}` === selected);
  const relevantEdges = opportunity
    ? state.edges.filter((e) => opportunity.edgeIds.includes(e.id))
    : edge
      ? [edge]
      : state.edges.filter(
          (e) =>
            e.relation === "affinity" &&
            (e.source === selected || e.target === selected),
        );
  const entity = state.entities.find((e) => e.id === selected);
  const title =
    opportunity?.title ??
    node?.name ??
    (edge ? "A cultural connection" : "Evidence");
  return (
    <Dialog.Root
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AnimatePresence>
        {selected && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="evidence-drawer"
                initial={{ x: 45, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 45, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                <div className="drawer-header">
                  <span>
                    <ScanLine size={15} /> FOLLOW THE EVIDENCE
                  </span>
                  <Dialog.Close
                    className="icon-button"
                    aria-label="Close evidence"
                  >
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="drawer-content">
                  <p className="eyebrow">
                    {opportunity
                      ? "WHY THIS OPPORTUNITY?"
                      : edge
                        ? "RELATIONSHIP PROVENANCE"
                        : "CULTURAL SIGNAL"}
                  </p>
                  <Dialog.Title>{title}</Dialog.Title>
                  <Dialog.Description>
                    {opportunity?.description ??
                      entity?.description ??
                      (node?.source === "user"
                        ? "This is your supplied business idea. It provides research context."
                        : node?.source === "qloo"
                          ? "This signal was returned by Qloo. Inspect the related research requests below."
                          : "Inspect how this relationship was created and which research step supports it.")}
                  </Dialog.Description>
                  {opportunity && (
                    <>
                      {state.explanations?.[opportunity.id] && (
                        <div className="supplementary-explanation">
                          <p className="eyebrow">SUPPLEMENTARY EXPLANATION</p>
                          <p>{state.explanations[opportunity.id]}</p>
                          <small>
                            Evidence and scores below remain authoritative.
                          </small>
                        </div>
                      )}
                      <div className="drawer-score">
                        <b>
                          {opportunity.score}
                          <small>/100</small>
                        </b>
                        <span>
                          Opportunity fit
                          <br />
                          <small>CulturePilot evidence score</small>
                        </span>
                      </div>
                      <h3>Score breakdown</h3>
                      <div className="breakdown-list">
                        {[
                          {
                            label: "Qloo affinity",
                            weight: "50%",
                            v: opportunity.breakdown.affinity,
                          },
                          {
                            label: "Evidence density",
                            weight: "20%",
                            v: opportunity.breakdown.evidenceDensity,
                          },
                          {
                            label: "Category breadth",
                            weight: "20%",
                            v: opportunity.breakdown.crossCategorySupport,
                          },
                          {
                            label: "Geographic verification",
                            weight: "10%",
                            v: opportunity.breakdown.geographicRelevance,
                          },
                        ].map((row) => (
                          <div key={row.label}>
                            <span>
                              {row.label}
                              <small>{row.weight} weight</small>
                            </span>
                            <div className="mini-bar">
                              <i style={{ width: `${row.v * 100}%` }} />
                            </div>
                            <b>{Math.round(row.v * 100)}</b>
                          </div>
                        ))}
                      </div>
                      <p className="micro-copy">
                        A prioritization heuristic, not a statistical
                        probability. Category counts do not establish
                        independent evidence.
                      </p>
                      <h3>Reasoning chain</h3>
                      <ol className="reasoning-chain">
                        {opportunity.reasoning.map((r, i) => (
                          <li key={i}>
                            <span>{i + 1}</span>
                            <p>{r}</p>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                  <h3>
                    <Network size={15} /> {relevantEdges.length} supporting
                    relationships
                  </h3>
                  {!relevantEdges.length && (
                    <p className="muted">
                      This node has no scored Qloo relationship. Brief-to-anchor
                      connections are derived from validated input resolution.
                    </p>
                  )}
                  {relevantEdges.map((e) => {
                    const s = state.nodes.find((n) => n.id === e.source),
                      t = state.nodes.find((n) => n.id === e.target),
                      step = state.steps.find((s) => s.id === e.stepId);
                    return (
                      <div className="evidence-relationship" key={e.id}>
                        <div>
                          <span>{s?.name ?? e.source}</span>
                          <ArrowRight size={13} />
                          <strong>{t?.name ?? e.target}</strong>
                        </div>
                        <p>
                          {e.sourceType === "qloo"
                            ? "Qloo affinity"
                            : "CulturePilot derived relationship"}
                          {e.weight !== null
                            ? ` · ${Math.round(e.weight * 100)}/100`
                            : ""}
                          {t?.category ? ` · ${categoryNames[t.category]}` : ""}
                        </p>
                        {step && (
                          <details>
                            <summary>
                              {step.id} · {step.tool}
                            </summary>
                            <p>{step.reason}</p>
                            <pre>{JSON.stringify(step.input, null, 2)}</pre>
                          </details>
                        )}
                      </div>
                    );
                  })}
                  {entity?.address && (
                    <div className="context-note">
                      Qloo address: {entity.address}
                    </div>
                  )}
                  <div className="drawer-source">
                    <a
                      href="https://docs.qloo.com/reference/insights-api-deep-dive"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Qloo Insights documentation <ExternalLink size={12} />
                    </a>
                    <p>
                      Observed affinity → interpreted opportunity → real-world
                      validation.
                    </p>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
