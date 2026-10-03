import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Network,
  Fingerprint,
  ScanLine,
  ChevronDown,
  Code2,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Constellation } from "@/components/constellation";
export default function Home() {
  return (
    <>
      <header className="landing-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/methodology">The methodology</Link>
          <Button asChild size="small" variant="secondary">
            <Link href="/brief">
              Open studio <ArrowUpRight size={14} />
            </Link>
          </Button>
        </nav>
      </header>
      <main id="main">
        <section className="landing-hero">
          <div className="hero-grid" />
          <Constellation />
          <div className="hero-inner">
            <Reveal>
              <p className="eyebrow">
                <span className="status-dot" /> CULTURAL INTELLIGENCE, PUT TO
                WORK
              </p>
              <h1>
                Understand what
                <br />
                your audience
                <br />
                <span>actually cares about.</span>
              </h1>
              <p className="hero-description">
                Your next big idea deserves more than a guess. <br />
                Turn audience tastes into a grounded brand strategy,
                <br className="desktop-break" /> powered by Qloo.
              </p>
              <div className="hero-actions">
                <Button asChild>
                  <Link href="/brief">
                    Build a strategy <ArrowUpRight size={17} />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/brief?example=coffee">
                    Explore live demo <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
              <p className="hero-note">
                No account. No AI subscription. Evidence at every step.
              </p>
            </Reveal>
          </div>
          <div className="hero-bottom">
            <span>STRATEGY STARTS WITH CULTURE</span>
            <a href="#how-it-works" aria-label="Explore how CulturePilot works">
              <ChevronDown size={18} />
            </a>
            <span>
              POWERED BY <b>qloo</b>
            </span>
          </div>
        </section>
        <section id="how-it-works" className="landing-section">
          <Reveal>
            <div className="section-kicker">
              <span>01 / THE SHIFT</span>
              <span>FROM INTUITION TO INTELLIGENCE</span>
            </div>
            <div className="section-heading">
              <h2>
                Taste becomes
                <br />
                <span>your next move.</span>
              </h2>
              <p>
                Your audience lives across categories.
                <br />
                Your strategy should, too.
              </p>
            </div>
          </Reveal>
          <div className="explanation-columns">
            {[
              {
                icon: Fingerprint,
                title: "Start with your audience.",
                text: "Tell us what you're building, who it's for, and where. CulturePilot plans a focused cultural investigation.",
              },
              {
                icon: Network,
                title: "Connect their cultural world.",
                text: "The agent resolves Qloo interests, explores real affinities, and follows new connections across categories.",
              },
              {
                icon: ScanLine,
                title: "Make an informed move.",
                text: "Get ranked opportunities with inspectable evidence, transparent scores, and practical next steps.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <span className="feature-number">0{i + 1}</span>
                <item.icon size={25} strokeWidth={1.3} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="landing-section affinity-section">
          <Reveal className="affinity-copy">
            <p className="eyebrow">02 / CONNECT THE UNEXPECTED</p>
            <h2>
              A richer picture.
              <br />
              <span>A sharper strategy.</span>
            </h2>
            <p>
              A brand affinity can lead to an artist. An artist can lead to a
              place. CulturePilot follows those connections, then checks whether
              the research has enough breadth to support a recommendation.
            </p>
            <Link href="/methodology" className="text-link">
              Explore the research loop <ArrowUpRight size={16} />
            </Link>
          </Reveal>
          <Reveal className="flow-illustration">
            <div className="flow-label">THE CULTUREPILOT RESEARCH LOOP</div>
            <div className="flow-track">
              <div>
                <Fingerprint />
                <span>Your audience</span>
                <small>Brief & interests</small>
              </div>
              <ArrowRight />
              <div>
                <Network />
                <span>Their culture</span>
                <small>Qloo affinities</small>
              </div>
              <ArrowRight />
              <div>
                <ScanLine />
                <span>Your opportunity</span>
                <small>Traceable strategy</small>
              </div>
            </div>
            <div className="flow-return">
              <span>Evaluate coverage</span>
              <span>↳ Explore the next connection</span>
            </div>
          </Reveal>
        </section>
        <section className="landing-section evidence-section">
          <Reveal>
            <p className="eyebrow">03 / NOTHING BEHIND THE CURTAIN</p>
            <h2>
              A reason behind
              <br />
              <span>every recommendation.</span>
            </h2>
            <p>
              Open “Why this?” to follow an opportunity back to its cultural
              signals. See the Qloo request, the returned affinity, and the
              formula that shaped its rank.
            </p>
            <div className="evidence-details">
              <span>
                <span className="status-dot" /> Real Qloo signals
              </span>
              <span>Documented scoring</span>
              <span>Complete research trace</span>
            </div>
            <Button asChild>
              <Link href="/brief">
                Find your cultural edge <ArrowUpRight size={17} />
              </Link>
            </Button>
          </Reveal>
          <div className="evidence-motif" aria-hidden="true">
            <div className="evidence-line" />
            <span className="motif-node">RESOLVED INTEREST</span>
            <span className="motif-node">QLOO AFFINITY</span>
            <span className="motif-node">STRATEGY HYPOTHESIS</span>
            <span className="motif-caption">FOLLOW THE EVIDENCE ↑</span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>Culture is connected. Your strategy can be, too.</p>
        <div>
          <Link href="/methodology">Methodology</Link>
          <a
            href="https://github.com/ect2000/culturepilot"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={15} /> Source
          </a>
          <span>© 2026 CulturePilot</span>
        </div>
      </footer>
    </>
  );
}
