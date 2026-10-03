# Validation record — October 3, 2026

## Completed

| Check                    | Result                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `npm run lint`           | Pass, no warnings                                                                                  |
| `npm run typecheck`      | Pass                                                                                               |
| `npm test`               | 91 tests pass across agent, Qloo and optional language contracts                                   |
| `npm run build`          | Pass, production routes and TypeScript compile                                                     |
| `npm run test:e2e`       | 15 tests pass using the production build                                                           |
| GitHub Actions           | [Successful complete CI run](https://github.com/ect2000/culturepilot/actions/runs/37122965099)     |
| Vercel production build  | Pass, Node 24 / Next.js 16.3.8                                                                     |
| Public app               | [culturepilot.vercel.app](https://culturepilot.vercel.app) returns HTTP 200 without authentication |
| Public source            | [ect2000/culturepilot](https://github.com/ect2000/culturepilot), `private=false`, MIT detected     |
| Runtime dependency audit | Zero production vulnerabilities at verification                                                    |

The complete browser report is tested with network interception **only in Playwright**. Synthetic fixtures stay in `tests/` and are never shipped as a production demo. Separate browser checks exercise the real missing-Qloo-key response and missing optional-language-key form fallback. These tests do not establish live provider success.

## Evidence and optional language tests

Coverage includes actual call/step budgets, cancellation, adaptive follow-ups, stop validation, empty results, malformed responses, request timeout, rate limits, authentication errors, graph provenance, deterministic score clamps and monotonicity. Language tests cover structured extraction, whitespace normalization, invalid JSON/schema, missing fields, unsupported actions, unknown candidates/evidence, invented scores, arbitrary narrative prose, malicious entity text, free model allowlists, incorrect Gemma IDs, repricing, inference attempt/retry caps and fallback.

For identical Qloo evidence, assisted and deterministic runs produce identical opportunities, scores, confidence, graph nodes and edges. Provider mutation attempts affect only cloned input state. Model-generated evidence or arbitrary prose is refused; citations and narrative content come from deterministic evidence contexts.

## Interface verification

Main routes and all six report tabs were checked at **1440, 1024 and 390 px**. No horizontal document overflow. Report checks include node/edge filtering, evidence drawer, keyboard tabs, focus/escape, strategy citations, trace expansion, saved local history and JSON download. The sentence parser populates fields without starting research, requiring explicit form review. Mobile navigation and reduced-motion preference pass.

Automated axe checks for WCAG 2 A/AA and 2.1 AA pass on the landing, studio routes, every desktop report tab and evidence drawer, and the expanded sentence-parser/integration-status view. Automated checks are not a complete accessibility certification.

Visual inspection reviewed production landing/brief and synthetic report QA images. The latter are ignored test artifacts and are not submission screenshots. The print stylesheet includes strategy, opportunities, query-specific evidence and trace regardless of the selected tab. Browser printing uses the user's print-to-PDF facility.

## Performance measurement

Lighthouse **13.5.0**, default mobile simulation, production landing served locally on Node 24:

| Category / metric        | Result      |
| ------------------------ | ----------- |
| Performance              | 90 / 100    |
| Accessibility            | 100 / 100   |
| Best practices           | 100 / 100   |
| SEO                      | 100 / 100   |
| Largest contentful paint | 3.6 seconds |
| Total blocking time      | 20 ms       |
| Cumulative layout shift  | 0           |

One laboratory run, not field telemetry or a guaranteed production score. React Flow and Recharts are loaded dynamically. Reduced-motion behavior is tested; no unsupported claim of measured universal 60 fps is made. The local Lighthouse JSON is an ignored QA artifact.

## Limits and live checks still required

- `QLOO_API_KEY` is missing in the deployed environment. No real Qloo research/report has been verified. Configure the event-issued key, redeploy, run the coffee/Madrid brief, inspect request affinities and capture screenshots 03–08. The public product cannot meet the event's functional-research requirement until this succeeds.
- `OPENROUTER_API_KEY` is now configured locally and in Vercel Production, and the app was redeployed. Production status confirms configuration. The first live brief request fell back; a zero-price diagnostic received HTTP 429 from the free provider. Successful structured inference remains unverified while free capacity is unavailable. This optional gap does not prevent deterministic Qloo operation.
- The full dependency audit reports five high-severity transitive findings in the development lint chain through `braces`/`micromatch`/`fast-glob`. Production dependencies audit clean. No compatible patched `braces` release was available at verification; do not claim the full development tree is vulnerability-free.
- Vercel Git integration could not connect; CLI deployment succeeds. This affects automatic redeployment, not public availability. Pushes currently require a separate CLI deployment.

Keys, raw provider errors and hidden model reasoning are absent from browser state, history and exports. Environment files and local Vercel credentials are excluded from Git and deployment uploads. The repository contains only the empty environment example.
