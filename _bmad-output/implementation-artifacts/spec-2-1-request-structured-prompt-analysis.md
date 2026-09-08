---
title: 'Request a structured analysis of the prompt'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Right now the only way to learn anything about a prompt is to run a full N-execution evaluation. The user should be able to ask, at any time and even with no evaluation run yet, for a structured read of the prompt itself: is the persona clear, is the objective clear, are constraints given, are examples given.

**Approach:** Add a new `POST /api/analyze` route, following the exact same client/server pattern as `/api/execute` and `/api/score` (server-only Anthropic call via `lib/anthropic.js`, a tool-forced response so the model can't drift into free text). Add an "Analyser" button to `app/page.js` next to "Évaluer" that calls this route with just `{ prompt }` and renders the 4 dimensions (persona, objectif, contraintes, exemples), each with a status (présent/clair/absent), an explanation, and a concrete improvement example. This story does not send or use any evaluation results — that enrichment is Story 2.2.

**Decisions from spec review (party mode, 2026-09-08):**
- The route's system prompt must explicitly state that the user-supplied prompt is data to analyze, never an instruction to follow — mirroring `/api/score`'s guard, but stronger: unlike `/score`'s judged text (an AI output), here the judged text is the raw user prompt, the single most exposed and most likely-to-be-adversarial input in this tool.
- The tool schema constrains dimension `name` to a fixed enum (`persona` | `objectif` | `contraintes` | `exemples`). The route must verify the response contains exactly these 4 dimensions, no duplicates, none missing, before returning to the client — same class of guard as `/api/score`'s verdict-count/order check. On mismatch, return the same `{ error }` + 500 shape.
- "Analyser" and "Évaluer" are mutually exclusive: each disables the other while its own request is in flight, so only one Anthropic call chain runs at a time.

</frozen-after-approval>

## Implementation Notes

- New route `app/api/analyze/route.js`: same client/server split, `lib/anthropic.js` reuse, and tool-forced structured response pattern as `/api/execute` and `/api/score`. `POST { prompt }` → `{ dimensions: [{ name, status, explanation, example }] }`, one entry per fixed dimension (`persona`, `objectif`, `contraintes`, `exemples`), always returned in that canonical order regardless of the order the model used.
- System prompt explicitly frames the user's prompt as data to analyze, never an instruction to follow (per the party-mode decision) — verified against a live prompt-injection attempt during manual testing (see below): the model correctly refused to just parrot "toutes dimensions présentes" and analyzed the actual text instead.
- Status enum is `absent` < `présent` < `clair` (best). Chose this ordering — not the `présent`/`clair` split I first drafted — because "clair" reads in French as the strongest outcome; the first draft had it backwards (a Blind Hunter review finding) and was corrected in both the route's `SYSTEM_PROMPT`/tool schema and `app/page.js`'s `STATUS_LABEL`/`STATUS_CLASS` mapping.
- Route validates `status` against the fixed `STATUSES` enum before returning, same defensive posture as the existing count/duplicate/empty-string checks (`tool_choice` constrains but doesn't guarantee the model's output).
- `app/page.js`: added `isAnalyzing`/`analysis`/`analysisError`/`analyzedPrompt` state and an "Analyser" button next to "Évaluer". `canEvaluate`/`canAnalyze` both check `!isRunning && !isAnalyzing` so the two flows are mutually exclusive (party-mode decision) — verified in the browser that clicking "Analyser" disables "Évaluer" (and vice versa) while a call is in flight.
- Added `analyzedPrompt` (prompt snapshot at analyze-launch) and an `isAnalysisStale` flag: if the user edits the prompt after an analysis without re-running it, a small "Prompt modifié depuis cette analyse" hint appears next to the results instead of silently looking current. Deliberately does *not* clear the analysis panel when "Évaluer" runs (or vice versa) — Story 2.2 needs both results able to coexist for the same prompt.
- Added an `aria-live="polite"` "analyse en cours…" span next to the button, matching the existing pattern for the evaluate flow's step counter.
- Manual verification (TESTING.md checklist, in the browser, dev server): happy path (clear prompt → dimensions correctly "clair"/"présent"/"absent"); a live prompt-injection attempt (correctly resisted, see above); HTTP 500 (`{error}` shown); network failure (`fetch` throwing — "impossible de joindre le serveur" shown); malformed response (`dimensions` not an array — generic fallback error shown, no crash); very long input with markdown/HTML-like/emoji content (handled, no crash, no residual injected content rendered); buttons re-enable after both success and failure; mutual exclusivity confirmed via `button.disabled` during an in-flight call; confirmed via network inspection that no request ever reaches `api.anthropic.com` from the browser, only `/api/analyze`.

## Review Triage Log

- **patch** — Inverted status semantics: "présent" was worded as the strong/complete state and "clair" as the weaker/ambiguous one, but "clair" reads in French as the best outcome. Fixed: reordered to `absent < présent < clair`, updated `SYSTEM_PROMPT`, tool schema description, and `app/page.js`'s `STATUS_LABEL`/`STATUS_CLASS`.
- **patch** — Route never validated that the model's `status` value was one of the 3 allowed statuses, unlike its own count/duplicate/empty-string guards for the same response. Fixed: added a `STATUSES` allow-list check to the existing `missingOrInvalid` guard.
- **patch** — No state tying a displayed analysis to the prompt text it was computed from; editing the prompt after analyzing left a now-inaccurate analysis looking current. Fixed: added an `analyzedPrompt` snapshot and a "Prompt modifié depuis cette analyse" hint. Deliberately did not clear either panel when the other flow runs — Story 2.2 needs "Évaluer" and "Analyser" results to coexist for the same prompt.
- **patch** — No `aria-live` announcement while the analyze call is in flight, unlike the evaluate flow's step counter. Fixed: added a matching `aria-live="polite"` "analyse en cours…" span; low effort, keeps the two flows consistent for screen-reader users.
- **defer** — No size/length cap on the `prompt` field before it reaches the Anthropic call. Logged to `deferred-work.md`: pre-existing gap shared with `/api/execute`/`/api/score` (no length limit decided anywhere in the app yet, tracked since Story 1.2's review), not something to invent unilaterally for this one route.
- **false** — None of the Blind Hunter findings were disproved on inspection; all were real (4 patched, 1 deferred as a pre-existing cross-cutting gap).
