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
