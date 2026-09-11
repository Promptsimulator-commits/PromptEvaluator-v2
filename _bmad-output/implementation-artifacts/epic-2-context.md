# Epic 2 Context: Noter le prompt sur 3 dimensions avec correction comportementale

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Once Epic 1 has generated and silently scored N responses, the prompt itself is rated on three dimensions — Objectif, Contexte, Contraintes — so the user understands where their prompt is clear or needs work, without triggering any separate action. Each dimension starts from a textual reading of the prompt alone, then that starting note is corrected downward if the N generated responses diverge from each other on that dimension's axis (a divergence the text looked fine but the model actually found ambiguous). Every dimension gets an expandable, non-judgmental pedagogical explanation — what's working, what to clarify, a concrete rewrite, and, only when a correction was applied, a plain-language sentence naming what actually varied across responses. This is the tool's core teaching moment: it turns a score into an explanation the user can act on next time they write a prompt, not just this one.

## Stories

- Story 2.1: Calculer et afficher la note par dimension à partir du signal textuel
- Story 2.2: Appliquer la correction comportementale à la note
- Story 2.3: Afficher le détail pédagogique dépliable par dimension
- Story 2.4: Basculer entre la vue Réponses et la vue Analyse

## Requirements & Constraints

- Each dimension (Objectif, Contexte, Contraintes) is rated 0-10 with a 4-tier label: 0 = Absent, 1-5 = À clarifier, 6-8 = Clair, 9-10 = Très clair.
- The starting note is a textual-only reading of the prompt. It is then corrected by observed divergence between the N generated responses on that dimension's axis, in 3 levels: low = -0, moderate = -2, high = -4. Correction is applied before the note is translated into its tier label.
- At N = 1 no comparison is possible: the note is the textual signal alone, no correction applies, and the user sees an explicit message explaining why.
- This scoring is part of the same "Envoyer" flow as Epic 1 — there is no separate "Analyser" action and no extra button triggers it; it runs automatically once N responses exist.
- Each dimension needs an expandable detail: what's done well, what to clarify, a concrete rewrite suggestion, and — only if a correction was actually applied to that dimension — a sentence naming concretely what varied between responses (e.g. "2 réponses sur 5 dépassaient la longueur demandée"). Never expose a raw point delta like "-2 points".
- The 3 dimension cards must be visually identical — none is ever promoted as "the weak one." (This is a deliberate change from the pre-pivot mechanic, which had a global average score and a flagged "point faible"; that concept does not carry over — there is no global/averaged score across dimensions in this mechanic.)
- A results view toggle ("Voir l'analyse" / "Voir les réponses") switches between the generated-responses view and the dimension-analysis view purely on the client, with no new API call. Only the label of the currently *inactive* view is shown on the toggle button. "Réponses générées" is the default view right after generation.
- Success/error handling follows the shared contract: any failed API call aborts the whole flow with a clear error — never a partial result presented as final (applies across Epics 1 and 2 since they're one continuous flow).

## Technical Decisions

- New/changed route: `POST /api/analyze-dimensions` (replaces the old `/api/analyze`) — request `{ prompt: string, scoreResults?: { criterion: string, passed: boolean }[][] }`, response `{ dimensions: { name: "objectif" | "contexte" | "contraintes", note: number, palier: "absent" | "a-clarifier" | "clair" | "tres-clair", explanation: string, rewriteSuggestion: string, correctionApplied: boolean, correctionDetail?: string }[] }`. `scoreResults` is the array of `/api/score` results for the N responses (one entry per response, from Epic 1's Story 1.5); when absent or holding a single entry (N=1), every dimension's `correctionApplied` is `false`.
- Errors from this route follow the shared uniform contract: `{ error: string }` + HTTP 500 — never a route-specific error shape.
- This call runs entirely server-side (no direct client call to Anthropic) and, like every other route, sends a single fresh-context message per call — no conversation history retained between calls (applies to the same independence rule Epic 1's routes follow).
- Orchestration: this is phase 4 of the client-driven flow in `app/page.tsx` — triggered automatically the moment phase 3 (the N `/api/score` calls) completes, not on the view-toggle click. The client holds all state in React (`useState`), no persistence, no `localStorage`.
- Fixed correction thresholds (same 3-level scale, same point values, for all three dimensions):
  - **Contraintes**: rate of responses failing at least one criterion (fixed or extracted) → 0% = faible (-0), 1-33% = modérée (-2), >33% = forte (-4). This is the one dimension with concrete pass/fail criteria to check against (from Epic 1's silent per-response scoring).
  - **Objectif**: qualitative divergence between responses on subject/angle/level of detail → same faible/modérée/forte scale.
  - **Contexte**: qualitative divergence between responses on tone → same faible/modérée/forte scale.
- Dimension shape note: the earlier 4-dimension design (Objectif, Contexte, Exemples, Contraintes) was collapsed into 3 during the pivot — "Exemples" was folded into Contraintes as a third axis (alongside format/length and exclusions; giving a concrete example counts as precisely specifying a format), and persona was folded into Contexte. Contraintes' tier anchors were revised accordingly: 0 = Absent (no axis covered); 1-5 = À clarifier (one axis mentioned but vague); 6-8 = Clair (one axis quantified precisely, OR a concrete example given); 9-10 = Très clair (several axes combined, or an example that locks down the whole pattern). The Objectif and Contexte anchors and behavioral-correction logic from the original 4-dimension spec are otherwise unchanged by the pivot — only the point scale changed from "-2 to -4" (vague) to the fixed 3-tier faible/modérée/forte scale above.
- There is no longer a global/averaged prompt score across dimensions, and no "point faible" (weakest dimension) flagging — that mechanism belonged to the old 4-dimension average-based design and was dropped; each of the 3 dimension cards stands on its own.
- Naming/formatting conventions apply here too: kebab-case API routes, PascalCase components, JSON in/out, and the shared color tokens (`--primary`, `--background`, `--accent`) rather than hard-coded colors.

## UX & Interaction Patterns

- Dimension cards (Objectif / Contexte / Contraintes) render as one row of three (`sm:grid-cols-3`) in the "Analyse par dimensions" view, collapsed by default, all three visually identical. Collapsed state shows the note (0-10) and the palier label as a status pill (color paired with a text label, never color alone).
- Clicking anywhere on a card toggles expand/collapse independently (`aria-expanded`, `aria-controls`, no accordion-exclusivity — expanding one never collapses another).
- Expanded detail shows, in order: the anchor text matching the note obtained, what's done well, what could be clearer, a concrete before/after rewrite suggestion, and — only if a correction was applied — a sentence naming what concretely varied across responses. If N=1, no correction section renders at all; the existing N=1 explanatory message is shown instead.
- The view toggle is a native `<button>` whose visible label always names the *destination* view ("Voir l'analyse" or "Voir les réponses"), never an icon-only control, and never triggers a new fetch.
- No hover-only information anywhere in this epic's surfaces — explanations are always-visible text, since this must work identically on touch devices.
- Voice: when naming what varied for a correction, be concrete ("2 réponses sur 5 dépassaient la longueur demandée"), never vague ("les réponses variaient trop") and never a raw point delta.
- Mock reference: `mockups/results-analyse-view.html` in the UX designs folder.

## Cross-Story Dependencies

- Epic 2 consumes Epic 1's output directly: the N generated responses' text (for the "Réponses générées" view Story 2.4 toggles to) and the per-response `scoreResults` from Story 1.5's silent `/api/score` calls (feeds Story 2.2's correction calculation, especially Contraintes). Epic 2 cannot start until Epic 1's phases 2-3 (generation + scoring) complete without error.
- Story 2.1 (base textual note + card display) must exist before Story 2.2 (correction) can modify its output, and before Story 2.3 (pedagogical detail) has anything to render inside an expanded card.
- Story 2.4 (view toggle) depends on both the "Réponses générées" view (built in Epic 1) and the dimension cards (Story 2.1) existing as the two things it switches between; it adds no new data fetching of its own.
