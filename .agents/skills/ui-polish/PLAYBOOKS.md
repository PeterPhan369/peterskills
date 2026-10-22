# UI Polish Directional Playbooks

Directional techniques for refining, repairing, and perfecting existing user interfaces. When running `ui-polish`, select the playbook that matches the user's intent.

---

## 1. Bolder

Use when the current design feels timid, generic, flat, or lacks personality.

1. **Amplify typographic contrast**:
   - Push display headings up by 1.5x to 2x using fluid sizing (`clamp()`).
   - Increase heading weight to bold or black (700 to 900) while keeping body text at regular (400).
   - Create an unmistakable size differential between primary titles and secondary section labels.

2. **Sharpen boundaries and structure**:
   - Replace muddy diffuse box-shadows with crisp, high-contrast borders or dark offset drop shadows.
   - Use high-contrast dividers between major sections.
   - Anchor focal containers with bold architectural grounding rather than floating pastel cards.

3. **Commit to high-confidence color**:
   - Replace pale, timid accent pastels with saturated, intentional brand color.
   - Use high-contrast call-to-action buttons that command immediate visual hierarchy.
   - Create strong focal contrast: one primary accent hue doing heavy lifting, backed by solid neutrals.

---

## 2. Quieter

Use when the current design feels overwhelming, noisy, over-saturated, or visually chaotic.

1. **Reduce visual tension**:
   - Strip aggressive borders from cards; let whitespace and subtle surface shifts create separation.
   - Soften high-contrast hairline dividers to low-opacity tints (for example: `border-slate-100` or `border-white/10`).
   - Tone down screaming neon accents to muted, refined shades.

2. **Calm the palette**:
   - Reduce the number of competing colors. Limit the view to one dominant accent and quiet monochrome neutrals.
   - Desaturate large background fills, keeping chroma confined to interactive triggers and active badges.

3. **Expand breathing room**:
   - Increase section padding by 1.5x.
   - Loosen tight margins between disparate content groups.
   - Eliminate non-essential decorative badges, floating tags, and background gradients.

---

## 3. Distill

Use when the interface has accumulated clutter, unnecessary wrapper cards, redundant copy, or decorative filler.

1. **Flatten container hierarchy**:
   - Eliminate nested cards and redundant outer card wrappers.
   - Remove background containers where text can sit directly on the primary canvas.
   - Strip decorative icons that merely repeat the text beside them.

2. **Trim redundant copy**:
   - Remove kickers and category labels that restate what the headline already says.
   - Rewrite verbose button labels to direct, concise action verbs.
   - Consolidate repetitive helper copy into intuitive placeholder or tooltip text.

3. **Prune decorative elements**:
   - Remove floating blurred gradient spots, artificial divider shapes, and decorative background geometry.
   - Focus the user's eye exclusively on actionable data, clear controls, and core content.

---

## 4. Layout and Rhythm

Use when the layout feels awkward, misaligned, crowded, or lacks visual cadence.

1. **Enforce an explicit spatial scale**:
   - Align all margins and padding to an explicit 4px or 8px grid (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px).
   - Eliminate arbitrary one-off spacing values (such as 13px or 27px).

2. **Fix heading proximity**:
   - Ensure every heading has significantly more space above it than below it. As a baseline: heading top margin should be 2x to 3x the bottom margin so it visually attaches to its section.

3. **Establish responsive composition**:
   - Replace inflexible multi-column layouts with adaptive CSS grids: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`.
   - Ensure horizontal button bars stack gracefully on mobile screens with `flex-wrap` or responsive flex direction.

---

## 5. Typeset

Use when typography feels sloppy, hard to read, generic, or poorly scaled.

1. **Replace overused fonts**:
   - Audit font families against `overused-font`. If Inter or Roboto is used without brand necessity, introduce a domain-appropriate alternative.
   - Pair a distinctive display font with a clean, readable text face.

2. **Calibrate line height and measure**:
   - Set body line-height between 1.5 and 1.6 for comfortable reading; tighten display headings to 1.15 to 1.25.
   - Constrain reading paragraphs to 65ch maximum width to prevent eye fatigue.

3. **Refine details**:
   - Enable `text-wrap: balance` on multiline display titles.
   - Apply `tabular-nums` on numeric columns, timers, and metrics.
   - Tighten tracking on large display headings (`letter-spacing: -0.02em` to `-0.03em`) and loosen tracking slightly on small uppercase labels (`letter-spacing: 0.05em`).

---

## 6. Colorize

Use when color is missing, drab, inconsistent, or visually jarring.

1. **Eliminate muddy gray-on-color**:
   - Check all colored backgrounds. Replace neutral gray secondary text (`text-gray-400`) with text tinted from the surface hue.

2. **Construct a harmonious palette**:
   - Establish one clear primary brand hue, a functional secondary accent, and warm or cool slate neutrals.
   - Tint dark backgrounds with subtle color rather than pure neutral black (#000000).

3. **Ensure full WCAG AA contrast**:
   - Test text luminance against rendered backgrounds. Enforce 4.5:1 for body copy and 3:1 for large display elements.

---

## 7. Animate

Use when transitions feel abrupt, jarring, or, conversely, over-animated and sluggish.

1. **Apply realistic deceleration**:
   - Replace linear transitions and bouncy easings with smooth exponential deceleration curves: `cubic-bezier(0.16, 1, 0.3, 1)` or standard `ease-out`.
   - Keep transition durations between 150ms and 250ms for micro-interactions; never make users wait for menus or tooltips.

2. **Focus motion on state changes**:
   - Animate accordion expansions, modal entrances, and active tab indicator shifts.
   - Avoid infinite decorative animations (such as pulsing dots or autoscrolling marquees) on non-live content.
   - Provide `@media (prefers-reduced-motion: reduce)` fallbacks for all transitions.

---

## 8. Harden

Use to ensure the interface is production-ready, resilient, accessible, and robust.

1. **Cover all component states**:
   - Implement dedicated states for every interactive component: hover, active, focus-visible, loading, disabled, and empty.
   - Ensure form fields display clear, accessible error messages with distinct border contrast and `aria-invalid`.

2. **Prevent layout breakage**:
   - Add `break-words` or text truncation (`truncate`) to dynamic data fields that might contain long strings (such as usernames, emails, or URLs).
   - Provide explicit width, height, or aspect-ratio on all images to eliminate layout shifts (CLS).

3. **Guarantee accessibility and touch targets**:
   - Ensure all touch targets on mobile measure at least 44x44px.
   - Verify all interactive controls have accessible focus rings and semantic labels (`aria-label` on icon-only buttons).
