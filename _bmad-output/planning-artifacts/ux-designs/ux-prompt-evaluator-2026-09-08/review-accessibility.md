# Accessibility Review (WCAG 2.1 AA) — DESIGN.md + EXPERIENCE.md

> **Resolution status (added after `/bmad-code-review`, 2026-09-08):** Fixed directly: finding #7 (subtitle contrast, `foreground/60` → `/70`, verified 6.22:1 — the only contrast issue this pass itself introduced), #5 (`role="alert"` now documented in Accessibility Floor), #6/#11 (never-color-alone principle documented), #8 (keyboard-baseline wording clarified), #9 (minimum text-size rule added to `DESIGN.md`, and the two `text-xs` instances it named were bumped to `text-sm`), #12 (focus-visible rule documented), #13 (slider name/value and hidden progress bar behavior documented as intentional contract). **Not fixed — deferred to a dedicated follow-up** (logged in `deferred-work.md`, since these are pre-existing app-wide color tokens, not introduced by this pass): findings #1, #2, #3 (accent-on-tint contrast, plain accent-on-card, border/card near-invisibility) and #4/#10 (foreground/40, absent-pill contrast). #14 (disabled-button faintness) was flagged for design judgment only, not acted on.

**Verdict:** The behavioral contract (keyboard, `aria-live`, disabled attributes, "no hover-only info") is sound and matches what's actually implemented. The color contract is not: several color combinations the app actively uses — the accent chip/pill family, the plain accent text, and the border/card token against the cream background — fall well short of AA, in one case (chip text) by more than half the required ratio. These are token-level defects in DESIGN.md, not implementation slips, so they'll reproduce anywhere the tokens are reused. Contrast ratios below were computed from the documented hex values using the WCAG relative-luminance formula; a couple of the pass/fail lines are close enough that these should be re-verified with a contrast-checking tool before sign-off.

---

## Critical

1. **Accent-on-accent chip/pill text fails contrast by more than half (~2.16:1, needs 4.5:1)**
   - **Where:** `DESIGN.md` → Components → `chip` (`background: {colors.accent}/15`, `foreground: {colors.accent}`) and Components → "Status pill" (`présent` = accent tint); confirmed in the frontmatter `components.chip` block (lines 38–42) and prose (line 84). Grounded in `app/page.js` lines 291, 316, 431–435, 525 — the criteria-count chip, run-count chip, "Exécution N" chip, and the "présent" analysis pill all render `text-accent` on `bg-accent/15`.
   - **Why it fails:** `#d99a2b` (accent) has relative luminance ≈0.380; `#d99a2b` at 15% over white has luminance ≈0.878. Both are yellow-shifted, so despite looking like "dark-on-light," the actual contrast is ≈2.16:1 — under both the 4.5:1 normal-text threshold and even the 3:1 large-text/UI threshold.
   - **Fix:** Either darken the accent token used for text-on-tint (e.g. a dedicated `accent-text` token around `#8a5f14`–`#7a5410`, which gets accent's tint background to ~4.5:1), or invert the pattern — solid `accent` background with white/near-black text — for anything using the chip token. Whatever is chosen, add the resulting ratio to DESIGN.md so it's locked, not just "looks fine on my monitor."

2. **Plain accent text on white card (~2.44:1)**
   - **Where:** DESIGN.md's accent definition (Colors section, line 57: "reserved for numeric/status chips … and the 'à clarifier' analysis status") doesn't scope accent to tinted backgrounds only — and the app also uses solid `text-accent` directly on `bg-card` for the per-criterion stability ratio (`app/page.js` line 488, "X / N").
   - **Fix:** DESIGN.md should state explicitly that raw `accent` text is never placed directly on `card`/`background` — only inside its own tint (once fix #1 makes that tint combination compliant), or replace the stability-ratio numeral with `foreground` (which already passes) and reserve accent for the pill/chip fill only.

3. **Input/card boundaries are near-invisible by contrast (border ≈1.29:1 vs background; card ≈1.08:1 vs background)**
   - **Where:** DESIGN.md → Colors ("Border `#ecd9b8`" line 58) and Layout & Spacing ("One elevated card holds the whole input form," line 70). The textareas (`app/page.js` lines 279, 304) use `bg-background` (same color as the page) with only `border-border` to mark their edges, and the form card (line 264) uses `bg-card` (`#ffffff`) against `bg-background` (`#fdf6e9`).
   - **Why it fails:** `border` (`#ecd9b8`) vs `background` (`#fdf6e9`) computes to ≈1.29:1 — far under the 3:1 WCAG 1.4.11 threshold for a UI-component boundary that is the *only* cue separating an input field from the page (the textarea fill is identical to the page background). Card-white vs background-cream is ≈1.08:1 — the whole "one elevated white card" concept the spine leans on is carried almost entirely by the `shadow-sm` shadow, not color, and shadows disappear for some low-vision/high-contrast-mode users.
   - **Fix:** Either darken `border` for input/card edges specifically (a token around `#c9a878`–`#b8925e` gets to ~3:1 against both background and card), or give textareas a distinct fill (e.g. `card` instead of `background`) so the border isn't the sole differentiator. Add a `border-strong` or `input-border` token to DESIGN.md's palette rather than reusing the decorative hairline `border` for a load-bearing boundary.

---

## High

4. **`foreground/40` text (placeholder, slider min/max labels, score "/10" suffix) fails contrast (~2.5:1 against both background and card)**
   - **Where:** Not a DESIGN.md token at all — `foreground/40` and `foreground/60` are opacity variants that exist only in `app/page.js` (lines 279/304 placeholder, 331–334 min/max labels, 467 "/10" suffix), never specified in DESIGN.md's Colors section. Since DESIGN.md is the declared contract and is silent on these, any implementer regenerating the UI from the spec alone would have no ratio to check against.
   - **Fix:** Add explicit opacity-variant tokens to DESIGN.md (e.g. `foreground-muted: foreground/60`, `foreground-faint: foreground/40`) with computed contrast ratios next to each, and cap the faint variant's use to genuinely decorative text (23px+ or non-essential) since 40%-opacity foreground cannot reach 4.5:1 on either background or card at any reasonable size.

5. **"absent" status pill (`foreground/50` on `foreground/10`) under threshold (~3.19:1, needs 4.5:1)**
   - **Where:** DESIGN.md → Components → "Status pill" (line 84: "`absent` (muted foreground tint)").
   - **Fix:** Bump the "absent" pill's text to full `foreground` (contrast then ≈6.6:1) or to `foreground/70`+, and specify the exact opacity value in DESIGN.md rather than leaving "muted" undefined.

6. **Non-text contrast for the card/border pattern is not covered by the color spec at all** (rolled up from Critical #3, listed here as a broader documentation gap) — DESIGN.md's Colors section gives no non-text (1.4.11) guidance for any of the four surfaces (card edge, input edge, focus ring, disabled state), even though the "single elevated card" pattern is called out as the layout's defining device (Layout & Spacing, line 70).

---

## Medium

7. **`foreground/60` on `background` (not card) computes to ≈4.47:1 — just under the 4.5:1 normal-text threshold**
   - **Where:** Header subtitle, `app/page.js` line 251–253 ("Rédige un prompt et les critères…"), which sits directly on `bg-background`, not inside the card. The same opacity value against `card` clears the bar (≈4.58:1), so the failure is specific to the un-carded instance.
   - **Fix:** Either move this line inside the card, or use a slightly less transparent variant (e.g. `foreground/65`) specifically for text placed directly on the cream background. Document both the card and background contexts separately in DESIGN.md since they don't share a pass/fail outcome.

8. **EXPERIENCE.md's "Mouse/touch only — no keyboard shortcuts" (Interaction Primitives, line 60) is ambiguous and could be misread as "keyboard access isn't required"**
   - **Why it matters:** The intent (confirmed by context — no accelerator keys, not a power-user tool) is reasonable, but as written it sits right next to the Accessibility Floor section and gives no explicit reassurance that the slider, buttons, and textareas must still be fully keyboard-operable (tab, arrow keys, enter/space) per WCAG 2.1.1. A downstream implementer skimming for "what keyboard support do I need to build" could take this line as license to skip it.
   - **Fix:** Reword to: "No custom keyboard shortcuts or accelerator keys (not this tool's audience) — all native controls (textareas, slider, buttons) remain fully keyboard-operable via their default browser behavior; this is a baseline, not a decision point."

9. **Extensive load-bearing copy specified/rendered at `text-xs` (~12px) with no minimum-size floor in DESIGN.md**
   - **Where:** DESIGN.md's Typography section (lines 62–67) sets family/weight/usage per role but never a minimum size. In practice (`app/page.js`), the run-count trade-off explanation (line 335–339, the exact text EXPERIENCE.md calls "critical, always-visible" in the Accessibility Floor, line 66), the per-criterion explanations (line 564–566), the button-choice disambiguation caption (line 378–382), and error/analysis captions all render at `text-xs`.
   - **Fix:** Add a floor to DESIGN.md Typography, e.g. "Help/explanatory text that is load-bearing (per Accessibility Floor) must not go below `text-sm` (14px); `text-xs` is reserved for secondary metadata (timestamps, counters, per-criterion labels) that duplicates information available elsewhere." This also lessens the impact of finding #7/#4 since larger text is more forgiving perceptually even at the same contrast ratio.

10. **Accessibility Floor doesn't document `role="alert"` on error containers**
    - **Where:** EXPERIENCE.md → Accessibility Floor (lines 62–68) covers `aria-live="polite"` for in-flight status and `disabled` attributes, but is silent on the error/analysisError boxes, which do carry `role="alert"` in `app/page.js` (lines 386–392, 394–401).
    - **Fix:** Add a bullet: "Error and analysis-error messages use `role=\"alert\"` so they're announced immediately without depending on focus — unchanged by this pass, called out so future error states follow the same pattern instead of a passive `aria-live` region (which wouldn't interrupt)."

11. **Accessibility Floor doesn't state the "never color alone" principle for status pills**
    - **Where:** DESIGN.md's Status pill component (line 84) and EXPERIENCE.md's Accessibility Floor are both silent on this; the app happens to comply (`STATUS_LABEL` text alongside color, `app/page.js` line 33–41), but nothing in the contract requires it going forward.
    - **Fix:** Add to Accessibility Floor: "Status/result indicators (analysis pills, pass/fail marks) always pair color with a text label or icon+`sr-only` text — never color alone — per WCAG 1.4.1." This also covers the ✓/✗ pass/fail marks (`aria-hidden` + `sr-only` "Validé :"/"Non validé :", lines 543–561), which are correct but likewise undocumented.

---

## Low

12. **Accessibility Floor is silent on focus-visible treatment**
    - **Where:** EXPERIENCE.md Accessibility Floor (lines 62–68) covers hover, live regions, and disabled state, but never focus indication. In the app, textareas have an explicit focus ring (`focus:ring-2 focus:ring-primary/20`, lines 279/304) but the Évaluer/Analyser buttons and the range slider have no custom focus style at all — they rely entirely on the browser's default outline, which is unspecified and could be visually removed in a future change with nothing in the contract to catch it.
    - **Fix:** Add a token/rule: "All interactive elements (buttons, slider, textareas) show a visible focus ring using `primary` at reduced opacity; never `outline: none` without a replacement that meets 3:1 against every adjacent background." 

13. **Accessibility Floor doesn't mention the range slider's accessible name/value, or the decorative progress bar**
    - **Where:** The run-count `<input type="range">` (line 320–330) gets its accessible name for free from the associated `<label htmlFor="runCount">` and its value announcement from native browser behavior — correct today, but not called out as a contract, so a future re-implementation (e.g. a custom-styled slider component) could silently drop both. Similarly the stability progress bar (`aria-hidden="true"`, line 492–500) is correctly hidden from assistive tech because the adjacent text already states the ratio — also uncalled-out.
    - **Fix:** Add two short bullets to Accessibility Floor confirming both as intentional, load-bearing behavior rather than incidental.

14. **Disabled button contrast is very faint (~2.38:1) though WCAG-exempt**
    - **Where:** `disabled:bg-foreground/15 disabled:text-foreground/40` (Évaluer/Analyser buttons, lines 347, 355). WCAG 1.4.3/1.4.11 exempt inactive UI components from contrast minimums, so this isn't a compliance violation, but at ≈2.38:1 against the card the disabled buttons may read as "broken" rather than "not yet available" for low-vision users, especially since the surrounding hairline border (#ecd9b8, finding #3) is already low-contrast.
    - **Fix:** Not a hard requirement, but worth bumping `disabled:text-foreground/40` to `/55`–`/60` for legibility; no doc change strictly needed, flagging for design judgment only.
