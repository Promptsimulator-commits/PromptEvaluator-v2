- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-enter-prompt-and-criteria.md`
  summary: Give the user a visible reason when the "Évaluer" button is disabled (which condition — prompt or criteria — is unmet), plus a required-field indicator on both textareas.
  evidence: Currently the button is silently disabled with no hint; a first-time user could be confused about why nothing happens. Real but not blocking — deferred to a later UX pass rather than this story's scope (validation logic only).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-enter-prompt-and-criteria.md`
  summary: Show a live count of recognized (non-blank) criteria lines as the user types.
  evidence: Would confirm the parsing matches user intent (e.g. that a criterion accidentally split across two lines is read as two). Not required by this story's AC; a pedagogical nice-to-have.
  status: RESOLVED (2026-09-04) — added as part of the visual identity redesign of app/page.js (amber count badge next to the criteria label).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-enter-prompt-and-criteria.md`
  summary: Decide whether duplicate criteria lines should be deduplicated or flagged before they reach scoring.
  evidence: Not this story's concern (no scoring exists yet) — relevant once Story 1.4 (scoring) or Story 1.2's own validation is revisited. Duplicates would silently inflate the criteria count used in the score formula.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-enter-prompt-and-criteria.md`
  summary: Decide on a max length / soft guard for the prompt and criteria textareas.
  evidence: Relevant to API cost/size limits (NFR2 budget) once Story 1.3 wires these fields to the Anthropic API — no limit value is defined anywhere yet, so inventing one now would be arbitrary. Revisit when Story 1.3 is planned.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-enter-prompt-and-criteria.md`
  summary: Criteria textarea placeholder shows only one example line; a second example line would make the "one criterion per line" convention less ambiguous for first-time users.
  evidence: Minor copy polish, not a functional gap.
  status: RESOLVED (2026-09-04) — second example line added as part of the visual identity redesign of app/page.js.

## Deferred from: code review of story 1.4 (2026-09-08)

- source_spec: `_bmad-output/planning-artifacts/epics.md` (Story 1.4)
  summary: The `/api/score` guard that rejects a verdict list whose length differs from the criteria count is unreachable by this project's verification method.
  evidence: The project verifies failure paths by intercepting `window.fetch` in the browser (TESTING.md). That intercept sits between the browser and the route, so it cannot make the Anthropic SDK *inside* the route return a malformed tool_use block. Exercising this branch requires stubbing the SDK, which requires a test runner — explicitly ruled out for the 3-day POC (TESTING.md line 3). Revisit at V1. Meanwhile the client-side equality check added by this review is the independent second guard.

- source_spec: `_bmad-output/planning-artifacts/epics.md` (Stories 1.3, 1.4, 1.5)
  summary: No spec artifact was produced for Stories 1.3, 1.4, or 1.5, unlike 1.1 and 1.2.
  evidence: `implementation-artifacts/` holds `spec-1-1-*.md` and `spec-1-2-*.md` only, yet 1.3-1.5 are the technically substantial stories that close epic 1. Their acceptance criteria live only in `epics.md` and their verification record only in the memlog. Not blocking — the work is done and verified — but the epic's paper trail is uneven.

- source_spec: `_bmad-output/planning-artifacts/architecture/architecture-prompt-evaluator-2026-09-04/ARCHITECTURE-SPINE.md`
  summary: The Structural Seed and AD rules still name TypeScript files (`app/api/score/route.ts`, `app/page.tsx`) while the project is plain JavaScript.
  evidence: Pre-existing deviation established in Story 1.1 and applied consistently since — not a Story 1.4 regression. Worth one correction pass over the spine rather than being re-flagged on every future story.

## Deferred from: review of story 2.1 (2026-09-08)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-request-structured-prompt-analysis.md`
  summary: `/api/analyze` has no size/length cap on the `prompt` field before it's sent to the Anthropic call — only emptiness is checked.
  evidence: Same pre-existing gap already logged for `/api/execute`/`/api/score`'s inputs (no max length decided anywhere yet, relevant to NFR2 budget) — but more pointed here since this route's own system prompt calls out that the user prompt is the most exposed, most-likely-adversarial input in the tool. Not blocking for the POC; revisit alongside the existing deferred entry when a length limit is actually decided for the app.

## Deferred from: code review of fix-score-length-precision (2026-09-08)

- source_spec: `_bmad-output/implementation-artifacts/spec-fix-score-length-precision.md`
  summary: `/api/score`'s word-count computation (`output.trim().split(/\s+/)`) is inaccurate for non-whitespace-delimited scripts (e.g. Japanese, Chinese) — it would return something like "1 word" for a full paragraph, and the judge is explicitly told to trust this measured count over its own reading impression.
  evidence: Real and verified — the whitespace-split approach cannot segment words in scripts without spaces. Deferred rather than fixed: confirmed with the user that this tool's users are francophone/anglophone consultants only, so non-whitespace-delimited output is out of scope for this POC. Revisit only if the tool's user base changes.

## Deferred from: UX accessibility review (2026-09-08)

- source_spec: `_bmad-output/planning-artifacts/ux-designs/ux-prompt-evaluator-2026-09-08/DESIGN.md`
  summary: Several existing color tokens fall below WCAG AA contrast thresholds, app-wide (not introduced by the onboarding/copy pass) — accent (`#d99a2b`) text on its own `/15` tint (~2.16:1, needs 4.5:1) used by every count/status chip; plain accent text on white card (~2.44:1) used for the per-criterion stability ratio; the `border` token (`#ecd9b8`) against `background`/`card` (~1.29:1 / ~1.08:1) that is the sole visual edge on textareas and the form card; `foreground/40` (placeholder text, slider min/max labels) at ~2.5:1; the "absent" status pill (`foreground/50` on `foreground/10`) at ~3.19:1.
  evidence: Verified by dedicated accessibility subagent review (WCAG 2.1 AA lens) against the documented hex values and cross-checked against `app/page.js` usage — full detail, exact locations, and suggested token fixes in `_bmad-output/planning-artifacts/ux-designs/ux-prompt-evaluator-2026-09-08/review-accessibility.md` (3 critical, 3 high findings on this topic). Deferred rather than fixed here because the fix changes visual tokens used across the entire app, not just the onboarding screen touched by this pass — needs its own branch/PR and a visual check-in with the PM before landing, per her explicit choice when this was surfaced (2026-09-08).
