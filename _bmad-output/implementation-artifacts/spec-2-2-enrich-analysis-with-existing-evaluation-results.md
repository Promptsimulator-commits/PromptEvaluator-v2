---
title: 'Enrich the analysis with existing evaluation results'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/api/analyze` (Story 2.1) judges the prompt on structure alone. When an evaluation (Epic 1) has already run for this prompt, the analysis ignores that real, observed data — including which criteria turned out unstable (validated between 1 and N−1 times out of N) — even though the user already sees that instability in the Epic 1 results panel.

**Approach:** Extend `/api/analyze` to accept an optional `runResults: { criterion: string, passed: boolean }[][]` (raw per-run, per-criterion pass/fail data). When present, the route derives the unstable criteria itself (N = `runResults.length`; a criterion is unstable if its passed-count across the N runs is between 1 and N−1) and feeds that into the model's context so the analysis explicitly names them. Wire `app/page.js`'s "Analyser" button to send this payload whenever a completed evaluation (`isComplete`) exists for the current prompt; otherwise it sends just `{ prompt }` as today, unchanged from Story 2.1.

</frozen-after-approval>

## Code Map

- `app/api/analyze/route.js` — Story 2.1's route. `SYSTEM_PROMPT`, `ANALYSIS_TOOL`, and the `POST` handler all need the `runResults`-aware branch. Reuse the existing single-tool-call, verify-then-return pattern; do not change the response shape (`{ dimensions }`).
- `app/page.js` — `handleAnalyze` (line ~92) currently calls `callApi("/api/analyze", { prompt: promptSnapshot })`. `criterionStability` (line ~203, `{ criterion, passedCount }[]`) and `evaluatedCriteria`/`totalRuns`/`isComplete`/`runs` already hold everything needed to build `runResults` without recomputation — but `runResults` per the contract is raw per-run data (`run.results` already has `{criterion, passed, explanation}` per run; strip to `{criterion, passed}`), not the pre-aggregated `criterionStability`. Build it from `runs.map(run => run.results.map(r => ({ criterion: r.criterion, passed: r.passed })))`, and only when `isComplete` is true.
- `lib/anthropic.js` — no changes; reused as-is (`MODEL`, `MAX_TOKENS`, `errorResponse`, `hasApiKey`, `describeAnthropicError`).
- `_bmad-output/implementation-artifacts/spec-2-1-request-structured-prompt-analysis.md` — prior story's Implementation Notes/Review Triage Log for conventions (guard style, mutual-exclusion, injection framing) to keep consistent.

## Tasks & Acceptance

**Execution:**
- [x] `app/api/analyze/route.js` -- accept optional `runResults` in the request body; if present, validate shape (array of arrays of `{criterion: string, passed: boolean}}`) and reject with the existing `{error}`+500 shape on malformed input -- keeps the same defensive posture as `/api/score`'s `criteria` validation
- [x] `app/api/analyze/route.js` -- when `runResults` is valid and non-empty, compute unstable criteria server-side by position (N = `runResults.length`; unstable if `1 <= passedCount <= N-1`; at N=1 the list is always empty) and append this as extra context in the user message sent to the model (e.g. which criteria were validated X/N times, flagging the unstable ones) -- keeps the derivation server-side per the fixed contract, avoids trusting a client-computed instability label
- [x] `app/api/analyze/route.js` -- update `SYSTEM_PROMPT` to instruct the model that when evaluation context is provided, it must explicitly name the unstable criteria in the relevant dimension's `explanation`/`example` (most naturally `contraintes`, but let the model attach it wherever it best fits the prompt's actual content) -- satisfies FR10's "analysis mentions explicitly the unstable criteria" without changing the fixed `{ dimensions }` response shape
- [x] `app/page.js` -- in `handleAnalyze`, when `isComplete` is true, build `runResults` from `runs`/`evaluatedCriteria` (raw `{criterion, passed}` per run, stripped of `explanation`) and include it in the `/api/analyze` call; when `isComplete` is false, call exactly as today (`{ prompt }` only) -- no evaluation must never be a hard dependency for analysis (FR10, Story 2.1 unchanged)

**Acceptance Criteria:**
- Given a completed evaluation exists for the current prompt, when the user clicks "Analyser", then the request to `/api/analyze` includes `runResults` and the returned analysis explicitly names any unstable criteria (validated between 1 and N−1 times out of N)
- Given no evaluation has been run yet (or the last one didn't complete), when the user clicks "Analyser", then the request omits `runResults` and analysis proceeds exactly as in Story 2.1, with no error and no missing enrichment mentioned
- Given N=1 in a completed evaluation, when the user clicks "Analyser", then no criterion is ever labeled unstable (matches Epic 1's own "no stability at N=1" rule)
- Given the user edits the prompt or re-runs a new evaluation after an analysis was shown, when they analyze again, then the `runResults` sent reflect the evaluation completed for the current prompt (via the existing `analyzedPrompt`/staleness handling), not a stale one

### Review Findings

- [x] [Review][Patch] Cross-run criterion identity not verified in `isValidRunResults` [app/api/analyze/route.js:90] — applied

**Rejected**
- `false` — Blind Hunter: `runResults[0].length === 0` wrongly accepted. Disproved: `computeUnstableCriteria` correctly returns `[]` for zero criteria, and this shape is unreachable from the real UI (`canEvaluate` requires `criteriaCount > 0`).
- `false` — Blind Hunter: HTTP 500 is the wrong status for a client validation error. Disproved: this is the project's deliberate, pre-existing `{error}`+500 contract across all three routes (Architecture Spine AD-2), not an oversight in this diff.
- `false` (disproved live) — Verification Gap: stale-prompt guard (`promptSnapshot === evaluatedPrompt`) had no test evidence. Closed by live browser verification: ran an evaluation, edited the prompt without re-running, intercepted `window.fetch` on "Analyser" — request body was exactly `{"prompt": "..."}`, no `runResults`.
- `false` (disproved live) — Verification Gap: uneven-run-length rejection had no documented check. Already exercised during implementation (direct `fetch` with mismatched lengths returned `{error}`+500); the gap was in documentation, not behavior.
- `low` — Blind Hunter: degenerate `- "" : validé X/N fois` message possible with a crafted empty-string `criterion`. Only reachable by bypassing the UI directly; cosmetic, not worth the added validation complexity.
- `low` — Blind Hunter: non-ASCII CSS class names in the review mockup HTML. The mockup is a one-off PM decision artifact, not shipped code.
- `low` — Blind Hunter: anti-injection framing for criterion labels is instructional only, no structural escaping. Consistent with this codebase's existing deliberate posture (Story 2.1, deferred input-length-cap gap); not a new weakness.
- `low` — Blind Hunter: spec's Tasks & Acceptance checkboxes never checked off despite `status: done`. Fix would edit the spec under review — out of scope for a review finding (checkboxes below are now updated as part of closing out the story).

## Implementation Notes

- `app/api/analyze/route.js`: added `isValidRunResults` (accepts `undefined`, or a non-empty array of arrays of `{criterion: string, passed: boolean}`) and `computeUnstableCriteria` (position-based grouping across runs, `1 <= passedCount <= N-1`, always `[]` at N<=1). Validation failure returns the existing `{error}`+500 shape, matching `/api/score`'s defensive posture for `criteria`.
- When `runResults` is present, the user message gets an extra block naming the N of the existing evaluation and, when any exist, the unstable criteria with their `X/N` count — or an explicit "no unstable criteria" line when the evaluation was fully consistent, so the model doesn't have to guess from silence.
- `SYSTEM_PROMPT` gained one rule: when unstable criteria are supplied, mention them explicitly in whichever dimension's `explanation`/`example` they actually belong to — not forced into `contraintes` — matching the "Option A / souple" placement confirmed with the PM against a two-option mockup (persona vs. always-contraintes) before implementation.
- `app/page.js`'s `handleAnalyze`: builds `runResults` from `runs`/`run.results` (stripping `explanation`, keeping only `criterion`/`passed`) only when `isComplete` is true; otherwise the call is identical to Story 2.1 (`{ prompt }` only). Reuses `promptSnapshot`/`analyzedPrompt`/staleness handling unchanged — no new state needed.
- Manual verification (dev server, browser + one direct `fetch` from devtools console for a deterministic mixed-result case the model wouldn't reliably reproduce on its own):
  - Real evaluate (N=2) → analyze: request included `runResults`; both criteria happened to score 2/2 in that run, so no instability to report (verified the "no unstable criteria" message path indirectly via the malformed/N=1 tests instead — no crash, no incorrect claim of instability).
  - Direct `/api/analyze` call with a contrived 3-run `runResults` where one criterion is 2/3 (instability by construction): response correctly named it ("critère instable ... validé 2/3 fois") inside the `contraintes` dimension's explanation for this particular prompt/criterion pairing — consistent with the "let the model choose" rule, not hardcoded.
  - N=1 `runResults`: 200 OK, no crash, `computeUnstableCriteria` short-circuits to `[]` as designed.
  - Malformed `runResults` (`"not-an-array"`): correctly rejected with `{error}` + HTTP 500, same shape as every other validation failure on this route.
  - No console errors beyond expected HMR websocket noise from the preview sandbox and the deliberate 500 from the malformed-input test.

## Review Triage Log

- **patch** — `handleAnalyze` sent `runResults` whenever `isComplete` was true, without checking that the completed evaluation belonged to the prompt currently in the textarea. Editing the prompt after a completed evaluation (without re-running it) and then clicking "Analyser" would attach a stale evaluation's `runResults` to the new prompt text, misreporting unstable criteria that never applied to it. Fixed: added `evaluatedPrompt` (mirroring `evaluatedCriteria`), and `runResults` is now built only when `isComplete && promptSnapshot === evaluatedPrompt`.
- **patch** — `isValidRunResults` accepted `runResults` where individual runs had different lengths, silently desynchronizing `computeUnstableCriteria`'s position-based grouping and producing a wrong or misleading instability computation instead of being rejected like other malformed shapes on this route. Fixed: added a check that every run's length matches `runResults[0].length`.
- **patch** — The anti-injection framing in `SYSTEM_PROMPT` covered only the prompt text, not the criterion labels now also present in the user message when `runResults` is supplied — free text the user typed into the "Critères d'acceptation" field. Fixed: extended the existing rule to cover criterion labels as data-not-instructions too, matching the standard already set for the prompt itself.
- **low, rejected** — No new Gherkin section was added to `TESTING.md` for this story. Story 2.1 already established the actual precedent for Epic 2: manual verification is documented in the spec's own Implementation Notes rather than a new `TESTING.md` section (see `spec-2-1-request-structured-prompt-analysis.md`). Following that precedent for consistency; not worth reverting to the Epic 1 pattern for one story.
- **low, rejected** — No UI indicator shows whether an analysis was enriched with evaluation results. The spec explicitly scoped this as "no new button/screen" (confirmed with the PM against a two-option mockup before implementation), and the feature behaves correctly without it; a visible indicator is a UX enhancement for a future story, not a defect in this one.

### `/bmad-code-review` pass (branch diff vs `main`)

- **patch** — `isValidRunResults` checked that every run had the same *length* but never that the *same criterion* appeared at the same position across runs (found independently by Blind Hunter and Edge Case Hunter). A malformed `runResults` payload with matching counts but permuted/mismatched criteria at the same index would pass validation and `computeUnstableCriteria` would silently misattribute one criterion's pass/fail to another's label. Fixed: validation now also checks `entry.criterion === referenceCriteria[index]` for every run against the first run's criteria list. Verified live: a mismatched-identity payload is now rejected with `{error}`+500; a consistent payload still succeeds.
- **false, disproved live** — Verification Gap flagged that the stale-prompt guard (`promptSnapshot === evaluatedPrompt`) had no test evidence anywhere in the repo. Closed by direct browser verification during this review: ran a real evaluation, edited the prompt without re-running, clicked "Analyser" with `window.fetch` intercepted — the request body was exactly `{"prompt": "..."}`, no `runResults` key present, confirming the guard works end-to-end, not just in the code's logic.
- **false, disproved live** — Verification Gap also flagged the uneven-run-length rejection as undocumented/untested. Already exercised during implementation (direct `fetch` with mismatched run lengths returned `{error}`+500) — the check exists and works; the gap was in the spec's documentation, not the code.
- **false** — Blind Hunter's claim that `isValidRunResults` wrongly accepts `runResults[0].length === 0` (every run recording zero criteria): checked — `computeUnstableCriteria` correctly returns `[]` for zero criteria (the loop body never executes), which is the trivially correct answer; this shape is also unreachable from the real UI (`canEvaluate` requires `criteriaCount > 0`). No bad outcome.
- **false** — Blind Hunter's claim that returning HTTP 500 for a client validation error is the wrong status code: this is the project's deliberate, pre-existing API contract across all three routes (`{ error }` + HTTP 500 uniformly, per the Architecture Spine's AD-2, documented in `epics.md`), not an oversight introduced by this diff.
- **low, rejected** — Blind Hunter noted a degenerate `- "" : validé X/N fois` message is possible if a crafted payload supplies an empty-string `criterion`. Only reachable via a direct API call bypassing the UI (the client always filters empty criterion lines before sending); cosmetic at worst, not worth the added validation complexity for this POC.
- **low, rejected** — Blind Hunter noted non-ASCII CSS class names (`.status-présent`) in the review mockup HTML. The mockup is a one-off PM-facing decision artifact, not shipped application code; not worth revising.
- **low, rejected** — Blind Hunter noted the anti-injection framing for criterion labels is instructional only (no structural escaping/delimiting). Consistent with this codebase's existing, deliberate posture for the prompt field itself (Story 2.1) and the pre-existing deferred gap on input length caps — extending the same posture to criteria is consistent, not a new weakness introduced by this diff.
- **low, rejected** — Blind Hunter noted the spec's "Tasks & Acceptance" checkboxes were never checked off despite `status: done`. Editing the spec under review to fix its own checklist formatting is out of scope for a code-review finding.

## Verification

**Manual checks (if no CLI):**
- Dev server, browser: run an evaluation with N≥2 and criteria that produce a mixed pass/fail pattern across runs, then click "Analyser" — confirm the analysis text explicitly calls out the unstable criterion/criteria, and that the wording is consistent with what Epic 1's own per-criterion stability panel shows.
- Click "Analyser" with no evaluation ever run — confirm it still works exactly as Story 2.1 (no crash, no mention of missing evaluation data).
- Run an evaluation with N=1, then analyze — confirm no criterion is called unstable.
- Network tab: confirm `runResults` is present in the `/api/analyze` request body only when a completed evaluation exists, and absent otherwise.
- Malformed `runResults` (e.g. via a manual fetch/devtools call) — confirm the route returns `{error}` + HTTP 500 instead of crashing or silently ignoring it.
