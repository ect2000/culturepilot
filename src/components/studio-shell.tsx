"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Plus,
  Clock3,
  BookOpen,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
} from "lucide-react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";
export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    [connected, setConnected] = useState<boolean | null>(null);
  const [language, setLanguage] = useState<{
    status: string;
    message: string;
  } | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        if (live) {
          setConnected(d.qlooConfigured);
          setLanguage(d.language ?? null);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const items = [
    { href: "/brief", icon: Plus, label: "New strategy" },
    { href: "/analyses", icon: Clock3, label: "Recent analyses" },
    { href: "/methodology", icon: BookOpen, label: "Methodology" },
  ];
  return (
    <div className="studio-shell">
      <aside className={cn("sidebar", open && "sidebar-open")}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-menu icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="status-dot" /> PERSONAL STUDIO
        </div>
        <nav aria-label="Studio navigation">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn("sidebar-link", path === item.href && "active")}
            >
              <item.icon size={17} />
              {item.label}
              {path === item.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Compass size={20} />
          <p>
            Your next move,
            <br />
            <span>culturally grounded.</span>
          </p>
        </div>
        <div className="sidebar-bottom">
          <div className="connection-label">
            <span
              className={cn(
                "status-dot",
                connected !== true && "status-neutral",
              )}
            />
            {connected === true
              ? "Qloo key configured"
              : connected === false
                ? "Qloo setup needed"
                : "Checking connection"}
          </div>
          <small>Live research · No paid AI</small>
          <details className="integration-status">
            <summary>Integration status</summary>
            <dl>
              <dt>Cultural intelligence</dt>
              <dd>Qloo · {connected ? "Configured" : "Setup needed"}</dd>
              <dt>Strategy language</dt>
              <dd>
                OpenRouter ·{" "}
                {language?.status === "configured"
                  ? "Configured"
                  : language?.status === "configuration-error"
                    ? "Configuration error"
                    : "Optional"}
              </dd>
              <dt>Evidence / graph engines</dt>
              <dd>Ready · Deterministic</dd>
            </dl>
            <p>{language?.message ?? "Checking language configuration."}</p>
          </details>
          <a
            href="https://github.com/ect2000/culturepilot"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={14} /> Open source <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="studio-main">
        <header className="studio-topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <PanelLeftOpen size={19} />
            </button>
            <span>Studio</span>
            <span className="topbar-slash">/</span>
            <b>
              {path.startsWith("/analysis/")
                ? "Cultural research"
                : path === "/analyses"
                  ? "Recent analyses"
                  : path === "/methodology"
                    ? "Methodology"
                    : "Strategy brief"}
            </b>
          </div>
          <Link href="/">
            CulturePilot <ArrowUpRight size={13} />
          </Link>
        </header>
        <main id="main">{children}</main>
        <footer className="studio-footer">
          <span>Powered by Qloo cultural intelligence</span>
          <span>Original code · MIT license</span>
        </footer>
      </div>
    </div>
  );
}
