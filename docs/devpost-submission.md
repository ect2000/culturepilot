# Devpost submission draft

**Status:** source implementation prepared; complete the final live verification and public links before submitting. Do not describe unverified live behavior as tested. Replace the link fields only with verified URLs.

## Project name

CulturePilot

## Elevator pitch

An autonomous cultural intelligence agent that turns business ideas and audiences into evidence-backed brand, product and go-to-market strategies using Qloo's Taste Graph.

## Project start date

October 3, 2026

## Existing project?

No. CulturePilot was created specifically for the Qloo Agentic Hackathon, by a solo participant.

## Inspiration

Founders and marketers can generate ideas faster than ever, but still struggle to tell whether those ideas fit the audience they want to reach. Culture spans brands, music, stories and places. We wanted a research tool that connects those worlds and makes the evidence behind a strategic recommendation inspectable.

## What it does

CulturePilot takes a structured business brief, resolves cultural interests in Qloo, and investigates multiple supported categories. A bounded agent evaluates research coverage and follows discovered entities into additional cross-category queries. It builds an interactive provenance graph and turns the verified relationships into ranked opportunities, concise strategy sections and practical experiments. “Why this?” exposes request-specific evidence and score components. A research trace explains every tool call and planner choice. Reports can be saved locally, exported to JSON or printed to PDF.

## How we built it

One TypeScript and Next.js App Router application handles the interface, streaming server route and bounded research agent. Qloo and optional OpenRouter secrets stay server-side. Zod validates briefs, planning actions, evidence and language selections. React Flow visualizes relationships; Recharts presents category coverage; Motion communicates state changes; Radix manages accessible evidence dialogs. We avoided accounts, databases and paid model APIs so the product remains usable with Qloo access alone.

## How AI is used

CulturePilot combines two complementary intelligence layers. Qloo provides the underlying cultural affinity data and Taste Graph signals, while an optional zero-cost OpenRouter model helps interpret user briefs, plan multi-step research and select concise strategy language. Rankings, graphs, recommendation scores and confidence remain deterministic and traceable to Qloo evidence. The verified default is `google/gemma-4-31b-it:free`; only that model and `openrouter/free` are allowed. Current pricing checks and a zero-price provider cap refuse paid inference. If free capacity is unavailable, the structured form, deterministic planner and narrator keep working.

Narration chooses evidence-backed authored language variants, rather than permitting unrestricted cultural claims. Evidence IDs and recommendation support are assigned by code. Model-assisted parsing creates a candidate brief that the user reviews before research. No hidden model reasoning is displayed. Live OpenRouter behavior must be verified after its optional key is configured.

## How Qloo is used

Qloo is the evidence layer behind CulturePilot. The agent repeatedly queries Qloo across relevant cultural dimensions, builds a graph from those affinities and uses them to rank strategic opportunities. `GET /v2/tags` resolves category interests, `GET /search` resolves optional named entity seeds, and `GET /v2/insights` returns scored cross-category affinities. Each Insights query uses one resolved interest, preserving the originating context and returned score. Place requests are constrained to the selected market. The agent then follows strong discovered entities into additional research. Without Qloo evidence, CulturePilot refuses to fabricate a strategy. OpenRouter supplies no cultural entities, affinities, scores or graph relationships.

## Challenges

The main challenge was making agentic behavior inspectable while keeping an optional language model within clear evidence and cost boundaries. We built explicit state, coverage-aware planning, validated action candidates, hard budgets, authored narrative variants and request provenance. We separated geographic evidence from broader cultural affinities and disclosed coarse age-bin matching, correlated support and other limits instead of treating affinity as demand.

## Accomplishments

We implemented a complete flow from brief to research, graph, inspectable opportunities and strategy; optional free brief parsing and research planning with deterministic fallback; an adaptive multi-step research loop; documented monotonic scoring; strict narrative grounding; accessible evidence inspection; and a cohesive responsive research studio. Automated tests cover free-only model gating, malicious external text, tool contracts, budgets, empty data, malformed results, timeouts, rate limits, graph provenance, scoring and narration. Final live API validation must be appended once performed.

## What we learned

An explainable cultural product needs more than returned recommendations. It needs carefully resolved inputs, provenance-preserving queries, visible uncertainty, and a distinction between observed affinity and the action proposed from it. A deterministic bounded planner can provide meaningful autonomy while keeping decisions inspectable.

## What's next

Validate the first market-specific brief with real Qloo access, verify optional free inference, gather feedback on opportunity usefulness, improve seed disambiguation, and add measured campaign experiments. Expand grounded strategy language while keeping deterministic research, scoring and fallback independently functional.

## Built with

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui conventions, Radix UI, Motion, React Flow, Recharts, Lucide, Zod, React Hook Form, Qloo API, OpenRouter (optional, free-only), Gemma, Vercel, Vitest, Playwright.

## Public URL

Pending verified deployment.

## Public repository

Pending verification of public access and pushed source.

## Judge testing instructions

Open the public app and choose **Explore live demo**. The coffee/Madrid brief is filled in; continue through four steps and choose **Start live research**. Watch the real Qloo timeline, then explore Audience DNA and the Culture Graph. Open the first opportunity's **Why this?**, inspect the query-specific evidence, read the strategy, and expand steps in Research Trace. No login or paid model account is required. The deployment owner must have configured a valid event-issued Qloo credential before submission.
