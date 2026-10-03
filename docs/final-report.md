# CulturePilot implementation report

**App:** [culturepilot.vercel.app](https://culturepilot.vercel.app). **Source:** [public MIT repository](https://github.com/ect2000/culturepilot). This is a new solo project begun October 3, 2026. Implementation, production deployment and public source are complete; final hackathon readiness is blocked by missing live Qloo credentials.

## Product and cultural research

The studio includes a premium responsive landing, four-step reviewable brief, optional sentence extraction, streamed research activity, Audience DNA, interactive Culture Graph, ranked opportunities, strategy, Research Trace, local history, JSON export and full print/PDF layout. Evidence inspection explains each opportunity's supporting entities, affinities, weights and originating API request.

Qloo is the sole cultural evidence source. Supported tools resolve interest tags and named entities, then retrieve scored affinities. Initial discovery spans five valid Qloo dimensions; follow-ups use actual discovered entities and missing coverage. Requests preserve one source interest and query-specific affinities. Market filtering applies only to places, and age-bin broadening/context limits are disclosed.

The deterministic graph distinguishes user, Qloo and derived nodes/edges. The opportunity scorer weights affinity 50%, density 20%, category breadth 20%, verified geography 10%; confidence is a coverage/density heuristic. Neither represents success probability. All recommendations have real source IDs and supporting relationships.

## Optional OpenRouter

Default **`google/gemma-4-31b-it:free`**, verified on the public catalog October 3, 2026 at **$0 input and $0 output**. Only alternate: `openrouter/free`. The provider checks current catalog pricing and applies zero-price request caps. Unknown, paid, incorrectly named or repriced models are refused; no user input can select a paid model. The optional key is now configured locally and in redeployed production. A live free-provider check returned HTTP 429, and the brief endpoint correctly fell back; successful structured inference remains unverified.

OpenRouter can extract a candidate brief for user review, suggest supported dimensions, choose from allowed controller-generated research actions, select grounded strategy wording and concise opportunity explanations. Qloo supplies entities/affinities; deterministic code executes tools, constructs graphs, scores/ranks opportunities and assigns provenance. The rest of the engine depends on a provider-independent interface rather than OpenRouter.

Grounding is enforced beyond prompts: the model selects authored language variants already tied to known evidence. It cannot contribute unrestricted cultural claims, citations, scores or graph relationships. External content is isolated as untrusted data. State snapshots prevent a provider from mutating controller evidence. The limitation is less creative/free-form language, accepted to preserve factual support. Why this remains the central evidence moment.

Without an optional key, or on timeout, rate limit, invalid output, cost/configuration error or unavailable capacity, deterministic planning/narration continues. Brief extraction falls back to the existing form. Safe status and actual call counts are visible; no hidden model reasoning or provider secrets are exposed.

## Validation and deliverables

Lint, typecheck, production build, **91 unit tests and 15 browser tests** pass. [GitHub CI](https://github.com/ect2000/culturepilot/actions/runs/37122965099) passes. Public app HTTP 200 and public MIT source are verified. Responsive checks cover 1440/1024/390 px; automated axe checks pass. Lighthouse local production/mobile: performance 90, accessibility/best practices/SEO 100. [Detailed validation and limitations](validation.md).

README, architecture, scoring rationale, model/cost/grounding contracts, Devpost draft, optional 2:45 demo script, deployment instructions and screenshot status are complete. [Devpost draft](devpost-submission.md) names both layers with Qloo central and accurately marks unverified live functionality. [Production screenshots](screenshots/STATUS.md) include the landing and brief only; no simulated results are passed off as real evidence.

## Remaining blockers

**Required:** set the event-issued `QLOO_API_KEY` in Vercel Production, redeploy, validate a real coffee/Madrid run and capture screenshots 03–08. Until then the public studio is deployed but does not satisfy the event's live research requirement.

**Optional layer:** the key is configured; successful structured inference awaits available free-provider capacity following an HTTP 429 response. Deterministic mode works once Qloo is configured. No paid account action or model purchase is needed.

Vercel Git integration is unavailable; successful CLI deployment is the current path. This does not block live availability. The optional video is scripted, not recorded; recording should follow real research. The deadline is October 31, 2026 at 04:45 Europe/Madrid. Keep the functional public app and valid access through judging; do not mark submission ready before live verification.
