"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Coffee,
  Sparkles,
  MapPin,
  Crosshair,
  Users,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";
import { briefSchema, demoBrief, objectives, type Brief } from "@/lib/types";
import { useResearchSession } from "./research-provider";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
const stages = [
  { title: "The idea", icon: Lightbulb },
  { title: "The audience", icon: Users },
  { title: "The market", icon: MapPin },
  { title: "The ambition", icon: Crosshair },
];
export function BriefBuilder() {
  const params = useSearchParams(),
    router = useRouter(),
    session = useResearchSession();
  const [stage, setStage] = useState(0),
    [seed, setSeed] = useState("");
  const [naturalBrief, setNaturalBrief] = useState(""),
    [parsing, setParsing] = useState(false),
    [parseMessage, setParseMessage] = useState("");
  const form = useForm<z.input<typeof briefSchema>, unknown, Brief>({
    resolver: zodResolver(briefSchema),
    defaultValues:
      params.get("example") === "coffee"
        ? demoBrief
        : {
            idea: "",
            audience: "",
            market: "",
            category: "",
            objective: "Launch a product",
            seeds: [],
          },
  });
  const values = useWatch({ control: form.control }) as Brief;
  const fields: (keyof Brief)[][] = [
    ["idea", "category"],
    ["audience"],
    ["market"],
    ["objective", "seeds"],
  ];
  async function next() {
    if (await form.trigger(fields[stage])) setStage(Math.min(3, stage + 1));
  }
  function run(brief: Brief) {
    router.push(`/analysis/${session.create(brief)}`);
  }
  async function understandBrief() {
    setParsing(true);
    setParseMessage("");
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: naturalBrief }),
      });
      const result = await response.json();
      if (result.brief) {
        const { idea, audience, market, category, objective, seeds } =
          result.brief;
        const valid = briefSchema.safeParse({
          idea,
          audience,
          market,
          category,
          objective,
          seeds,
        });
        if (valid.success) {
          form.reset(valid.data);
          setStage(0);
        }
      }
      setParseMessage(
        result.message ?? result.error ?? "Complete the form below.",
      );
    } catch {
      setParseMessage(
        "Language assistant unavailable. Complete the form below to continue.",
      );
    } finally {
      setParsing(false);
    }
  }
  const examples = [
    {
      title: "Specialty coffee",
      market: "Madrid · Urban professionals",
      icon: Coffee,
      brief: demoBrief,
    },
    {
      title: "Indie skincare",
      market: "Barcelona · Gen Z",
      icon: Sparkles,
      brief: {
        idea: "An independent skincare brand",
        audience: "Young adults aged 18–24",
        market: "Barcelona, Spain",
        category: "Skincare & beauty",
        objective: "Position a brand" as const,
        seeds: [],
      },
    },
    {
      title: "Fitness studio",
      market: "London · Young professionals",
      icon: Crosshair,
      brief: {
        idea: "A premium boutique fitness studio",
        audience: "Young professionals aged 25–34",
        market: "London, UK",
        category: "Fitness & wellness",
        objective: "Launch a product" as const,
        seeds: [],
      },
    },
  ];
  return (
    <div className="page-container brief-page">
      <div className="page-eyebrow">
        <span className="status-dot" /> A BETTER STRATEGY STARTS HERE
      </div>
      <div className="page-heading">
        <div>
          <h1>
            What are you building<span className="accent">?</span>
          </h1>
          <p>
            Give your agent a direction. It will follow the cultural
            connections.
          </p>
        </div>
        <span className="small-tag">NEW RESEARCH</span>
      </div>
      <div className="brief-layout">
        <div className="brief-workspace">
          <details className="natural-brief">
            <summary>
              Describe your idea in one sentence <Sparkles size={14} />
            </summary>
            <div>
              <label htmlFor="natural-brief">
                Your idea, audience, market and goal
              </label>
              <textarea
                id="natural-brief"
                rows={3}
                maxLength={1600}
                value={naturalBrief}
                onChange={(e) => setNaturalBrief(e.target.value)}
                placeholder="I want to launch a premium specialty coffee brand in Madrid for urban professionals aged 25–35."
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={parsing || naturalBrief.trim().length < 12}
                onClick={understandBrief}
              >
                {parsing ? "Understanding brief…" : "Prepare my brief"}
                <ArrowRight size={14} />
              </Button>
              <p className="micro-copy">
                Optional language assistance. Review every field; research
                starts only when you confirm the form.
              </p>
              {parseMessage && (
                <p className="context-note" role="status">
                  {parseMessage}
                </p>
              )}
            </div>
          </details>
          <div className="brief-stepper">
            {stages.map((s, i) => (
              <button
                key={s.title}
                onClick={async () => {
                  if (
                    i < stage ||
                    (await form.trigger(fields.slice(0, i).flat()))
                  )
                    setStage(i);
                }}
                className={cn(
                  "brief-step",
                  i === stage && "current",
                  i < stage && "done",
                )}
                aria-current={i === stage ? "step" : undefined}
              >
                <span>
                  {i < stage ? (
                    <Check size={13} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <b>{s.title}</b>
              </button>
            ))}
          </div>
          <form onSubmit={form.handleSubmit(run)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="brief-stage"
              >
                <div className="stage-number">BRIEF / 0{stage + 1}</div>
                {stage === 0 && (
                  <>
                    <h2>Every idea has a cultural world.</h2>
                    <p className="stage-description">
                      Start with the product, business, or concept you want to
                      explore.
                    </p>
                    <label htmlFor="idea">What are you building?</label>
                    <textarea
                      id="idea"
                      rows={3}
                      placeholder="A premium specialty coffee brand with a community-first approach…"
                      maxLength={500}
                      {...form.register("idea")}
                    />
                    <FieldError text={form.formState.errors.idea?.message} />
                    <div className="field-row">
                      <div>
                        <label htmlFor="category">Category</label>
                        <input
                          id="category"
                          placeholder="e.g. Coffee & hospitality"
                          maxLength={100}
                          {...form.register("category")}
                        />
                        <FieldError
                          text={form.formState.errors.category?.message}
                        />
                      </div>
                      <div className="input-hint">
                        <Lightbulb size={17} />
                        <span>
                          Be specific about the idea.
                          <br />
                          Keep the category simple.
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {stage === 1 && (
                  <>
                    <h2>Who do you want to connect with?</h2>
                    <p className="stage-description">
                      Describe the intended audience. Add an age range when
                      useful.
                    </p>
                    <label htmlFor="audience">Your target audience</label>
                    <textarea
                      id="audience"
                      rows={3}
                      placeholder="Urban professionals aged 25–35 who value quality and thoughtful experiences…"
                      maxLength={300}
                      {...form.register("audience")}
                    />
                    <FieldError
                      text={form.formState.errors.audience?.message}
                    />
                    <div className="context-note">
                      <Users size={18} />
                      <span>
                        Qloo research describes aggregate taste affinities.
                        Audience descriptions give strategy context; supported
                        age ranges become demographic signals.
                      </span>
                    </div>
                  </>
                )}
                {stage === 2 && (
                  <>
                    <h2>Where will your idea take shape?</h2>
                    <p className="stage-description">
                      Choose one city or market for location-aware place
                      research.
                    </p>
                    <label htmlFor="market">Market or location</label>
                    <div className="input-with-icon">
                      <MapPin size={18} />
                      <input
                        id="market"
                        placeholder="Madrid, Spain"
                        maxLength={120}
                        {...form.register("market")}
                      />
                    </div>
                    <FieldError text={form.formState.errors.market?.message} />
                    <div className="suggestion-row">
                      {[
                        "Madrid, Spain",
                        "Barcelona, Spain",
                        "London, UK",
                        "Berlin, Germany",
                      ].map((city) => (
                        <button
                          type="button"
                          key={city}
                          onClick={() =>
                            form.setValue("market", city, {
                              shouldValidate: true,
                            })
                          }
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                    <div className="context-note">
                      <MapPin size={18} />
                      <span>
                        Place results are filtered to this market. Brand and
                        entertainment affinities provide broader cultural
                        context.
                      </span>
                    </div>
                  </>
                )}
                {stage === 3 && (
                  <>
                    <h2>Give the research a purpose.</h2>
                    <p className="stage-description">
                      Your objective shapes the plan and the strategy that
                      follows.
                    </p>
                    <label htmlFor="objective">
                      What do you want to achieve?
                    </label>
                    <select id="objective" {...form.register("objective")}>
                      {objectives.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    <label htmlFor="seed">
                      Optional cultural anchors{" "}
                      <span className="muted">· up to 3 named entities</span>
                    </label>
                    <div className="seed-input">
                      <input
                        id="seed"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        maxLength={100}
                        placeholder="A brand, artist, film, or venue they love"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (
                              seed.trim().length > 1 &&
                              (values.seeds?.length ?? 0) < 3
                            ) {
                              form.setValue("seeds", [
                                ...values.seeds,
                                seed.trim(),
                              ]);
                              setSeed("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        aria-label="Add seed interest"
                        disabled={
                          seed.trim().length < 2 || values.seeds.length >= 3
                        }
                        onClick={() => {
                          form.setValue("seeds", [
                            ...values.seeds,
                            seed.trim(),
                          ]);
                          setSeed("");
                        }}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="seed-list">
                      {values.seeds.map((s, i) => (
                        <span key={s}>
                          {s}
                          <button
                            type="button"
                            aria-label={`Remove ${s}`}
                            onClick={() =>
                              form.setValue(
                                "seeds",
                                values.seeds.filter((_, j) => i !== j),
                              )
                            }
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="context-note">
                      <Sparkles size={18} />
                      <span>
                        Without a named seed, your agent resolves the category
                        to a Qloo interest. Ambiguous matches are excluded.
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="brief-controls">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStage(stage - 1)}
                disabled={stage === 0}
              >
                <ArrowLeft size={15} /> Back
              </Button>
              <span>
                0{stage + 1} <span className="muted">/ 04</span>
              </span>
              {stage < 3 ? (
                <Button key="continue" type="button" onClick={next}>
                  Continue <ArrowRight size={16} />
                </Button>
              ) : (
                <Button key="start-research" type="submit">
                  Start live research <ArrowRight size={16} />
                </Button>
              )}
            </div>
          </form>
        </div>
        <aside className="brief-context">
          <p className="eyebrow">YOUR RESEARCH BRIEF</p>
          <div className="brief-preview">
            <span className="preview-icon">
              <CompassMark />
            </span>
            <h3>{values.idea || "An idea worth exploring."}</h3>
            <dl>
              <dt>AUDIENCE</dt>
              <dd>{values.audience || "Who it's for"}</dd>
              <dt>MARKET</dt>
              <dd>{values.market || "Where it comes to life"}</dd>
              <dt>OBJECTIVE</dt>
              <dd>{values.objective}</dd>
            </dl>
          </div>
          <div className="brief-promise">
            <span className="status-dot" />
            <p>
              Real cultural research.
              <br />
              <span>Every result comes from Qloo.</span>
            </p>
          </div>
        </aside>
      </div>
      <div className="examples-section">
        <div>
          <h3>A starting point, if you need one.</h3>
          <p>Choose a brief. The research will run live.</p>
        </div>
        <div className="example-list">
          {examples.map((e) => (
            <button
              key={e.title}
              onClick={() => {
                form.reset(e.brief);
                setStage(0);
              }}
            >
              <e.icon size={20} strokeWidth={1.4} />
              <span>
                <b>{e.title}</b>
                <small>{e.market}</small>
              </span>
              <ArrowUpRightSmall />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function FieldError({ text }: { text?: string }) {
  return text ? (
    <p className="field-error" role="alert">
      {text}
    </p>
  ) : null;
}
function CompassMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" />
      <path d="m25 13-3 10-9 4 4-10 8-4Z" stroke="currentColor" />
      <circle cx="20" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}
function ArrowUpRightSmall() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 11 11 4M4 4h7v7" stroke="currentColor" />
    </svg>
  );
}
