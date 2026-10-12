## What it does

Evaluates frontend code against usability heuristics and 59 deterministic detector rules. It audits markup, styles, components, and responsive behavior, returning a structured report with prioritized findings from P0 to P3.

The defining constraint is that it never modifies code directly: it produces an objective, actionable diagnosis with file locations, rule identifiers, and suggested code diffs so you can decide how to proceed.

## When to reach for it

You invoke this by typing `/ui-review`, and the agent won't reach for it on its own.

Reach for this when you want an audit of a page, PR, or component to evaluate visual quality, verify accessibility, or check for AI tells before shipping. To actively edit and repair the code, use [ui-polish](https://aihero.dev/skills-ui-review) instead. For general code standards and spec compliance, use [code-review](https://aihero.dev/skills-code-review).

| Task | Skill |
| --- | --- |
| Evaluate UI craft, anti-patterns, and heuristics | [ui-review](https://aihero.dev/skills-ui-review) |
| Fix and refine the UI directly | [ui-polish](https://aihero.dev/skills-ui-polish) |
| Review diff for code standards and spec fidelity | [code-review](https://aihero.dev/skills-code-review) |

## Two-axis evaluation and prioritized findings

The review evaluates interface code across two distinct axes:

1. **Usability heuristics**: Evaluates visual hierarchy, spatial proximity, state completeness (hover, focus, disabled, loading, empty, error), line length constraints, and mobile layout robustness.
2. **Deterministic anti-pattern detection**: Evaluates code against 59 deterministic rules covering slop tells (side-tab borders, nested cards, gradient headlines, overused fonts), color contrast failures, missing focus indicators, and touch target violations.

Findings are organized into four explicit priority tiers:

* **P0 (Blockers)**: Severe usability defects, broken accessibility contrast, missing mobile viewport responsiveness, or stripped focus outlines.
* **P1 (High)**: Obvious AI slop tells, flat typography hierarchy, nested container clutter, or missing empty and error states.
* **P2 (Medium)**: Suboptimal spatial rhythm, uncalibrated line heights, un-themed native browser surfaces, or raw proportional tabular data.
* **P3 (Advisory)**: Minor polish opportunities and micro-interaction recommendations.

## Common questions

**How does ui-review differ from code-review?**
`code-review` reviews code diffs on two axes: repo engineering standards and spec fidelity. `ui-review` focuses strictly on the human-facing interface: visual hierarchy, typography, accessibility, and design anti-patterns.

**Does it require a running local browser?**
No. It statically inspects your component markup, Tailwind classes, CSS stylesheets, and theme tokens, identifying issues through deterministic structural and style analysis.

## It's working if

* Every reported issue cites the exact file path, line number, and rule name.
* Concrete, copy-pasteable code remediations accompany every P0 and P1 finding.
* Running `/ui-polish` against the reported issues clears the findings completely.

## Where it fits

A codebase health inspection tool. Run it during pull request reviews, before deploying new frontend features, or when auditing legacy screens. Explore the whole map at [ask-matt](https://aihero.dev/skills-ask-matt).
