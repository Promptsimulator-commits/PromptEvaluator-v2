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
