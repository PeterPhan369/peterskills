---
name: ui-craft-floor
description: Shared standards and quality floor for frontend UI/UX design. Use whenever the agent writes, designs, prototypes, or modifies frontend UI, components, styles, or layouts. Prevents AI slop patterns, enforces accessibility and contrast, and maintains production craft.
---

# UI Craft Floor

The minimum quality floor for all frontend interface work. When writing, editing, or prototyping frontend markup and styles, enforce these standards by default.

A committed design system or project brief overrides defaults here; habit does not.

For the exhaustive catalog of all 59 detectable anti-patterns, read [DETECTOR-RULES.md](DETECTOR-RULES.md).

## Core Principles

- **Distinct identity**: Build interfaces with intentional domain personality. Avoid converging on generic B2B SaaS templates.
- **Bounded verification**: Inspect code in bounded passes rather than endless aesthetic tweaks. Check desktop and mobile viewports together, resolve defects in one batch, confirm, and finish.
- **Elevate browser surfaces**: Theme the subtle surfaces models skip by default (text selection, focus rings, scrollbars, and carets).

## The Quality Floor

Verify these properties on all generated or modified UI:

1. **Contrast & Color**:
   - Body and input copy must achieve at least 4.5:1 contrast against their rendered ground. Large display headings must achieve at least 3:1.
   - Tint dark themes with subtle palette hue (such as warm charcoal, cool slate, or deep olive) rather than raw #000000.
   - On colored surfaces, tint secondary text from the background hue or the foreground; never drop neutral gray on chromatic grounds.

2. **Typography**:
   - Limit reading measure to 55–75 characters per line on body copy (`max-w-prose` or `max-width: 65ch`).
   - Use fluid typography with `clamp()` for major display headings, ensuring titles scale gracefully down to mobile screens.
   - Use `text-wrap: balance` on multiline headings to prevent orphaned words.
   - Apply `tabular-nums` (`font-variant-numeric: tabular-nums`) on financial figures, counters, and table data.

3. **Spatial Rhythm**:
   - Group closely related items tightly (4px to 8px), separate field groups moderately (16px to 24px), and separate distinct sections generously (48px to 80px).
   - Ensure headings carry more whitespace above them than below them so visual ownership of the following content is immediate.

4. **Depth & Elevation**:
   - Give shadows directional purpose with a clear Y-offset and soft diffusion. Avoid zero-offset colored halos or heavy opaque black shadows.
   - Separate layered surfaces (such as sticky bars, modals, and popovers) with distinct background tones, subtle borders, or elevation.

5. **Interaction & States**:
   - Every interactive control must provide distinct states: hover, active, focus-visible, and disabled.
   - Preserve visible focus rings: never strip `outline` without providing an accessible `focus-visible` replacement.
   - Touch targets must measure at least 44x44px on mobile devices, with at least 8px spacing between targets.
   - Asynchronous action buttons must indicate loading states, disable during transit, and prevent double submission.

6. **Motion**:
   - Use smooth exponential deceleration (`ease-out`, or cubic-bezier quart/quint) for UI transitions. Avoid bouncy or elastic curves.
   - Animate state changes and modal entrances with purpose; avoid applying uniform scroll-fade transitions to every section down the page.

## Defaults to Refuse

Unless the user explicitly asks for them in their brief, reject these default AI templates:

- **The identical-card grid**: Do not build the whole page out of identical 3-column feature cards with rounded-square icon tiles above every heading.
- **The side-accent tell**: Do not add thick 4px colored accent stripes to the side of cards.
- **Gradient text on headlines**: Keep headline copy solid and crisp.
- **Nested containers**: Flatten unnecessary wrapper cards. Let spacing and dividers organize the content.
- **The hero metric stack**: Avoid generic rows of big numbers with small labels floating in isolated boxes. Integrate proof points into context.
- **AI purple/violet themes**: Choose domain-specific colors rather than default violet-to-pink gradients.
