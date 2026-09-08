# Epic 2 Context: Analyser un prompt et recevoir des suggestions

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic delivers the second (and final) capability of the Prompt Evaluator POC: on demand, at any time, the user gets a structured analysis of their prompt across four dimensions (persona, objective, constraints, examples), each rated present/clear/absent with an explanation and a concrete improvement example. When Epic 1's evaluation results already exist for the current prompt, the analysis is enriched with them and explicitly calls out unstable criteria. This matters because the analysis is what turns a raw score into learning: the PRD's core goal is that the tool helps users *understand their prompting mistakes*, not just get a corrected prompt — the recommended practice loop is evaluate → analyze → rewrite → re-evaluate, and this epic is the "analyze" step. Analysis is independent of evaluation (it works with or without prior run results) and can be triggered before or after an evaluation.

## Stories

- Story 2.1: Request a structured analysis of the prompt (4 dimensions, via `/api/analyze`)
- Story 2.2: Enrich the analysis with existing evaluation results (unstable criteria)

## Requirements & Constraints

- Analysis is available at any time regardless of evaluation state — with a prompt alone (no criteria or evaluation needed), or after an evaluation has run.
- Each request is a separate API call in a fresh context — no conversation history, no shared state with prior execute/score/analyze calls.
- The prompt is judged on exactly 4 dimensions: persona, objective ("objectif"), constraints ("contraintes"), examples ("exemples"). Each dimension gets a status of present / clear / absent ("présent" / "clair" / "absent"), an explanation, and a concrete example of how to improve it.
- A criterion is "unstable" if it was validated between 1 and N−1 times out of N (neither never nor always). At N = 1 no criterion can ever be unstable — in that case the analysis is based on prompt structure alone.
- When evaluation results exist, they must be passed into the analysis call so it can name the unstable criteria explicitly, consistent with what Epic 1's UI already shows. When no evaluation has been run yet, analysis still works, simply without that enrichment — this must not be a hard dependency or block the feature.
- The judgment style should be qualitative and explanatory (status + why + concrete rewrite example) rather than a bare pass/fail score — this dimension of the feature is inherently qualitative, unlike Epic 1's numeric scoring.
- Cost note: analysis adds one more Anthropic call on top of the 2N calls of Epic 1 (N executions + N scorings) — worth keeping in view against the overall ~€10-20 POC budget, though a single analyze call is cheap relative to a full N-run evaluation.

## Technical Decisions

- Fixed contract for the new route (must match exactly): `POST /api/analyze`: `{ prompt: string, runResults?: { criterion: string, passed: boolean }[][] }` → `{ dimensions: { name: "persona" | "objectif" | "contraintes" | "exemples", status: "présent" | "clair" | "absent", explanation: string, example: string }[] }`. Same uniform error shape as the other routes: `{ error: string }` + HTTP 500.
- `runResults`, when present, is the raw per-run, per-criterion pass/fail data (an array of N runs, each an array of `{criterion, passed}`) — the same shape already produced by Story 1.4/1.5. The route (not the client) is responsible for deriving which criteria are unstable from this data if that logic belongs server-side; regardless of where it's computed, the label must match Epic 1's displayed stability exactly (validated between 1 and N−1 times out of N).
- Route lives at `app/api/analyze/route.ts`, following the same client/server split as the other two routes: only server-side Route Handlers import `@anthropic-ai/sdk` and read `ANTHROPIC_API_KEY` via `process.env`; the "Analyser" trigger and rendering of the 4 dimensions live in the client UI (`app/page.js`) with no direct LLM call.
- Reuse the shared Anthropic helper (model id, token ceiling, error mapping, `{error}` + 500 shape) that Epic 1 already put in `lib/anthropic.js`, rather than duplicating that logic in the new route.
- One Anthropic call per `/api/analyze` request — no hidden fan-out — consistent with the one-call-per-route convention used by `/api/execute` and `/api/score`.
- Note: the project is plain JavaScript (`app/page.js`), not TypeScript — the architecture spine's `.tsx`/`.ts` filenames for routes are aspirational/stale; match the actual file extensions already used by the execute/score routes in the codebase.
- Model, hosting, and stack are unchanged from Epic 1: Claude Haiku via `@anthropic-ai/sdk`, Next.js App Router, Vercel.

## Cross-Story Dependencies

- Story 2.1 is self-contained and can be built and demoed independently of any evaluation having run.
- Story 2.2 depends on Story 2.1 (same route, added enrichment) and on Epic 1's Story 1.4/1.5 output shape (`results: [{criterion, passed, explanation}]` per run, with `criterion` guaranteed to be the exact string the user typed). If that data shape changes in Epic 1, Story 2.2's request payload and unstable-criteria matching must be updated to match.
- Both stories are independent of Epic 1's UI flow itself — analysis can be requested before, after, or without ever running an evaluation — but when both features have been used on the same prompt in the same session, the unstable criteria named in the analysis must stay consistent with what Epic 1 displays as per-criterion stability.
