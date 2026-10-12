---
name: ui-review
description: Comprehensive UI/UX design review evaluating interface code against usability heuristics and 59 deterministic detector rules.
disable-model-invocation: true
---

# UI Review

Perform an evaluative design and UX review of an existing frontend view, page, or component.

Call this skill to evaluate UI quality, detect anti-patterns, check accessibility, and verify craft standards before shipping.

For the full catalog of rules and anti-patterns, see [DETECTOR-RULES.md](../ui-craft-floor/DETECTOR-RULES.md).

---

## Review Process

Follow these steps when reviewing interface code:

### 1. Scope Target Code

Identify all files contributing to the surface under review:
- JSX, TSX, Vue, Svelte, or HTML markup.
- CSS, Tailwind classes, CSS Modules, or theme configuration files.
- Component state handling and event logic.

### 2. Evaluate Along Two Axes

Examine the code along two independent axes:

* **Axis 1: Usability and Hierarchy**:
  - Does the page have an obvious visual hierarchy where the most important action or message commands attention?
  - Is information grouped logically with clear proximity and breathing room?
  - Are interaction states complete (hover, active, focus, disabled, loading, empty, and error)?
  - Is the reading measure constrained to 55–75 characters per line?
  - Does the layout scale gracefully down to 320px mobile viewports without horizontal scrolling or broken elements?

* **Axis 2: Deterministic Anti-Pattern Detection**:
  - Audit against all 59 rules in `DETECTOR-RULES.md`.
  - Check for AI tells: `side-tab`, `border-accent-on-rounded`, `nested-cards`, `gradient-text`, `ai-color-palette`, `overused-font`, `monotonous-spacing`.
  - Check contrast: verify that body text achieves at least 4.5:1 contrast against its background (`text-contrast`, `gray-on-color`).
  - Check focus management: ensure interactive controls maintain visible focus rings (`missing-focus-ring`).
  - Check touch ergonomics: ensure interactive elements meet minimum 44x44px touch targets (`unreachable-touch-target`).

### 3. Generate the Review Report

Format the report using this structure:

```markdown
# UI Review: <Target Name>

**Summary**: <1-2 sentences summarizing overall visual craft, hierarchy, and shipping readiness.>

## Findings by Priority

### P0 (Blockers: Accessibility, Usability, Layout Breakage)
* **[Rule ID / Issue Name]** in `<file>:<line>`
  * **Problem**: <Clear explanation of what fails>
  * **Remediation**: <Concrete code diff or fix>

### P1 (High: AI Tells, Hierarchy Flaws, Missing States)
* **[Rule ID / Issue Name]** in `<file>:<line>`
  * **Problem**: <Clear explanation>
  * **Remediation**: <Concrete code diff or fix>

### P2 (Medium: Spatial Rhythm, Typography Calibration)
* **[Rule ID / Issue Name]** in `<file>:<line>`
  * **Problem**: <Clear explanation>
  * **Remediation**: <Concrete code diff or fix>

### P3 (Advisory: Micro-polish and Craft Details)
* **[Rule ID / Issue Name]** in `<file>:<line>`
  * **Problem**: <Clear explanation>
  * **Remediation**: <Concrete code diff or fix>

## Verdict

<Ready to ship / Needs polish pass with /ui-polish>
```

---

## Completion Criteria

The review is complete when:

1. All target components and associated styles have been inspected.
2. Both axes (Usability & Heuristics, 59 Detector Rules) have been evaluated exhaustively.
3. Every finding includes the specific file location, the rule ID, and actionable remediation advice.
4. The findings are categorized into clear P0, P1, P2, and P3 priority tiers.
