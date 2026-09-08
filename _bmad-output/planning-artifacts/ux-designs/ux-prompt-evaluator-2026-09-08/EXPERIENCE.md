---
name: Prompt Evaluator
status: final
sources:
  - '{planning_artifacts}/prds/prd-prompt-evaluator-2026-09-04/prd.md'
  - '{planning_artifacts}/epics.md'
updated: 2026-09-08
---

# Prompt Evaluator — Experience Spine

> Single-surface responsive web app. Next.js App Router + Tailwind CSS v4, no component library, plain `useState` (no persistence, no backend state). Paired with `DESIGN.md`. This spine covers the onboarding/clarity pass added on top of the already-shipped Epic 1 (evaluate) and Epic 2 (analyze) functionality — it does not re-derive decisions already fixed by those epics' specs.

## Foundation

One screen, one `<main>` column, no routing. Two independent-but-related actions live on it: **Évaluer** (run the prompt N times, score it against criteria) and **Analyser** (structural diagnosis of the prompt, enriched with evaluation results when they exist). `DESIGN.md` is the visual identity reference; this spine is the behavior. No accounts, no saved sessions — every visit starts from a blank prompt.

This pass documents the app's actual state at time of writing (copy, help text, and the two components it touched), not a re-derivation of Epic 1/2's own decisions. Deliberately out of scope: the "rewrite → re-evaluate" iteration loop's own copy/state (Flow 2 below narrates it as it already behaves, but no wording changed there this pass), and the color-contrast fixes logged in `deferred-work.md`.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Main screen | App load (only surface) | Enter prompt + criteria, choose run count, trigger Évaluer and/or Analyser, read results |

No navigation exists because no navigation is needed — the screen is form-then-results, read top to bottom.

## Voice and Tone

Microcopy register: professional-casual, addressed to a consultant using a work tool — not playful, not corporate-stiff. Brand aesthetic posture lives in `DESIGN.md`; this table governs word choice.

| Do | Don't |
|---|---|
| "Rédige un prompt…" | "Écris un prompt…" (reads as a school exercise, not a professional task) |
| Say what happens next, concretely: "On l'exécute plusieurs fois pour vérifier sa fiabilité." | Vague reassurance: "L'IA se charge du reste." |
| "0 critère" / "1 critère" / "2 critères" (singular below 2) | "0 critères" (defaults to plural for every count except exactly 1) |
| Plain placeholder text, no trailing "…" | "Saisis le prompt que tu souhaites tester…" (the ellipsis adds nothing the grey placeholder styling doesn't already say) |
| Explain a control's *consequence*, not just its mechanism: "plus il y a d'exécutions, plus la mesure de fiabilité est précise, mais chaque exécution a un coût" | Mechanism-only: "Le prompt sera exécuté N fois" |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Field label | Prompt, Critères, Nombre d'exécutions | Fraunces, same weight/size as before — only the family changed, to visually tie every field to the product's own typographic identity. |
| Inline help text | Below the run-count slider; below the Évaluer/Analyser button row | Always visible, never a tooltip or hover-only affordance — see Accessibility Floor. Explains consequence/trade-off, not just mechanism. Present regardless of state (not dismissible, not first-visit-only — this is not onboarding-then-gone, it's permanent orientation for an infrequently-used tool). |
| Count/ratio chip | Criteria count, run count | Monospace, accent-tinted pill (see `DESIGN.md.Components.chip`). Updates live as the user types/drags — never a static label. |
| Stability ratio | Per criterion, in the evaluation summary | Same monospace/accent treatment as the chip but plain text, no fill (see `DESIGN.md.Components.Chip` note) — repeated once per criterion, so a pill per row would be visually heavier than the summary counts. |
| Évaluer / Analyser buttons | Main action row | Mutually exclusive while either is in flight (`isRunning`/`isAnalyzing`). A two-line caption beneath both states what each one *does* in outcome terms ("mesurer sa fiabilité" vs. "diagnostiquer sa structure") — added because the two pills were visually equal with no cue for a first-time user on which to click first. |
| Status pill (analysis dimensions) | One per dimension (persona/objectif/contraintes/exemples), in the analysis result | Static once the analysis call returns — doesn't update live. Re-running "Analyser" on an edited prompt replaces the whole set at once (no per-pill transition); the existing `analyzedPrompt`/staleness hint (see State Patterns) is what tells the user the pills may be out of date, not the pills themselves. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Empty criteria (0) | Criteria field header | Chip reads "0 critère" (singular) — see Voice and Tone. "Évaluer" stays disabled until ≥1 non-empty criterion line exists. |
| Slider at N=1 | Below slider | Explicit consequence message: "tu verras un résultat, mais pas la stabilité du prompt" — not silence, since N=1 changes what the tool can tell the user. |
| Slider at N>1 | Below slider | Consequence message states the trade-off (precision vs. cost) every time, not just on first interaction. |
| Neither action clickable yet | Évaluer/Analyser row | Both buttons visibly disabled (existing pattern, unchanged); the new caption beneath still explains what each *would* do once enabled, so a user filling the form for the first time already knows what to expect. |
| Evaluation in progress | Below the button row | `aria-live="polite"` progress text ("exécution 2/5", then "notation 1/5"), inherited from Epic 1, unchanged by this pass. |
| Analysis in progress | Below the button row | `aria-live="polite"` "analyse en cours…", inherited from Epic 2, unchanged by this pass. |
| Evaluation or analysis failed | Below the form card | `role="alert"` panel with a specific error message (which call failed, at which step); inherited from Epic 1/2's abandon-on-error behavior, unchanged by this pass. |
| Analysis shown but prompt edited since | Above the analysis result | "Prompt modifié depuis cette analyse" hint — the analysis stays visible (not cleared) but is flagged as possibly stale; inherited from Story 2.1, directly relevant to this pass's Analyser-clarity work even though its copy wasn't changed here. |

## Interaction Primitives

No custom keyboard shortcuts or accelerator keys — not this tool's audience (an occasional-use tool, not a power-user daily driver). This is a baseline, not a decision point: all native controls (textareas, the run-count slider, both buttons) remain fully keyboard-operable via their default browser behavior (tab, arrow keys, enter/space), same as always. Hover is never load-bearing: every explanation that matters is always-visible text, not a hover reveal, so the same experience holds on desktop, tablet, and touch.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` — **known gaps there, logged in `deferred-work.md`, not fixed by this pass** (several existing color tokens fail WCAG AA; see `DESIGN.md.Colors` "Known contrast gaps").

- **No information is hover-only.** This was an explicit trade made during this pass: a tooltip was considered for the run-count slider and rejected, because hover doesn't fire on touch devices and isn't discoverable without a hint — critical explanations stay always-visible text instead.
- `aria-live="polite"` regions already cover in-flight status ("exécution 2/5", "analyse en cours…") — unchanged by this pass, called out here so future additions follow the same pattern rather than introducing toasts or silent state changes.
- Disabled controls use both a visual state and the native `disabled` attribute (existing pattern) — screen readers and pointer users get the same signal.
- Error and analysis-error messages use `role="alert"` so they're announced immediately without depending on focus — unchanged by this pass, called out so future error states follow the same pattern instead of a passive `aria-live` region (which wouldn't interrupt).
- Status/result indicators (analysis pills, pass/fail marks) always pair color with a text label — never color alone, per WCAG 1.4.1. The analysis pills show a text label (Absent/À clarifier/Clair) alongside their tint; the pass/fail marks pair an `aria-hidden` icon with `sr-only` "Validé :"/"Non validé :" text.
- All interactive elements (buttons, slider, textareas) must show a visible focus indicator at all times — never `outline: none` without a replacement that meets 3:1 against every adjacent background. Textareas already have a custom focus ring; buttons and the slider currently rely on the browser default, which is acceptable as long as it isn't suppressed.
- The run-count slider's accessible name and value announcement come from its associated `<label>` and native browser behavior — this is load-bearing, intentional behavior, not incidental; a future custom-styled slider must preserve both explicitly. The per-criterion stability progress bar is intentionally hidden from assistive tech (`aria-hidden`) because the adjacent text already states the ratio in words.

## Key Flows

### Flow 1 — First-time use (Camille, consultant, testing a client-email prompt before a workshop)

1. Camille opens the app. The header reads "Prompt Evaluator" (large) / "TESTE TON PROMPT" (small, bold) — she immediately knows what tool this is, then what it's for.
2. She reads the one-line subtitle: "Rédige un prompt et les critères qu'un bon résultat doit respecter. On l'exécute plusieurs fois pour vérifier sa fiabilité." — she now knows the mechanism (multiple runs) before touching anything.
3. She pastes her prompt, then types criteria one per line — the "0 critère" chip counts up as she types, confirming each line registered.
4. She reaches the run-count slider, unsure what it does. The always-visible help text tells her the trade-off ("plus il y a d'exécutions, plus la mesure de fiabilité est précise, mais chaque exécution a un coût — 5 est un bon compromis") — she leaves it at the default 5, informed rather than guessing.
5. She sees two pills, "Évaluer" and "Analyser," and hesitates — which one? The caption beneath tells her directly: one measures reliability, one diagnoses structure. She picks "Évaluer" first, since she wants a score.
6. **Climax:** Results arrive progressively; she sees one criterion is unstable (3/5). She clicks "Analyser" next — the analysis explicitly names that same unstable criterion in its explanation, confirming the two features agree with each other. She now understands *why* her prompt is unreliable, not just *that* it is.

Failure: if she clicks "Analyser" first (no evaluation yet), it still works — the diagnosis just doesn't mention stability, with no error and no dead end.

### Flow 2 — Rewrite and re-evaluate (Camille, continuing right after Flow 1)

This is the PRD's stated core learning loop (UJ-1: évaluer → analyser → réécrire → réévaluer) — narrated here as the app already behaves; no copy or state changed for this flow in this pass.

1. Following the analysis's advice, Camille edits her prompt directly in the "Prompt à évaluer" field to fix the unstable criterion.
2. The moment she types, the still-visible analysis panel gains the "Prompt modifié depuis cette analyse" hint (existing `isAnalysisStale` state) — it doesn't disappear, so she can still compare old advice against her edit.
3. She clicks "Évaluer" again. A fresh run starts; the previous run's results are cleared the moment the new one begins (existing pattern — no partial/mixed state ever shown).
4. **Climax:** The new summary shows the previously-unstable criterion now validated 5/5. She clicks "Analyser" once more on the updated prompt — the enrichment now reflects the new run, and the stale-analysis hint is gone because `analyzedPrompt` matches the current text again. The loop closes: she can see, in one screen, that her edit fixed the exact problem the tool told her about.

Failure: if she edits the prompt but doesn't re-run before analyzing, the analysis call still uses only the current prompt text — the enrichment guard (Story 2.2) never attaches results from the old, now-mismatched evaluation to the new text.
