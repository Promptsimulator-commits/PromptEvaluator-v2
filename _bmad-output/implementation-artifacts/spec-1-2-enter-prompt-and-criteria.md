---
title: 'Enter a prompt and its acceptance criteria'
type: 'feature'
created: '2026-09-04'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage is still the default `create-next-app` placeholder. Before any prompt can be evaluated, the consultant needs a screen to type the prompt they want to test and the acceptance criteria they'll judge it by.

**Approach:** Replace the homepage (`app/page.js`) with a simple form: a textarea for the prompt, a textarea for criteria (one per line), and an "Évaluer" button. The button is disabled until the prompt is non-empty and at least one non-blank criteria line is present (blank lines don't count toward the minimum). No submission behavior yet — this story only captures and validates input state; wiring the button to `/api/execute` is Story 1.3. Client-side React state only (`useState`), no persistence.

</frozen-after-approval>

## Implementation Notes

- Context list was empty in frontmatter; inspected the existing `app/page.js`, `app/layout.js`, and `app/globals.css` (default `create-next-app` scaffold, Tailwind v4 + Geist fonts) to match styling conventions before replacing the homepage.
- Replaced `app/page.js` entirely with a client component (`"use client"`) using two `useState` hooks (`prompt`, `criteria`) — no persistence, as specified.
- "Évaluer" button `disabled` is driven by `canEvaluate = prompt.trim().length > 0 && hasNonBlankCriteria`, where `hasNonBlankCriteria` checks that at least one line of the criteria textarea (split on `\n`) has non-whitespace content after `.trim()`. This satisfies "blank lines don't count toward the minimum."
- No submission handler wired to the button (`type="button"`, no `onClick`) — intentional per spec, since wiring to `/api/execute` is Story 1.3.
- Labels/placeholders written in French to match the product's existing French-language framing ("Évaluer" button name given in spec); this is a judgment call since the spec didn't mandate language for labels — easy to revisit if English is preferred.
- Created `.claude/launch.json` (did not exist before) to enable local preview via `npm run dev` on port 3000; not part of the app itself, just a dev tooling convenience.
- Verified: `npx next build` succeeds (static prerender of `/`), `npx eslint app/page.js` reports no issues, and manually exercised the UI in a browser preview — button stays disabled with empty prompt, stays disabled with prompt filled but criteria containing only blank/whitespace-only lines, and becomes enabled once both prompt and at least one non-blank criteria line are present.
- Nothing left incomplete relative to this story's scope; the button intentionally does nothing on click yet (out of scope, per spec, for Story 1.3).
- French UI labels confirmed correct by the user (end users are French-speaking consultants) — not a language-consistency issue, intentional.

## Review Triage Log

- **patch** — `app/layout.js` declared `lang="en"` while all visible UI text is French. Fixed: changed to `lang="fr"`.
- **patch** — `app/layout.js` metadata still read `title: "Create Next App"` / default description. Fixed: updated to "Prompt Evaluator" with a real description.
- **defer** — No visible reason shown when the "Évaluer" button is disabled, and no required-field indicator on the textareas. Logged to `deferred-work.md`.
- **defer** — No live count of recognized (non-blank) criteria lines. Logged to `deferred-work.md`.
- **defer** — Duplicate criteria lines not deduplicated/flagged. Logged to `deferred-work.md` (relevant to Story 1.4 scoring).
- **defer** — No max length / soft guard on the textareas ahead of Story 1.3's API wiring. Logged to `deferred-work.md`.
- **defer** — Criteria placeholder shows only one example line. Logged to `deferred-work.md`.
- **false** — `useMemo` used for `hasNonBlankCriteria` called "inconsistent/unnecessary." No actual defect — the memoized value is correct; this is a style preference with no named harm, not a bug.
- **false** — No automated tests for `canEvaluate` logic. Explicitly out of scope: this project has no test framework by design (3-day POC, decided in Story 1.1's frozen intent — "no CI/CD pipeline beyond Vercel's default git-push deploy").
- **false** — `sprint-status.yaml` said `in-progress` while the story reads as complete. Not a defect: the sync to `review` status happens at this Finalize step, which had not yet run when the reviewer looked.

