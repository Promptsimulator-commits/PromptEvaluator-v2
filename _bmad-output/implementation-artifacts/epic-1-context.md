# Epic 1 Context: Évaluer un prompt par exécutions multiples

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic delivers the core evaluation loop of the Prompt Evaluator POC: a user enters a prompt and a set of free-text acceptance criteria, triggers 5 independent executions of that prompt, has each execution scored against the criteria, and sees a reliable final score (average + per-execution detail + per-criterion stability). It also includes standing up the project itself (repo, Next.js scaffold, Vercel deployment) as its first story, since none of that infrastructure exists yet. This epic matters because it is the entire evidence base the demo depends on: a working, bug-free, end-to-end evaluation flow is the primary success criterion for the go/no-go decision from the sponsor. Getting the measurement itself right (true independence between runs, no partial/misleading averages) is what makes the resulting score trustworthy.

## Stories

- Story 1.1: Initialize and deploy the project (repo, Next.js scaffold, Vercel)
- Story 1.2: Enter a prompt and its acceptance criteria
- Story 1.3: Execute the prompt 5 times securely
- Story 1.4: Score each result against the criteria
- Story 1.5: View the average score and per-criterion stability

## Requirements & Constraints

- A prompt (free text) and acceptance criteria (free text, one per line) are the only inputs; at least 1 non-empty criterion is required before an evaluation can be launched, and blank lines are ignored when counting criteria.
- The prompt runs 5 times against the Anthropic API (Claude Haiku), each run in a completely fresh, independent context — no shared conversation history between runs.
- Each of the 5 outputs is scored by a separate API call (also a fresh context) that judges every criterion as passed/not-passed with an explanation.
- Per-execution score = (criteria passed / total criteria) × 10. Final score = average of the 5 execution scores.
- The user must see: the overall average, each of the 5 individual execution scores, and, per criterion, how many times (out of 5) it was validated.
- Measurement integrity is a hard constraint: if any single execution or scoring call fails, the entire evaluation is discarded and a clear error is shown — never compute or present an average over a partial set of results.
- The Anthropic API key must never be exposed to the client; all LLM calls happen only from server-side code.
- Budget/reliability targets (cross-cutting, not owned by this epic specifically): keep total API spend in the ~€10-20 range for the whole POC, and the app must run without bugs during the sponsor demo.
- No login/auth, no database, no persistence between sessions — out of scope for this POC.
- No formal UX spec exists; the only steer is that the interface should feel simple and playful (P1, nice-to-have), with no fixed visual identity required.

## Technical Decisions

- Single Next.js 16.3 (App Router) project, Node.js ≥ 20.9, Tailwind CSS 4.3.3, `@anthropic-ai/sdk` 0.123.0, Claude Haiku model, hosted on Vercel. No starter template — scaffolded from scratch via `create-next-app`.
- Strict client/server split: `app/` holds client UI with no direct LLM calls; only `app/api/*/route.ts` Route Handlers may import/instantiate `@anthropic-ai/sdk` and read `ANTHROPIC_API_KEY` via `process.env` (never `NEXT_PUBLIC_`-prefixed, never passed to the client).
- Fixed API contract (must match exactly, all three routes used across the app share this shape even though only two belong to this epic):
  - `POST /api/execute`: `{ prompt: string }` → `{ output: string }`
  - `POST /api/score`: `{ output: string, criteria: string[] }` → `{ results: { criterion: string, passed: boolean, explanation: string }[] }`
  - Uniform error shape on every route: `{ error: string }` + HTTP 500 — never a route-specific error format.
- Each call to `/api/execute` and `/api/score` sends a single message to the Anthropic API with no attached conversation history — one call, one fresh context, no server-side conversational state retained between calls.
- The 5-run loop (execute → score, repeated 5 times) is orchestrated client-side in `app/page.tsx`, not by an aggregating server route. On any single failure at any step, abandon the whole evaluation and surface the error — never average a subset.
- All application state (prompt, criteria, execution results, scores) lives only in React state (`useState`/`useReducer`) in client components. No disk writes, no browser storage, no database.
- Naming: API routes are kebab-case under `app/api/<verb>/route.ts` (`execute`, `score`); React components are PascalCase. One Anthropic call per route — no hidden fan-out.
- Single deployment environment (Vercel, no staging); `ANTHROPIC_API_KEY` set as a Vercel env var and in local `.env.local` (git-ignored, never committed).

## Cross-Story Dependencies

- Story 1.1 (project scaffold + deployment) blocks all other stories in this epic — nothing else can be built or demoed until the repo/Next.js/Vercel setup exists.
- Story 1.3 (5 executions) depends on Story 1.2 (prompt + criteria input) for its inputs, and must complete before Story 1.4 (scoring) can run, which in turn must complete before Story 1.5 (average + stability display) has data to show.
- Epic 2 (prompt analysis) is independent of this epic's UI flow but, when evaluation results already exist from this epic, Epic 2 consumes them (per-criterion pass/fail data) to surface "unstable" criteria (validated 1-4 times out of 5) — so the data shape produced by Story 1.4/1.5 must remain stable for Epic 2 to build on.
