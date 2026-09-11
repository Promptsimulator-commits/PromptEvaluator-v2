---
name: Prompt Evaluator
status: final
sources:
  - '{planning_artifacts}/prds/prd-prompt-evaluator-2026-09-04/prd-v2.md' # stale — see note below
  - '{planning_artifacts}/epics-v2.md' # stale — see note below
  - '{planning_artifacts}/points-a-revoir-avec-sally.md'
  - '{planning_artifacts}/spec-4-dimensions-prompt-evaluator-seed.md'
updated: 2026-09-11
---

# Prompt Evaluator — Experience Spine

> Single-surface responsive web app. Next.js App Router + Tailwind CSS v4, no component library, plain `useState` (no persistence, no backend state). Paired with `DESIGN.md`.
>
> **Source note (2026-09-11):** `prd-v2.md`/`epics-v2.md` still describe the pre-pivot mechanic (manual acceptance criteria, 4 dimensions incl. Persona/Exemples) — they carry the `-v2` filename suffix but their content has not yet been updated to match the decisions below. This spine follows the actually-current decisions, sourced from `points-a-revoir-avec-sally.md` and the implementation-artifacts session log dated 2026-09-11, not from the stale PRD/epics. PRD/epics/architecture will need their own update pass to catch up — out of scope for this UX update.

## Foundation

One screen, one `<main>` column, no routing. **A single business action, "Envoyer,"** runs the whole flow: extract criteria from the prompt → user reviews/edits the extracted list → confirm → generate N responses → score the prompt on 3 dimensions (Objectif, Contexte, Contraintes) — a textual reading of the prompt, corrected by how much the generated responses diverge from each other. There is no more separate "Analyser" action that re-runs a diagnosis independently; the two features from the prior mechanic (run + diagnose) are one continuous flow now, not two entry points a first-time user had to choose between.

Once results exist, a **view toggle** ("Voir l'analyse" / "Voir les réponses") switches, at no extra cost (no new API call, pure display state), between the "Réponses générées" view and the "Analyse par dimensions" view — this keeps the results screen short at any given moment without reintroducing a second business action. `DESIGN.md` is the visual identity reference; this spine is the behavior. No accounts, no saved sessions — every visit starts from a blank prompt.

There are no more manually-typed acceptance criteria. Instead, 3 fixed criteria (spelling/grammar, internal coherence, same language as the prompt) are always applied but **never shown anywhere in the UI** — they run silently in the background. Only prompt-extracted criteria are ever shown to the user, in a single editable list (no visual "fixed vs. editable" grouping — an earlier version of this decision considered showing the fixed criteria as a separate locked group, but this session doesn't put them on screen at all; see `.memlog.md`). If a generated response fails one of the fixed criteria, that failure surfaces only inside the Contraintes dimension's pedagogical explanation (see Component Patterns), never as its own line item.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Main screen — prompt entry | App load (only surface) | Enter prompt, click "Envoyer" |
| Main screen — criteria review (inline, same surface) | After "Envoyer," extraction completes | Review/edit/remove extracted criteria, confirm or cancel |
| Main screen — results, "Réponses" view (default after generation) | After "Confirmer et lancer" | Read the N generated responses |
| Main screen — results, "Analyse" view | Toggle from "Réponses" view | Read the 3 dimension scores, expand any for detail |

Still no navigation and no routing — every "surface" above is the same `<main>` column reshaping itself in place (the criteria list opens inline below the prompt card; the results area swaps its content on toggle), read top to bottom at each step.

## Voice and Tone

Microcopy register: professional-casual, addressed to a consultant using a work tool — not playful, not corporate-stiff. Brand aesthetic posture lives in `DESIGN.md`; this table governs word choice.

| Do | Don't |
|---|---|
| "Rédige un prompt…" | "Écris un prompt…" (reads as a school exercise, not a professional task) |
| Say what happens next, concretely: "On extrait les critères de ton prompt, puis on l'exécute plusieurs fois pour vérifier sa fiabilité." | Vague reassurance: "L'IA se charge du reste." |
| "0 critère" / "1 critère" / "2 critères" (singular below 2) | "0 critères" (defaults to plural for every count except exactly 1) |
| Plain placeholder text, no trailing "…" | "Saisis le prompt que tu souhaites tester…" (the ellipsis adds nothing the grey placeholder styling doesn't already say) |
| Explain a control's *consequence*, not just its mechanism: "plus il y a d'exécutions, plus la mesure de fiabilité est précise, mais chaque exécution a un coût" | Mechanism-only: "Le prompt sera exécuté N fois" |
| Name what actually varied when a dimension's note was corrected: "2 réponses sur 5 dépassaient la longueur demandée" | Vague: "les réponses variaient trop" |
| Frame the extracted-criteria list as a checkpoint, not a form to fill in: "Voici ce qu'on a repéré dans ton prompt — ajuste si besoin." | Implying the user must write criteria from scratch (that's the old mechanic) |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Field label | Prompt à évaluer | Fraunces (`{typography.display-label}`) — unchanged from the prior pass. |
| Inline help text | Below the run-count slider; below the "Envoyer" button | Always visible, never a tooltip or hover-only affordance — see Accessibility Floor. Explains consequence/trade-off, not just mechanism. Present regardless of state. |
| "Envoyer" button | Prompt card, single business action | Disabled until the prompt field is non-empty. On click: runs extraction (loading state), then opens the criteria list inline below the prompt — does not yet generate anything. |
| Criteria list (extracted, editable) | Opens inline below the prompt card after "Envoyer" | Single list, no visual grouping — the 3 fixed criteria never appear here (see Foundation). Each extracted line is editable in place and removable; an "add a criterion" affordance lets the user add one the extraction missed. Count/ratio chip (see below) reflects this list's length live as it's edited. Mock: [mockups/criteria-validation-panel.html](mockups/criteria-validation-panel.html). |
| "Confirmer et lancer" button | Bottom of the criteria list | Outlined secondary style (see `DESIGN.md.Components`). Starts generation (N responses) using the (possibly edited) criteria list. Disabled if the list is empty. |
| "Annuler" button | Beside "Confirmer et lancer" | Ghost/text style, quietest control on the row. Closes the criteria list and returns to the plain prompt-entry state — the prompt text itself is untouched, so the user can edit it before trying "Envoyer" again. |
| Count/ratio chip | Criteria count (extracted list), run count | Monospace, accent-tinted pill (see `DESIGN.md.Components.chip`). Updates live as the user edits the list. |
| View toggle ("Voir l'analyse" / "Voir les réponses") | Appears once results exist | Pure display switch, not a new API call (see `DESIGN.md.Components`). Only the label for the *inactive* view is shown, since it reads as "go there," not "you are here." Default view after generation completes is "Réponses générées." |
| Dimension card (Objectif / Contexte / Contraintes) | "Analyse par dimensions" view, one row of 3 (`sm:grid-cols-3`) | Collapsed by default, all three treated identically (no dimension is visually promoted as "the weak one" — see `.memlog.md` decision on Point 1). Shows the note (0-10) and the palier label (`DESIGN.md.Components` status pill) when collapsed. Click anywhere on the card to expand/collapse (`aria-expanded`, see Accessibility Floor). |
| Dimension detail (expanded) | Inside an expanded dimension card | Shows: the anchor text for the note obtained, what was done well, what could be clearer, a concrete before/after rewrite suggestion — and, **only if a behavioral correction was actually applied**, a sentence naming concretely what varied across the generated responses (e.g. "2 réponses sur 5 dépassaient la longueur demandée"), never a raw "-2 points" or an algorithm dump. If the run had N=1, no correction section renders at all — the note is the textual reading alone, with the existing N=1 explanatory message (inherited from the prior mechanic). Mock: [mockups/results-analyse-view.html](mockups/results-analyse-view.html). |
| Generated responses list | "Réponses générées" view | Plain list of the N generated texts, read-only — no per-response score, no per-response conformity table (individual responses are never scored; they only feed the divergence signal — see `.memlog.md` Point 6 context and the session log's §6.1 decision). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Extraction in progress | Below the prompt card, after clicking "Envoyer" | `aria-live="polite"` progress text ("extraction des critères…"). |
| Criteria list empty after extraction | Criteria list | Chip reads "0 critère" (singular) — see Voice and Tone. "Confirmer et lancer" stays disabled until ≥1 non-empty criterion line exists (mirrors the old ≥1-criterion rule, now applied to the extracted+edited list instead of a manually-typed one). |
| Slider at N=1 | Below slider | Explicit consequence message: "tu verras un résultat, mais pas la stabilité du prompt" — not silence, since N=1 changes what the tool can tell the user, and suppresses the behavioral-correction section entirely (see Component Patterns). |
| Slider at N>1 | Below slider | Consequence message states the trade-off (precision vs. cost) every time, not just on first interaction. |
| "Envoyer" not yet clickable | Prompt card | Button visibly disabled (existing pattern) until the prompt field is non-empty. |
| Generation in progress | Below the criteria list, after "Confirmer et lancer" | `aria-live="polite"` progress text ("exécution 2/5", then "notation des dimensions…"), inherited pattern from the prior mechanic's evaluation flow. |
| Generation failed | Below the form card | `role="alert"` panel with a specific error message (which call failed, at which step) — inherited abandon-on-error behavior. |
| Results ready | Results area | Defaults to "Réponses générées" view; the "Voir l'analyse" toggle appears alongside. |
| Dimension card collapsed / expanded | Analyse view | `aria-expanded` reflects state; collapsing one card never affects the others (independent, no accordion-exclusivity). |
| Prompt edited after results exist | Above the results area | "Prompt modifié depuis ces résultats" hint — results stay visible (not cleared) but flagged as possibly stale, since a fresh "Envoyer" is needed to re-extract and re-score against the edited text (adapts the prior `isAnalysisStale` pattern to the merged single-flow mechanic). |

## Interaction Primitives

No custom keyboard shortcuts or accelerator keys — not this tool's audience (an occasional-use tool, not a power-user daily driver). This is a baseline, not a decision point: all native controls (textareas, the run-count slider, all buttons) remain fully keyboard-operable via their default browser behavior (tab, arrow keys, enter/space), same as always. Hover is never load-bearing: every explanation that matters is always-visible text, not a hover reveal, so the same experience holds on desktop, tablet, and touch.

The dimension cards' expand/collapse and the Réponses/Analyse view toggle are both pure client-side UI state — no loading state, no `aria-live` announcement needed beyond the state change itself, since nothing is being fetched.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` — **known gaps there, logged in `deferred-work.md`, not fixed by this pass** (several existing color tokens fail WCAG AA; see `DESIGN.md.Colors` "Known contrast gaps").

- **No information is hover-only.** A tooltip was considered for the run-count slider and rejected, because hover doesn't fire on touch devices and isn't discoverable without a hint — critical explanations stay always-visible text instead.
- `aria-live="polite"` regions cover in-flight status ("extraction des critères…", "exécution 2/5", "notation des dimensions…") — future additions should follow the same pattern rather than introducing toasts or silent state changes.
- Disabled controls use both a visual state and the native `disabled` attribute — screen readers and pointer users get the same signal.
- Error messages use `role="alert"` so they're announced immediately without depending on focus.
- Status/result indicators (dimension status pills) always pair color with a text label — never color alone, per WCAG 1.4.1. Each dimension pill shows a text label (Absent/À clarifier/Clair/Très clair) alongside its tint.
- All interactive elements (buttons, slider, textareas, dimension cards, view toggle) must show a visible focus indicator at all times — never `outline: none` without a replacement that meets 3:1 against every adjacent background.
- The run-count slider's accessible name and value announcement come from its associated `<label>` and native browser behavior — load-bearing, not incidental; a future custom-styled slider must preserve both explicitly.
- **Dimension cards** use `aria-expanded` on the clickable card header and associate the detail panel via `aria-controls`, so the expand/collapse state is announced to assistive tech, not just shown visually.
- **The view toggle** ("Voir l'analyse" / "Voir les réponses") is a native `<button>` with a clear accessible name naming the destination view, not an icon-only control — screen reader users get the same "go there" cue as sighted users reading the label.
- **The criteria list's add/remove controls** are keyboard-operable native buttons (not click-only custom elements), and removing a line moves focus predictably to an adjacent control rather than dropping it.

## Key Flows

### Flow 1 — First-time use (Camille, consultant, testing a client-email prompt before a workshop)

1. Camille opens the app. The header reads "Prompt Evaluator" (large) / "TESTE TON PROMPT" (small, bold) — she immediately knows what tool this is, then what it's for.
2. She reads the one-line subtitle, now explaining the actual mechanism: "Rédige un prompt. On en extrait les critères à vérifier, on l'exécute plusieurs fois, et on te dit ce qui est clair ou à améliorer." — no mention of typing criteria herself, since that step no longer exists.
3. She pastes her prompt and clicks the single button, "Envoyer." No hesitation about which of two buttons to click — there's only one.
4. Extraction runs briefly (`aria-live` "extraction des critères…"), then a list opens inline below the prompt: 3 criteria the tool found in her text (e.g. "moins de 160 caractères," "ton professionnel"). She reads them, fixes one that's slightly off, and leaves the rest.
5. She reaches the run-count slider, unsure what it does. The always-visible help text tells her the trade-off ("plus il y a d'exécutions, plus la mesure de fiabilité est précise, mais chaque exécution a un coût — 5 est un bon compromis") — she leaves it at the default 5.
6. She clicks "Confirmer et lancer." Generation runs progressively ("exécution 2/5"…), then scoring.
7. Results land on the "Réponses générées" view by default — she skims the 5 generated texts.
8. **Climax:** She clicks "Voir l'analyse." Three cards appear side by side — Objectif, Contexte, Contraintes — each a note and a palier label, all collapsed, none singled out. She clicks on Contraintes (6/10, "Clair") out of curiosity. It expands: the textual reading explains her prompt states a length limit but not a tone, *and* names a concrete correction — "2 réponses sur 5 dépassaient la longueur demandée," which is why the note isn't higher — alongside a rewritten version of that part of her prompt. She now understands not just the score, but *why* it moved.

Failure: if she clicks "Annuler" at step 4 instead of confirming, the criteria list closes and she's back at the plain prompt field, free to edit the prompt itself before trying "Envoyer" again — no dead end, no error.

### Flow 2 — Rewrite and re-send (Camille, continuing right after Flow 1)

This is the tool's core learning loop (rédiger → envoyer → comprendre → réécrire → renvoyer), now collapsed into repeated uses of the single "Envoyer" flow rather than an évaluer/analyser back-and-forth.

1. Following the Contraintes card's advice, Camille edits her prompt directly to add the missing tone constraint.
2. The moment she types, the still-visible results area gains the "Prompt modifié depuis ces résultats" hint — results don't disappear, so she can still compare the old advice against her edit.
3. She clicks "Envoyer" again. Extraction re-runs on the edited text (the criteria list may now include a new "ton professionnel" line it didn't extract before); she confirms it, then generation runs fresh — the previous run's results are cleared the moment the new one begins.
4. **Climax:** The new Contraintes card shows 9/10, "Très clair," no correction section this time (the responses no longer diverge on length or tone). The loop closes: in one flow, she can see that her edit fixed the exact gap the tool named.

Failure: if she edits the prompt but never clicks "Envoyer" again, the stale results stay visible with their "Prompt modifié" hint — nothing silently re-scores an unconfirmed edit.
