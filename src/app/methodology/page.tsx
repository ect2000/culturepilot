import { StudioShell } from "@/components/studio-shell";
import {
  ArrowRight,
  Network,
  ScanLine,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Methodology() {
  return (
    <StudioShell>
      <div className="page-container methodology-page">
        <p className="page-eyebrow">THE RESEARCH BEHIND THE RECOMMENDATIONS</p>
        <div className="page-heading">
          <div>
            <h1>
              Nothing behind the curtain<span className="accent">.</span>
            </h1>
            <p>
              A bounded research agent. Verified Qloo data. Transparent
              strategy.
            </p>
          </div>
          <span className="small-tag">NO LLM REQUIRED</span>
        </div>
        <div className="method-intro">
          <Network size={28} strokeWidth={1.2} />
          <h2>
            Culture is the evidence.
            <br />
            Strategy is the interpretation.
          </h2>
          <p>
            CulturePilot resolves a business concept to a Qloo interest,
            investigates multiple supported categories, and uses discovered
            entities to cross-check thin areas. The planner chooses its next
            step from actual results.
          </p>
        </div>
        <div className="method-loop">
          {[
            "Analyze brief",
            "Resolve interests",
            "Explore categories",
            "Evaluate coverage",
            "Cross-check signals",
            "Score & explain",
          ].map((s, i) => (
            <div key={s}>
              <span>0{i + 1}</span>
              <b>{s}</b>
              {i < 5 && <ArrowRight size={15} />}
            </div>
          ))}
        </div>
        <div className="method-sections">
          <section>
            <p className="eyebrow">01 / THE AUTONOMOUS LOOP</p>
            <h2>A plan that responds to evidence.</h2>
            <p>
              The objective and category choose five research dimensions. The
              first resolved anchor seeds each dimension. Then the agent follows
              high-affinity entities into underrepresented categories. It stops
              when coverage reaches 80%, at least 16 entities are scored, and
              two discovered-entity cross-checks complete—or when its call or
              step budget is exhausted. An optional free language model can
              suggest a plan or select a validated next action, and may stop
              earlier once at least 40% coverage and three real entities exist.
              The deterministic controller enforces all budgets.
            </p>
            <div className="method-limits">
              <span>
                <b>12</b>Default maximum steps
              </span>
              <span>
                <b>12</b>Default maximum Qloo calls
              </span>
              <span>
                <b>8s</b>Timeout per Qloo request
              </span>
            </div>
          </section>
          <section>
            <p className="eyebrow">02 / QLOO TOOL SELECTION</p>
            <h2>Real tools, appropriate inputs.</h2>
            <ul className="method-tools">
              <li>
                <code>GET /v2/tags</code>
                <p>
                  Find a valid interest tag for a business category. Lexical
                  matching rejects ambiguous results.
                </p>
              </li>
              <li>
                <code>GET /search</code>
                <p>
                  Resolve optional named seeds to real Qloo entity IDs. No
                  invented identifiers.
                </p>
              </li>
              <li>
                <code>GET /v2/insights</code>
                <p>
                  Retrieve scored affinities for brands, places, artists, books,
                  films and objective-specific categories. A single resolved
                  interest is used per request to preserve relationship
                  provenance.
                </p>
              </li>
            </ul>
            <p>
              Supported age bins are applied only when a numeric audience range
              is supplied. Places use a Qloo market boundary with zero padding.
              Occupation and freeform audience descriptions stay contextual.
            </p>
            <a
              href="https://docs.qloo.com/reference/insights-api-deep-dive"
              className="text-link"
              target="_blank"
              rel="noreferrer"
            >
              Official Qloo reference <ArrowUpRight size={13} />
            </a>
          </section>
          <section>
            <p className="eyebrow">03 / OPPORTUNITY FIT</p>
            <h2>Every weight is visible.</h2>
            <div className="formula">
              Fit = 100 × (0.50A + 0.20E + 0.20C + 0.10G)
            </div>
            <dl className="formula-definitions">
              <div>
                <dt>A · Qloo affinity</dt>
                <dd>
                  Mean returned affinity of the opportunity’s supporting
                  request-specific relationships.
                </dd>
              </div>
              <div>
                <dt>E · Evidence density</dt>
                <dd>Supporting relationships divided by six, capped at one.</dd>
              </div>
              <div>
                <dt>C · Category breadth</dt>
                <dd>
                  Connected entity categories divided by five, capped at one.
                </dd>
              </div>
              <div>
                <dt>G · Geographic verification</dt>
                <dd>
                  One if the evidence includes place results constrained to the
                  selected market; otherwise zero.
                </dd>
              </div>
            </dl>
            <p>
              Cultural fit is the mean opportunity score. Evidence confidence =
              100 × (0.40 × min(relationships / 20, 1) + 0.35 × min(categories /
              5, 1) + 0.25 × coverage / 100). All components are clamped to [0,
              1].
            </p>
            <div className="context-note">
              <ScanLine size={17} />
              <span>
                These are documented product heuristics, not Qloo-certified
                statistical confidence or probabilities of success. Categories
                and repeated relationships can be correlated. No seed-relevance
                or geography points are fabricated.
              </span>
            </div>
          </section>
          <section>
            <p className="eyebrow">04 / THE BOUNDARIES</p>
            <h2>Optional language. Authoritative evidence.</h2>
            <p>
              Qloo supplies cultural entities and affinity evidence. The
              optional free language assistant helps parse a sentence into a
              reviewable brief, order research dimensions, select supported
              actions and choose grounded strategy language. It cannot change
              graph relationships, scores or citations. If unavailable, the
              structured form and deterministic planner and narrator continue
              working.
            </p>
            <p>
              Strategy wording is constrained to authored variants tied to real
              evidence. External names and metadata are data, never
              instructions. Supplementary explanations do not replace the
              evidence shown in Why this?
            </p>
          </section>
          <section>
            <p className="eyebrow">05 / THE BOUNDARIES</p>
            <h2>A better hypothesis. Not a guarantee.</h2>
            <p>
              Qloo aggregate affinities do not establish individual preferences,
              purchase intent, causality, willingness to pay, or local demand.
              CulturePilot recommends experiments with cultural grounding.
              Commercial decisions still need interviews, market checks and
              measured outcomes.
            </p>
            <ul className="method-checks">
              {[
                "Unscored responses are excluded from strategy evidence.",
                "Every graph relationship links to its originating research step.",
                "No fabricated production reports or offline demo findings.",
                "No accounts, database, paid model API, or client-side Qloo secret.",
              ].map((t) => (
                <li key={t}>
                  <Check size={15} />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="method-cta">
          <h2>Put the research to work.</h2>
          <Button asChild>
            <Link href="/brief">
              Build a strategy <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </StudioShell>
  );
}
