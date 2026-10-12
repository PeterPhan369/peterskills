## What it does

Repairs, refines, and perfects existing user interfaces based on user instructions. Given a target component or page, it inspects current styles, eliminates detected anti-patterns, and applies directional styling improvements.

The defining constraint is that it operates in bounded, batched passes rather than open-ended iterative loops: it diagnoses the surface once, applies the chosen directional playbook in one coordinated batch, verifies against the craft floor, and finishes.

## When to reach for it

You invoke this by typing `/ui-polish`, and the agent won't reach for it on its own.

Reach for this when you have an existing page, screen, or component that feels unpolished, cluttered, timid, or broken on mobile, and you want the agent to elevate its visual craft. For an evaluative report without code changes, use [ui-review](https://aihero.dev/skills-ui-review) instead. For initial planning before writing code, use [ui-shape](https://aihero.dev/skills-ui-shape).

| Goal | Skill |
| --- | --- |
| Refine, repair, or perfect existing UI | [ui-polish](https://aihero.dev/skills-ui-polish) |
| Audit and score an interface without editing | [ui-review](https://aihero.dev/skills-ui-review) |
| Plan structure and component seams before coding | [ui-shape](https://aihero.dev/skills-ui-shape) |

## The directional playbooks

The skill matches your prompt against eight targeted directional playbooks:

* **Bolder**: Amplifies visual hierarchy by increasing display typographic scale, committing to high-confidence brand colors, and sharpening structural boundaries.
* **Quieter**: Softens aggressive borders, calms competing saturated colors, and introduces generous breathing room to chaotic layouts.
* **Distill**: Flattens nested card wrappers, strips decorative clutter, and trims redundant copy down to core utility.
* **Layout and Rhythm**: Aligns spacing to an explicit 8px spatial grid, corrects heading proximity, and introduces adaptive CSS grid composition.
* **Typeset**: Replaces overused typefaces, calibrates body line-height and measure, enables balanced heading wraps, and adds tabular numerals.
* **Colorize**: Replaces muddy gray text with tinted surface hues, ensures WCAG AA contrast compliance, and introduces purposeful accents.
* **Animate**: Replaces bouncy or sluggish motion with smooth exponential deceleration curves and provides reduced-motion fallbacks.
* **Harden**: Implements complete component states (hover, active, focus, loading, disabled, empty, error), ensures responsive text wrap, and guarantees accessible mobile touch targets.

## Common questions

**Will ui-polish rewrite my application logic or copy?**
No. The skill preserves existing functionality, data models, and domain copy unless you explicitly instruct it to revise the text. Its focus is visual hierarchy, styling architecture, and accessibility.

**What happens if I give a generic prompt like "polish this page"?**
When no specific direction is requested, the skill runs its inspection pass against the 59 detector rules, resolves all detected anti-patterns, and applies the Harden playbook to ensure complete interaction states and responsive robustness.

## It's working if

* The target view resolves its visual flaws within one or two clean code edits.
* Detected anti-patterns like nested cards or low-contrast gray text disappear from the diff.
* The interface remains fully functional, legible, and responsive across mobile viewports.

## Where it fits

A key finishing step in the engineering flow. Run it after [implement](https://aihero.dev/skills-implement) produces a functional frontend feature and before running [code-review](https://aihero.dev/skills-code-review), or reach for it anytime as a standalone tool to repair existing website screens. Explore the full workflow map at [ask-matt](https://aihero.dev/skills-ask-matt).
