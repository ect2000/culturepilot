"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, ArrowUpRight, Plus, Trash2, HardDrive } from "lucide-react";
import type { AgentState } from "@/lib/types";
import { clearHistory, readHistory } from "@/lib/storage";
import { Button } from "./ui/button";
export function RecentAnalyses() {
  const [reports, setReports] = useState<AgentState[]>([]),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setReports(readHistory());
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="page-container history-page">
      <p className="page-eyebrow">YOUR LOCAL RESEARCH LIBRARY</p>
      <div className="page-heading">
        <div>
          <h1>
            Recent analyses<span className="accent">.</span>
          </h1>
          <p>Your last eight completed strategies, saved on this device.</p>
        </div>
        <Button asChild size="small">
          <Link href="/brief">
            <Plus size={15} /> New strategy
          </Link>
        </Button>
      </div>
      {!loaded ? (
        <div className="skeleton skeleton-panel" />
      ) : reports.length ? (
        <>
          <div className="history-list">
            {reports.map((r) => (
              <Link href={`/analysis/${r.id}`} key={r.id}>
                <span className="history-symbol">
                  <Clock3 size={20} />
                </span>
                <div>
                  <h2>{r.brief.idea}</h2>
                  <p>
                    {r.brief.market} · {r.entities.length} verified signals ·{" "}
                    {new Date(r.startedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="history-score">
                  {r.culturalFit}
                  <small>FIT INDEX</small>
                </span>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              clearHistory();
              setReports([]);
            }}
          >
            <Trash2 size={14} /> Clear local history
          </Button>
        </>
      ) : (
        <div className="history-empty">
          <div className="empty-orbit">
            <Clock3 size={32} strokeWidth={1} />
          </div>
          <h2>Your cultural discoveries start here.</h2>
          <p>
            Complete a live research session and your strategy will appear here.
            <br />
            No account or database required.
          </p>
          <Button asChild>
            <Link href="/brief">
              Build your first strategy <ArrowUpRight size={15} />
            </Link>
          </Button>
        </div>
      )}
      <div className="context-note">
        <HardDrive size={16} />
        <span>
          Reports stay in your browser. Clearing site data removes them. Export
          JSON or print to PDF to keep a copy. Analysis links work only on a
          device with that local report.
        </span>
      </div>
    </div>
  );
}
