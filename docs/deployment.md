# Deployment record

Production: **[https://culturepilot.vercel.app](https://culturepilot.vercel.app)**. Public repository: **[https://github.com/ect2000/culturepilot](https://github.com/ect2000/culturepilot)**. MIT license detected by GitHub. Public, unauthenticated HTTP 200 verified October 3, 2026.

Vercel project: `culturepilot`, team `3eemiliocastejon-gmailcoms-projects`. [Project dashboard](https://vercel.com/3eemiliocastejon-gmailcoms-projects/culturepilot). Next.js framework, Node 24, standard `npm run build`, one deployment. Research route permits 180 seconds; optional brief parsing permits 30 seconds. The production alias serves the verified deployment without a login wall.

Deployment was completed using the authenticated Vercel CLI. GitHub repository connection through Vercel Git integration was unavailable despite the public repository; CLI upload is working. Until the owner connects the GitHub app, run `vercel --prod --yes` after source changes. GitHub Actions already validates pushes independently.

## Configure the real providers

In the project's **Settings → Environment Variables**, add:

| Variable             | Production value                                        |
| -------------------- | ------------------------------------------------------- |
| `QLOO_API_KEY`       | Individually issued event key, secret                   |
| `QLOO_BASE_URL`      | Optional; defaults to `https://hackathon.api.qloo.com`  |
| `OPENROUTER_API_KEY` | Optional OpenRouter secret                              |
| `LLM_MODEL`          | Optional; defaults to `google/gemma-4-31b-it:free`      |
| `LLM_FALLBACK_MODEL` | Optional; defaults to `openrouter/free`                 |
| `APP_URL`            | Already configured as `https://culturepilot.vercel.app` |

The remaining budgets have safe defaults documented in `.env.example`. Credentials must never use a `NEXT_PUBLIC_` prefix. Save credentials through Vercel's secret UI or interactive `vercel env add`; do not put secrets in command arguments, commits or chat. Redeploy after setting them.

`GET /api/status` exposes only safe configuration status; a key's existence is not proof of provider connectivity. A live research run is the actual integration check. If OpenRouter is not configured or its free capacity fails, deterministic mode remains available. An invalid/paid model configuration refuses inference and clearly falls back. Missing or unsuccessful Qloo access yields an honest error with no invented report.

## Finish live verification

1. Redeploy after saving keys.
2. Open `/brief?example=coffee`, review four steps and start live research.
3. Confirm Qloo returns scored entities, that the graph edges link to actual research steps, and that Why this lists their query-specific affinities.
4. With optional language enabled, verify a sentence populates the review form and Research Trace records actual language calls. Confirm the reported model belongs to the free allowlist; if capacity fails, verify deterministic fallback.
5. Run `npm run screenshots` with `SCREENSHOT_BASE_URL=https://culturepilot.vercel.app`. The script captures real data only. Inspect images 03–08 before including them in Devpost.
6. Update this validation record and submission status to reflect actual live results. Keep the event key and public app working through judging.

Current production has the optional OpenRouter key configured, with a new successful deployment. A live free-provider check returned HTTP 429; the brief endpoint correctly uses deterministic form fallback. The Qloo key is still missing. Screenshots 01–02 and the real connection-needed state have been captured; report screenshots remain blocked. Do not submit the connection-needed state as a functional demo.
