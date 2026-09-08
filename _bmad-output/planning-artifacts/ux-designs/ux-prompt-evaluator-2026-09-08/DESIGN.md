---
name: Prompt Evaluator
status: final
updated: 2026-09-08
description: Single-screen tool for consultants to test and diagnose prompts against acceptance criteria. Next.js App Router + Tailwind CSS v4, no component library — hand-styled with CSS custom properties as design tokens.
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

Single column, `max-w-3xl` (768px), generous vertical rhythm (`gap-6` between major blocks). One elevated card holds the whole input form; results render as separate cards below it in the same column. Exception: the analysis's 4 dimension cards render `sm:grid-cols-2` (two-column) on `sm+` viewports — the only place in the app where content sits side-by-side, because the 4 dimensions are a fixed, comparable set meant to be scanned together, unlike the sequential form-then-results flow everywhere else.

## Elevation & Depth

A single flat `shadow-sm` marks every elevated surface (form card, result cards, alert boxes, buttons) — never stacked, never combined with a second shadow for depth. Elevation is binary: flat page background, or one `shadow-sm` card. Don't introduce a second elevation tier.

## Shapes

Three roles, never mixed:
- **`rounded-2xl`** — panels: the form card, result cards, the summary panel, alert/error boxes.
- **`rounded-xl`** — input fields (textareas): softer than panels, signals "editable," not "container."
- **`rounded-full`** — anything actionable or a small status readout: buttons and count/status chips. Pill shape = "compact and interactive or informational," never a content container.

## Components

- **Primary button ("Évaluer")** — filled `{colors.primary}`, white text, pill. The dominant action.
- **Secondary button ("Analyser")** — outlined `{colors.primary}`, pill. Visually subordinate to "Évaluer" but not diminished — both are legitimate entry points, only one has less visual weight by convention (filled = "the one most people do first").
- **Chip** — pill, accent-tinted, monospace — used for the criteria count and run count. The per-criterion stability ratio uses the same monospace/accent treatment but is *not* pill-shaped (plain text, no fill or padding) — a smaller, denser readout repeated once per criterion rather than a single summary count.
- **Status pill (analysis dimensions)** — `absent` (muted foreground tint), `présent` (accent tint), `clair` (primary tint) — a 3-step scale from "nothing" to "best," using the same accent/primary vocabulary as everywhere else rather than a separate traffic-light palette.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Fraunces (bold for H1/tagline, medium for field labels) for structural text | Fraunces for body copy, results, or anything the user typed |
| Accent (`#d99a2b`) for counts, ratios, and the mid-tier status | Accent on a button or as a second "primary" color |
| Monospace for anything numeric/measured | Monospace for prose or labels |
| One elevated white card per logical block | Nested cards or shadows stacked for fake depth |
| Warm cream ground, plum/magenta as the only strong color | Introducing a second accent hue or a neutral grey background |
