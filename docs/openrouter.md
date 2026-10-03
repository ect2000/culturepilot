# Optional zero-cost language assistance

Verified October 3, 2026 against the official [models API](https://openrouter.ai/api/v1/models) and [Gemma endpoints API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it:free/endpoints).

Default: **`google/gemma-4-31b-it:free`**. This exact ID includes `-it`; `google/gemma-4-31b:free` is not allowed. Catalog input and output prices are $0, context is 262,144 tokens, and the endpoint advertises response formatting and function calling. Gemma is suitable for short extraction and constrained instruction following. We request JSON schema with provider parameter support required and validate with Zod; native schema compliance can vary by endpoint. Fallback: **`openrouter/free`**, the [free-model router](https://openrouter.ai/openrouter/free). No claim of universal benchmark superiority is made.

## Responsibility boundary

| Layer                      | Owns                                                                                                            | Cannot supply                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Qloo                       | Entities, tags, affinities, cultural relationships                                                              | Predicted business success                          |
| Optional language provider | Reviewable brief extraction, dimension order, selection of valid research candidates, grounded phrasing choices | Evidence, scores, graph mutations, hidden reasoning |
| Deterministic controller   | Budgets, tool execution, stop validation, graph, rankings, confidence, citations and authoritative explanations | Fabricated Qloo data                                |

`LLMProvider` is independent of OpenRouter and has `parseBrief`, `planResearch`, `selectNextResearchStep`, `narrateStrategy` and `explainOpportunity`. `SafeLanguageAssistant` deep-copies state/context before giving it to a provider, validates suggestions again at the boundary, and opens a per-analysis circuit breaker after failure. `DeterministicFallbackProvider` supplies complete planning and narrative behavior. Brief fallback is the existing form, because assuming missing audience or market details would be misleading.

## Production spending controls

1. A code-owned allowlist accepts only the exact Gemma free ID and `openrouter/free`. Primary and fallback are both checked, even when no key is present. Unknown IDs, paid variants, suffix tricks and the incorrect proposed Gemma ID are refused before inference.
2. The client verifies the current public catalog, cached for at most five minutes per fetch transport. Missing models, unknown prices, or any nonzero advertised fee (apart from the non-fee discount field) fail closed.
3. Every chat request sets `provider.max_price` to zero for prompt, completion, request and image. This provider cap guards repricing during the catalog cache interval. No model array, paid plugin, browser-selected model, external tool or arbitrary endpoint is permitted.
4. A fixed maximum of **four inference attempts** applies to an analysis across all roles, including retries. Timeout defaults to four seconds, hard cap five seconds. Retries default to zero, hard cap one, using only the allowed free fallback. The catalog fetch has its own maximum three-second deadline. No recursive retries.
5. Failed inference falls back to deterministic operation. A free account may have small or unavailable capacity; the app never buys credits. Set an account-level spend limit of zero as an additional operator control if desired.

These safeguards enforce the application's zero-price request contract; remote pricing/billing behavior is operated by OpenRouter. We have verified the public catalog, but authenticated inference remains unverified until a key is configured.

## Planning and execution

The model proposes five distinct supported entity categories plus a short concept query drawn from the user's idea/category. Invented types such as `lifestyle` or `dining` are rejected; dining maps to `place`, music to `artist`. The existing engine resolves real Qloo tags or named entities before affinity research.

At the first research decision and once after initial category exploration, it offers a bounded candidate list generated from real state. Each candidate has a code-assigned ID, supported action, category and resolved anchor. The model can select only a candidate ID matching its action. `SEARCH_QLOO_ENTITIES` exists in the action enum, but is never offered as an arbitrary execution candidate; named seed searches remain explicitly derived from reviewed user input. `EXPLORE_AFFINITIES`, `INVESTIGATE_LOCATION` and `EXPAND_CLUSTER` map to actual Insights requests. `STOP_RESEARCH` requires a null candidate plus at least 40% coverage and three entities. The controller can independently stop earlier at budgets or exhausted paths. It reserves one total agent step for synthesis.

## Grounded language, rather than unrestricted prose

The code constructs an evidence ledger from actual entities and anchors. IDs are existing Qloo entity/tag IDs. Each scored entity preserves incoming query-specific affinities, source interests, step IDs and edge IDs. A maximum affinity stored on the entity is a display summary; scoring still reads individual graph edges.

Strategy sections and opportunity explanations are assigned evidence IDs by code. The model receives curated context: brief, verified evidence, deterministic rankings and three authored wording variants for each section/explanation. It selects existing section/opportunity IDs and variant indices only. Zod rejects additional fields, arbitrary prose, unknown IDs and score properties. A second provider-independent validator enforces exact titles, known wording and unchanged evidence IDs.

This is deliberate constrained narration: it improves tone selection and concise presentation without giving a model permission to introduce unsupported claims. It sacrifices unconstrained prose and novel campaign ideas to enforce factual grounding. Source names remain quoted/displayed external data; they are not verified factual claims beyond their Qloo provenance. Deterministic strategies already propose experiments and disclose uncertainty. Insufficient Qloo evidence yields no report, regardless of LLM availability.

`Why this?` keeps the real evidence chain, per-query scores, inputs and scoring breakdown. Language-selected supplementary explanations are labeled; they are never a substitute for evidence. Explanation selection is batched with strategy narration to fit the four-call cap; reopening the drawer causes no inference or spending.

## Prompt/data separation and observability

Instructions are fixed system messages. Briefs, entity names, descriptions and other context are JSON in a separate user message labeled `UNTRUSTED_DATA_JSON`. External text cannot choose model, URL, headers, tools or execution code. We do not request or display hidden reasoning, and ignore any returned reasoning fields. Prompts alone are not the trust boundary: schemas, closed action candidates and authored language are.

Runtime state records mode, safe status, actual inference attempt count, model used and strategy duration. Existing metrics retain Qloo calls, bounded steps, entity count, graph nodes/edges and researched categories. Each trace step includes a number, actor, action, tool, safe input/output summary, accepted results, evidence additions and measured duration. Graph construction runs inside Qloo result processing and is attributed in trace details, rather than adding artificial steps. The sidebar shows **configured** when a key exists, not a false successful connection claim.

No API keys, raw provider errors, internal reasoning or credentials enter the browser, exports, logs or history. `OPENROUTER_API_KEY` is read only by server-only modules; a client import of the provider is blocked by Next.js.

## Environment and verification

See `.env.example`. `OPENROUTER_API_KEY` is optional. `LLM_MODEL` defaults to verified Gemma; `LLM_FALLBACK_MODEL` to `openrouter/free`; `LLM_TIMEOUT_MS=4000`; `LLM_MAX_RETRIES=0`. `APP_URL` optionally sets an HTTPS attribution origin. Local development does not require a public URL.

Unit tests cover valid parsing, invalid JSON/schema, missing fields, normalization, prohibited tools, budget and stop constraints, unknown evidence, unchanged deterministic scores/graph for identical evidence, malicious entity text, paid/renamed/repriced models, retry limits, unavailable service, timeouts, rate limits and cancellation. Browser tests cover review-before-research and optional-key fallback. Tests use isolated synthetic transports; they do not prove live inference or live Qloo behavior.

Official references: [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [provider routing / max price](https://openrouter.ai/docs/guides/routing/provider-selection), [free variant](https://openrouter.ai/docs/guides/routing/model-variants/free), [free-model router](https://openrouter.ai/openrouter/free), [limits](https://openrouter.ai/docs/api/reference/limits).
