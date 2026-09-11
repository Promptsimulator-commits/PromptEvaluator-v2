---
name: Prompt Evaluator
status: final
updated: 2026-09-11
description: Single-screen tool for consultants to test a prompt — criteria are extracted automatically from the prompt text (not typed by hand), then scored across 3 dimensions (Objectif/Contexte/Contraintes) via a textual reading corrected by response divergence. Next.js App Router + Tailwind CSS v4, no component library — hand-styled with CSS custom properties as design tokens.
colors:
  background: '#fdf6e9'
  foreground: '#241528'
  card: '#ffffff'
  primary: '#851f6b'
  primary-hover: '#6d1a58'
  accent: '#d99a2b'
  border: '#ecd9b8'
typography:
  display:
    fontFamily: 'Fraunces'
    fontWeight: '700'
    usage: 'Product name (H1) and the tagline beneath it — the two elements meant to read as the dominant brand moment'
  display-label:
    fontFamily: 'Fraunces'
    fontWeight: '500'
    usage: 'Field/section labels (Prompt à évaluer, Critères d''acceptation, Nombre d''exécutions, etc.) — same family as display, lighter weight: ties them to the product''s identity without competing with the H1 for dominance'
  body:
    fontFamily: 'Geist Sans'
    usage: 'Body copy, buttons, inputs, help text'
  mono:
    fontFamily: 'Geist Mono'
    usage: 'Counters and status chips (e.g. "5 exécutions", "0 critère") — numeric/technical readouts read as data, not prose'
rounded:
  panel: 1rem   # rounded-2xl — cards, result panels, alert boxes
  field: 0.75rem  # rounded-xl — textareas
  pill: 9999px  # rounded-full — buttons, chips, badges
components:
  primary-button:
    background: '{colors.primary}'
    foreground: '#ffffff'
    hover: '{colors.primary-hover}'
    radius: '{rounded.pill}'
  secondary-button:
    background: 'transparent'
    border: '{colors.primary}'
    foreground: '{colors.primary}'
    radius: '{rounded.pill}'
  chip:
    background: '{colors.accent}/15'
    foreground: '{colors.accent}'
    radius: '{rounded.pill}'
    font: '{typography.mono}'
---

## Brand & Style

Prompt Evaluator is a working tool for consultants, not a consumer product — the visual language says "precision instrument," not "playful app," while staying warm rather than clinical. A warm cream ground and a single confident magenta/plum accent carry the whole identity; a serif display face (Fraunces) gives the product name and structural labels a crafted, editorial weight against the plain sans-serif body copy used for actual content (prompts, criteria, results). The pairing is deliberate: *the tool's own structure looks considered; the user's input stays plain and legible.*

The company logo (a small abstract mark, black linework with a magenta dot) sits top-right of the header — brand presence without competing with the product name, which is the visually dominant element on the page.

## Colors

- **Background `#fdf6e9`** (warm cream) — page ground. Never pure white; the warmth is the brand's signature over a clinical SaaS look.
- **Card `#ffffff`** — the single elevated surface (the form panel, result cards, alert boxes) against the cream ground.
- **Foreground `#241528`** (near-black plum) — all body text.
- **Primary `#851f6b`** (magenta/plum) — the brand color: product name, primary button, focus rings, links, the "Évaluer" action, error/alert accents. `primary-hover` (`#6d1a58`) is the pressed/hover state, never a separate meaning.
- **Accent `#d99a2b`** (amber/gold) — reserved for numeric/status chips (run counts, criterion counts) and the "à clarifier" analysis status, always inside its own tint background, never as plain text on `card`/`background`. Never used for primary actions — accent means *a number or a state to notice*, not *click here*.
- **Border `#ecd9b8`** — all hairlines and input borders, a warm tint of the background rather than a neutral grey.

**Opacity convention.** Text hierarchy is expressed by applying opacity to `foreground`/`primary`/`accent` rather than defining separate muted tokens (e.g. `foreground/60` for secondary copy, `foreground/40` for placeholders and disabled labels). Load-bearing text on `background` (not inside a `card`) needs at least `/70` to clear 4.5:1 — `/60` measures ~4.47:1 there, just under threshold, though it clears the bar at ~4.58:1 on `card`. The two contexts don't share a pass/fail outcome; pick the opacity by what the text sits on, not by role alone.

**Known contrast gaps (unverified/failing, not yet fixed — see `deferred-work.md`):** accent text on its own `/15` tint (~2.16:1) and plain accent text on `card` (~2.44:1) both fail 4.5:1; `border` against `background`/`card` (~1.29:1 / ~1.08:1) fails the 3:1 non-text threshold for the textarea and card edges; the "absent" status pill (`foreground/50` on `foreground/10`) measures ~3.19:1. These are pre-existing app-wide tokens, out of scope for the onboarding/copy pass that authored this spine — do not silently copy these combinations into new components without checking `deferred-work.md` first.

No dark mode exists today (static light theme only) — a known gap for this POC, not a design decision to preserve.

## Typography

- **Fraunces bold (`{typography.display}`)** — the product name "Prompt Evaluator" (large, dominant) and the small bold tagline "TESTE TON PROMPT" beneath it — same family and weight as the H1, deliberately smaller, so the header reads as one typographic family at two scales rather than two competing voices.
- **Fraunces medium (`{typography.display-label}`)** — every field/section label ("Prompt à évaluer", "Critères d'acceptation…", "Nombre d'exécutions", "Synthèse de l'évaluation", etc.). Same family as the header, lighter weight — the label ties to the product's identity without competing with the H1/tagline for dominance. Deliberately *not* the same 700-weight token: this pass changed only the family on existing labels, not their size or weight.
- **Geist Sans (body)** — everything the user reads or types: descriptive copy, textarea content and placeholders, button labels, result text, explanations.
- **Geist Mono (numeric chips)** — anything that's a count or a measurement: "5 exécutions", "0 critère", "3,3 / 10", per-criterion "X / N" ratios. Monospace signals "this is measured data," distinct from prose.

**Minimum size for load-bearing text.** Help/explanatory text the Accessibility Floor calls always-visible-and-necessary (the run-count trade-off explanation, the Évaluer/Analyser distinction, per-criterion explanations) must not go below `text-sm` (14px). `text-xs` is reserved for secondary metadata that duplicates information available elsewhere (timestamps, counters, per-criterion labels already shown as chips) — smaller text is more forgiving of contrast issues, but load-bearing copy shouldn't rely on that margin.

## Layout & Spacing

Single column, `max-w-3xl` (768px), generous vertical rhythm (`gap-6` between major blocks). One elevated card holds the prompt input; the criteria list (extracted, editable) opens inline beneath it on confirmation, in the same column. Exception: the 3 dimension cards (Objectif, Contexte, Contraintes) render `sm:grid-cols-3` (three equal columns, one row) on `sm+` viewports — the only place in the app where content sits side-by-side, because the 3 dimensions are a fixed, comparable set meant to be scanned together, unlike the sequential form-then-results flow everywhere else. (Was a `sm:grid-cols-2` 2×2 grid for 4 dimensions before the V2 mechanic dropped "Exemples" as a standalone dimension — a 3-column single row replaces the 2×2 to avoid an unbalanced 2+1 layout.)

## Elevation & Depth

A single flat `shadow-sm` marks every elevated surface (form card, result cards, alert boxes, buttons) — never stacked, never combined with a second shadow for depth. Elevation is binary: flat page background, or one `shadow-sm` card. Don't introduce a second elevation tier.

## Shapes

Three roles, never mixed:
- **`rounded-2xl`** — panels: the form card, result cards, the summary panel, alert/error boxes.
- **`rounded-xl`** — input fields (textareas): softer than panels, signals "editable," not "container."
- **`rounded-full`** — anything actionable or a small status readout: buttons and count/status chips. Pill shape = "compact and interactive or informational," never a content container.

## Components

- **Primary button ("Envoyer")** — filled `{colors.primary}`, white text, pill. The single business action: extraction → validation → generation → scoring, one flow, one button. There is no longer a second business action that re-triggers a call — "Analyser" was retired as its own action (see `EXPERIENCE.md.Foundation`).
- **Secondary button ("Confirmer et lancer")** — outlined `{colors.primary}`, pill. Appears inline once the extracted-criteria list is showing; confirms the (possibly edited) list and starts generation.
- **Tertiary/ghost button ("Annuler")** — plain text, `{colors.foreground}/70`, no border or fill — sits beside "Confirmer et lancer," closes the criteria list and returns to editing the prompt. Deliberately the quietest control on the row: it's an escape hatch, not a competing action.
- **View toggle ("Voir l'analyse" / "Voir les réponses")** — outlined `{colors.primary}`, pill, same visual family as a secondary button but behaves as a pure display switch (no new API call) between the "Réponses générées" and "Analyse par dimensions" views once results exist. Only one of the two labels is shown at a time (whichever view is *not* currently active).
- **Chip** — pill, accent-tinted, monospace — used for the (single, extracted-only) criteria count and run count. The per-criterion stability ratio uses the same monospace/accent treatment but is *not* pill-shaped (plain text, no fill or padding) — a smaller, denser readout repeated once per criterion rather than a single summary count.
- **Status pill (dimension score)** — 4-step scale, `Absent` (muted `foreground/10` tint) → `À clarifier` (accent `/15` tint) → `Clair` (primary `/15` tint) → `Très clair` (primary `/30` tint, same hue one step darker/denser). Deliberately reuses the existing two hues (accent, primary) rather than introducing a third color for the added step — consistent with "plum/magenta as the only strong color" (see Do's and Don'ts). Shipped and used in real testing since Story 2.1 without issue — the `primary/30` vs. `primary/15` step reads clearly as "one step up" from `Clair`; the earlier `[ASSUMPTION]` flag on this is resolved.
- **Global note** *(added 2026-09-11, post-Epic 2)* — reuses `{typography.display}` at a larger size (`text-5xl font-semibold`, matching V1's retired "Note finale") with a small-caps `{colors.primary}` label above. No new token introduced; sits above the 3 dimension cards in the "Analyse par dimensions" view.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Fraunces (bold for H1/tagline, medium for field labels) for structural text | Fraunces for body copy, results, or anything the user typed |
| Accent (`#d99a2b`) for counts, ratios, and the mid-tier status | Accent on a button or as a second "primary" color |
| Monospace for anything numeric/measured | Monospace for prose or labels |
| One elevated white card per logical block | Nested cards or shadows stacked for fake depth |
| Warm cream ground, plum/magenta as the only strong color | Introducing a second accent hue or a neutral grey background |
