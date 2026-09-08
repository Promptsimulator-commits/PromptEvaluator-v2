---
title: 'Give /api/score objective word/character counts for length-type criteria'
type: 'bugfix'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When an acceptance criterion states a length constraint in the prompt (e.g. "rédige en 3 pages", "moins de 100 mots"), `/api/score` currently judges it the same way it judges any qualitative criterion: by reading the output and forming an impression. LLMs are unreliable at eyeballing length, so a criterion like "3 pages" can be marked passed when the actual output is much longer — the measurement, not just the tested prompt's execution, is imprecise. Confirmed decision (with the user): fix the judge's precision, not the tested AI's compliance — the tool's job is to honestly reveal that prompts like "3 pages" are unreliable, not to mask that by forcing the tested AI to comply.

**Approach:** In `/api/score`, compute an objective word count and character count of `output` server-side (deterministic, not LLM-derived) and include them as a labeled fact in the message sent to the judge, for every request (no attempt to detect which criteria are "about length" — that stays the judge's job). Add one rule to `SYSTEM_PROMPT` telling the judge to use this measured count — not its reading impression — whenever a criterion mentions a length or format constraint (words, characters, lines, pages, paragraphs, sentences), and to apply its own reasonable general knowledge to relate the count to units like "pages" (no hardcoded page-to-word ratio invented by us — that would be arbitrary and could be wrong for the user's actual context).

## Boundaries & Constraints

**Always:** Counts are computed in code from the exact `output` string already received (no new input, no new API call). The existing `{error}` + HTTP 500 shape, tool-forced response, and per-criterion verdict/order/explanation guards are unchanged. The fact is given to the judge for every request, unconditionally — no per-criterion detection logic.

**Never:** Do not change `/api/execute` or how the tested AI generates its output. Do not hardcode a page-to-word or page-to-character conversion ratio. Do not attempt to parse or classify criteria text to decide which ones "need" the count.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Length constraint violated | Output far longer than the criterion's stated limit (e.g. criterion "moins de 100 mots", output ~400 mots) | Criterion marked not passed, explanation cites the measured count | N/A |
| Length constraint respected | Output within the stated limit | Criterion marked passed, explanation may cite the measured count | N/A |
| Vague unit ("pages") | Criterion says "3 pages", no hardcoded ratio exists | Judge reasons from the raw word count using its own general knowledge of typical page length | N/A |
| Non-length criterion present alongside a length one | e.g. "Le ton est professionnel" + "moins de 5 lignes" in the same request | Non-length criterion judged as before (regression check) — count fact present but irrelevant to it | N/A |
| No length-type criterion at all | All criteria are purely qualitative | Count fact still included in the message but the judge should not reference it in explanations | N/A |
| Very short output | Output is a single word/sentence, criterion has a lower bound ("plus de 50 mots") | Correctly marked not passed | N/A |
| Multiple length criteria at once | e.g. "moins de 5 lignes" and "plus de 50 mots" together | Both judged consistently against the same measured counts | N/A |
| Output with markdown/lists/extra whitespace | Output contains headings, bullet lists, blank lines | Word count via whitespace-splitting stays a reasonable approximation, no crash | N/A |

</frozen-after-approval>

## Code Map

- `app/api/score/route.js` — add word/character count computation right after the existing `output` validation; extend `userMessage` with a labeled "Longueur mesurée" line; add one rule to `SYSTEM_PROMPT`. No other file changes needed (scoring is the only consumer of `output`'s exact text at judgment time).

## Tasks & Acceptance

**Execution:**
- [ ] `app/api/score/route.js` -- compute `wordCount`/`charCount` from `output` and append a labeled fact to `userMessage` -- gives the judge a hard number instead of an impression
- [ ] `app/api/score/route.js` -- add a `SYSTEM_PROMPT` rule instructing the judge to use the measured count for any length/format-related criterion, reasoning about units like "pages" itself rather than us hardcoding a ratio

**Acceptance Criteria:**
- Given a criterion stating a word/line/page limit and an output that clearly violates it, when `/api/score` judges it, then the criterion is marked not passed and the explanation is consistent with the measured count.
- Given a criterion with no length aspect, when `/api/score` judges it, then its verdict is unaffected by the new count fact (no regression on Epic 1's existing scoring behavior).

## Implementation Notes

- `app/api/score/route.js`: computed `wordCount` (whitespace-split, filtered) and `charCount` (raw length) from `output`, right after the existing emptiness check. Added a labeled `Longueur mesurée du résultat ci-dessus : X mots, Y caractères.` line to `userMessage`. Added one `SYSTEM_PROMPT` rule telling the judge to use this measured count for any length/format-type criterion, and to apply its own general knowledge (not a ratio we invented) when the unit isn't a direct word/character count (e.g. "pages").
- No other files touched — `/api/execute` and `app/page.js` are unchanged, confirming the fix stays scoped to judgment precision, not generation behavior.
- Manual verification, called directly against a running dev server (`/api/score`, no UI needed for the synthetic boundary tests):
  - **Exact boundary from the user's own example**: 1000-word output vs. "1000 mots maximum" → `passed: true`, explanation "contient exactement 1000 mots". 1001-word output, same criterion → `passed: false`, explanation "contient 1001 mots, ce qui dépasse la limite". Matches the requested behavior exactly (1000 OK, 1001 KO).
  - **Vague unit ("pages")**: 900-word and 6000-word outputs against "environ 3 pages, pas plus" — both correctly failed, judge reasoning from its own general knowledge (~250–500 words/page depending on the call) rather than a ratio we hardcoded.
  - **Multiple length criteria at once**: 30-word output against "moins de 50 mots" (passed) and "plus de 100 mots" (failed) in the same request — both judged independently and correctly from the same measured count.
  - **Non-length criterion regression check**: a rude/informal output against "le ton est professionnel et poli" → still correctly failed on tonal grounds, unaffected by the new count fact.
  - **End-to-end, real generation** (not synthetic): prompt "Rédige une synthèse... 1000 mots maximum" + matching criterion, run through the actual UI with a real `/api/execute` call. Real output measured 840 words; `/api/score` correctly passed the criterion citing "contient 840 mots, ce qui est inférieur à la limite de 1000 mots imposée" — confirms the fix holds against real (not fabricated) model output, not just crafted test strings.
- Did not re-run the network-failure/500/malformed-response scenarios from Story 1.4, per the spec's own Verification note — this change touches none of that code (only adds two computed numbers and one message line before the existing call).

## Verification

**Manual checks (per TESTING.md, in the browser, dev server):**
- Reproduce the reported bug scenario (prompt instructs a length, matching criterion) before and after the fix, on real Anthropic calls (no fetch interception needed — this is a judgment-quality fix, not an error-path fix).
- Confirm existing non-length criteria (from Epic 1's own manual test scenarios) still score correctly — no regression.
- Confirm `{error}` + 500 shape, verdict count/order/explanation guards are all untouched (existing failure-path tests from Story 1.4 still apply; no need to re-run the network-failure/malformed-response scenarios since this change doesn't touch those code paths).
