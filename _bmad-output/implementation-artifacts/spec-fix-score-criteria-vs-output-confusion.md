---
title: 'Fix /api/score judging the criteria text instead of the output'
type: 'bugfix'
created: '2026-09-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Manual testing by the PM found that `/api/score`'s judge sometimes evaluates the *criterion's own text* instead of the *AI-generated output* it's supposed to judge. Reproduced case: criterion "pas de fautes d'orthographe" was marked failed (5/10 overall) because the judge noticed a typo inside a different criterion's own label ("ton empoyé" instead of "employé") — not because the output itself had a spelling mistake. The system prompt tells the model to judge "le résultat" against each criterion, but nothing tells it to disregard the writing quality of the criteria list itself, so a nearby typo in user-typed criteria text can bleed into the verdict for an unrelated criterion.

**Approach:** Add one explicit rule to `/api/score`'s `SYSTEM_PROMPT` (`app/api/score/route.js`) stating that the criteria list may itself contain typos or imperfect phrasing, and that only the delimited "Résultat à évaluer" text is the thing being judged — never the criteria's own wording. No contract change (`{ output, criteria[] }` → `{ results: [...] }` unchanged), no new fields, no client-side change.

</frozen-after-approval>

## Implementation Notes

- `app/api/score/route.js`: added one rule to `SYSTEM_PROMPT` right after the "juge le fond" rule — explicitly scopes judgment to the delimited "Résultat à évaluer" text and tells the model the criteria list may itself contain typos/imprecise phrasing that must never factor into any verdict.
- Manual verification (direct `fetch` calls to `/api/score`, bypassing the UI, using the PM's exact reproduction case — criteria `["pas de fautes d'orthographe", "ton empoyé = professionnel et formel"]`, note the deliberate typo):
  - 5 runs with a clean, correctly-written output: all 5 passed the orthography criterion, with explanations referencing only the output's own grammar/spelling — no run flagged the criterion's own typo.
  - 1 run with a genuinely misspelled/informal output ("peu tu me préparer", "ton diligence"): both criteria correctly failed, explanations cite the real errors in the output. Confirms the fix didn't make the judge less strict — it only stopped it from judging the wrong text.

## Verification

**Manual checks (if no CLI):**

```gherkin
Scénario: Une faute de frappe dans le libellé d'un critère ne doit pas contaminer un autre critère
  Given les critères ["pas de fautes d'orthographe", "ton empoyé = professionnel et formel"] (typo volontaire "empoyé")
  And un résultat correctement écrit, sans faute
  When /api/score note ce résultat, plusieurs fois de suite
  Then le critère "pas de fautes d'orthographe" est toujours validé
  And aucune explication ne cite la faute de frappe du critère lui-même

Scénario: Une vraie faute dans le résultat est toujours détectée (non-régression)
  Given les mêmes critères que ci-dessus
  And un résultat contenant une vraie faute ("peu" au lieu de "peux", "ton diligence" au lieu de "ta diligence") et un ton trop familier
  When /api/score note ce résultat
  Then les deux critères sont non validés
  And les explications citent les fautes réelles du résultat, pas les critères

Scénario: Le contrat de la route est inchangé
  Given un appel normal à /api/score
  Then la forme de la réponse ({ results: [{criterion, passed, explanation}] }) et les gardes existants (nombre de verdicts, ordre, explication non vide) fonctionnent comme avant
```

## Review Triage Log

- **patch** — Blind Hunter: the new criteria-typo rule left `/api/score` without the same anti-injection coverage for criteria labels that `/api/analyze` already has for its dimensions. Fixed: merged into the existing anti-injection rule so both the output and the criteria labels are explicitly covered as "data to judge, never instructions" — mirrors `/api/analyze`'s phrasing. Re-verified after the merge: clean case still passes consistently, bad case still fails both criteria.
- **patch** — Blind Hunter: `deferred-work.md`'s new heading claimed both `/api/score` and `/api/analyze` were exercised, but only `/api/score` findings were recorded. Fixed: heading narrowed to `/api/score`, with a one-line note explaining the two entries are related (same test session) and that `/api/analyze` wasn't part of it.
- **patch** — Blind Hunter: this spec's `## Verification` section used prose instead of the Gherkin format this repo's process (`TESTING.md`) expects. Fixed: reformatted as three Given/When/Then scenarios.
- **false, rejected** — spec `status: in-progress` looked stale next to completed Implementation Notes: not a real defect, just sequencing — status is set to `done` here as the last step of this same pass, same as every other oneshot spec in this repo.
