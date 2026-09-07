# Epic 1 Context: Évaluer un prompt par exécutions multiples

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic delivers the core evaluation loop of the Prompt Evaluator POC: a user enters a prompt and a set of free-text acceptance criteria, chooses how many times to run it (N, a 1-10 slider defaulting to 5 — FR3b), triggers N independent executions of that prompt, has each execution scored against the criteria, and sees a reliable final score (average + per-execution detail + per-criterion stability). It also covers standing up the project itself (repo, Next.js scaffold, Vercel deployment) as its first story. This epic matters because it is the entire evidence base the demo depends on: a working, bug-free, end-to-end evaluation flow is the primary success criterion for the go/no-go decision from the sponsor. Getting the measurement itself right (true independence between runs, no partial/misleading averages) is what makes the resulting score trustworthy.

**Current status (2026-09-08):** Stories 1.1 to 1.4 are done. The repo is at github.com/swoodpartners/PromptEvaluator (migrated from an initial personal repo) and the app is deployed at https://prompt-evaluator-pi.vercel.app/. The Anthropic API key is provisioned — locally in `.env.local` and as a Vercel environment variable — so nothing is blocked. Deployment is manual via the Vercel CLI: a `git push` does **not** redeploy the site, because the GitHub org connection is unresolved. Story 1.5 is next.

## Stories

- Story 1.1: Initialize and deploy the project (repo, Next.js scaffold, Vercel) — DONE
- Story 1.2: Enter a prompt and its acceptance criteria — DONE
- Story 1.3: Execute the prompt N times securely (`/api/execute`) — DONE
- Story 1.4: Score each result against the criteria (`/api/score`) — DONE
- Story 1.5: View the average score and per-criterion stability — NEXT

## Requirements & Constraints

- A prompt (free text) and acceptance criteria (free text, one per line) are the only inputs; at least 1 non-empty criterion is required before an evaluation can be launched, blank lines are ignored, and duplicate criteria are de-duplicated (first occurrence wins) so one criterion cannot weigh twice in the score.
- N (the number of executions) is chosen by the user on a 1-10 slider, default 5 (FR3b), and is frozen at launch — moving the slider mid-run does not change the evaluation in progress.
- The prompt runs N times against the Anthropic API (Claude Haiku), each run in a completely fresh, independent context — no shared conversation history between runs.
- Each of the N outputs is scored by a separate API call (also a fresh context) that judges every criterion as passed/not-passed with an explanation.
- Per-execution score = (criteria passed / total criteria) × 10. Final score = average of the N execution scores.
- The user must see: the overall average, each of the N individual execution scores, and, per criterion, how many times (out of N) it was validated.
- Measurement integrity is a hard constraint: if any single execution or scoring call fails, the entire evaluation is discarded and a clear error is shown — never compute or present an average over a partial set of results.
- The Anthropic API key must never be exposed to the client; all LLM calls happen only from server-side code. The key is provisioned both locally and on Vercel, so the flow can be exercised end to end.
- Cost scales as 2N Anthropic calls per evaluation (N executions + N scorings) — 20 calls at N = 10. Worth keeping in view against the ~€10-20 envelope as Epic 2 adds `/api/analyze`.
- Budget/reliability targets (cross-cutting, not owned by this epic specifically): keep total API spend in the ~€10-20 range for the whole POC, and the app must run without bugs during the sponsor demo.
- No login/auth, no database, no persistence between sessions — out of scope for this POC.
- No formal UX spec exists; the only steer is that the interface should feel simple and playful (P1, nice-to-have), with no fixed visual identity required.

## Technical Decisions

- Single Next.js 16.3 (App Router) project, Node.js ≥ 20.9, Tailwind CSS 4.3.3, `@anthropic-ai/sdk` 0.123.0, Claude Haiku model, hosted on Vercel — already scaffolded and deployed (repo + Vercel project exist).
- Strict client/server split: `app/` holds client UI with no direct LLM calls; only `app/api/*/route.ts` Route Handlers may import/instantiate `@anthropic-ai/sdk` and read `ANTHROPIC_API_KEY` via `process.env` (never `NEXT_PUBLIC_`-prefixed, never passed to the client).
- Fixed API contract (must match exactly; all three routes share this shape even though only two belong to this epic):
  - `POST /api/execute`: `{ prompt: string }` → `{ output: string }`
  - `POST /api/score`: `{ output: string, criteria: string[] }` → `{ results: { criterion: string, passed: boolean, explanation: string }[] }`
  - Uniform error shape on every route: `{ error: string }` + HTTP 500 — never a route-specific error format.
- Each call to `/api/execute` and `/api/score` sends a single message to the Anthropic API with no attached conversation history — one call, one fresh context, no server-side conversational state retained between calls.
- The N-run loop is orchestrated client-side in `app/page.js` (the project is plain JavaScript, not TypeScript — the architecture spine's `.ts`/`.tsx` filenames are stale), not by an aggregating server route. It runs as two successive phases: all N executions, then all N scorings. On any single failure at any step, abandon the whole evaluation and surface the error — never average a subset.
- Shared server-side Anthropic concerns (model id, token ceiling, error mapping, `{ error }` + 500 shape) live in `lib/anthropic.js`; the routes import them rather than each keeping a copy.
- All application state (prompt, criteria, execution results, scores) lives only in React state (`useState`/`useReducer`) in client components. No disk writes, no browser storage, no database.
- Naming: API routes are kebab-case under `app/api/<verb>/route.ts` (`execute`, `score`); React components are PascalCase. One Anthropic call per route — no hidden fan-out.
- Single deployment environment (Vercel, no staging); `ANTHROPIC_API_KEY` is set as a Vercel env var and in local `.env.local` (git-ignored, never committed) — this key is currently missing pending budget approval.

## Cross-Story Dependencies

- Stories 1.1 to 1.4 are complete and nothing is blocked; the `ANTHROPIC_API_KEY` is provisioned.
- Story 1.5 (average + stability display) is the last of this epic. Its data is already produced by Story 1.4: each run carries `results: [{criterion, passed, explanation}]` plus a `score`, with `criterion` guaranteed to be the exact string the user typed (the route re-associates verdicts by position and never echoes the model's paraphrase) — that exact-label guarantee is what makes per-criterion grouping across runs possible.
- Epic 2 (prompt analysis) is independent of this epic's UI flow but, when evaluation results already exist from this epic, Epic 2 consumes them (per-criterion pass/fail data) to surface "unstable" criteria — **validated between 1 and N−1 times out of N** (FR10), not the old fixed "1-4 out of 5". At N = 1 no criterion can be unstable. The data shape produced by Story 1.4/1.5 must remain stable for Epic 2 to build on.
