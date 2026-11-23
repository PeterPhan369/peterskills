# Quality Floor: Frontend

Active **Stack profile**: `frontend`. Enforce these baseline UI craft standards when writing, editing, or reviewing frontend interfaces. A committed design system or explicit brief overrides defaults here; habit does not.

## Core Principles

- **Distinct identity**: Give interfaces intentional domain personality; avoid generic B2B SaaS templates.
- **Bounded verification**: Check desktop and mobile viewports together in bounded passes, fix defects in one batch, and confirm.
- **Elevate browser surfaces**: Theme text selection, focus rings, scrollbars, and carets deliberately.

## The Quality Floor

1. **Contrast and Color**: Body and input copy >= 4.5:1 contrast; large display headings >= 3:1. Tint dark surfaces with palette hue instead of raw `#000000`, and tint secondary text on colored surfaces from the surface or foreground hue.
2. **Typography**: Constrain body line length to 55 to 75 characters (`max-w-prose`). Scale major display headings with `clamp()`, use `text-wrap: balance` on multiline headings, apply `tabular-nums` on counters and tables, and keep negative letter-spacing at `-0.04em` or looser.
3. **Spatial Rhythm**: Space related controls tightly (4px to 8px), field groups moderately (16px to 24px), and sections generously (48px to 80px). Give headings more space above than below.
4. **Depth and Elevation**: Commit to either a border or a soft Y-offset shadow, never both. Separate layered surfaces (sticky bars, modals, popovers) with distinct tone, border, or elevation.
5. **Interaction and States**: Provide distinct hover, active, `focus-visible`, and disabled states on every interactive control; keep visible focus rings. Size mobile touch targets at least 44x44px with 8px gaps, and disable async submit buttons with loading feedback.
6. **Motion**: Use smooth `ease-out` deceleration for state changes and entrances; avoid bouncy curves or uniform scroll-fades on every section.

## Defaults to Refuse

Reject these AI templates unless explicitly requested in the project brief:

- **Kickers and eyebrows above headings** (absolute ban; let the heading stand alone)
- **Ghost cards** (1px border combined with a diffuse shadow)
- **Decorative grid lines, fake sketch SVGs, or hard zero-blur block shadows** (outside true blueprint or neobrutalist briefs)
- **Identical three-column feature card grids, 3px to 5px card side-tab stripes, and nested wrapper cards**
- **Gradient headline text, hero metric card stacks, AI purple/violet themes, and decorative `01`/`02` section numbers**
- **Reflexive modals, negative tracking tighter than `-0.04em`, and raw emoji/unicode glyphs as UI icons**

## Deeper Checks

- Ask the user to run `/ui-craft-floor` to inspect the full 75-rule detector catalog.
- Suggest `/ui-review`, `/ui-polish`, or `/ui-shape` for dedicated interface audits, polish passes, or layout planning.
