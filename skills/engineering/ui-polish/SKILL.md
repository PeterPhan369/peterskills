---
name: ui-polish
description: Repair, refine, and perfect frontend UI and styles in an existing project based on user instructions.
disable-model-invocation: true
---

# UI Polish

Repair, refine, and perfect existing website interfaces and styles based on user instructions.

Call this skill when you want to take an existing page, component, or screen and elevate its craft, fix anti-patterns, or apply a specific design direction.

For the directional refinement guides (Bolder, Quieter, Distill, Layout, Typeset, Colorize, Animate, Harden), read [PLAYBOOKS.md](PLAYBOOKS.md).

For the full catalog of detectable anti-patterns, see [DETECTOR-RULES.md](../ui-craft-floor/DETECTOR-RULES.md).

---

## The 3-Step Pipeline

Follow these steps in sequence:

### Step 1: Scope and Inspect

1. **Locate target files**: Read the components, templates, styles, and markup named in the request or surrounding the target view.
2. **Scan for anti-patterns**: Inspect the code against the quality floor in `ui-craft-floor` and the 59 rules in `DETECTOR-RULES.md`:
   - Check color contrast (ensure at least 4.5:1 on text).
   - Check for muddy gray-on-color text, generic AI gradients, or untinted black.
   - Check for nested cards, awkward border accents on rounded containers, and monotonous spacing.
   - Check for overused fonts (Inter, Roboto) and unconstrained reading widths (>75ch).
   - Check missing states (empty, loading, focus rings, mobile flex wrapping).
3. **Preserve existing domain truths**: Do not change copy, product facts, or functional behavior unless the user specifically asked for copy revisions.

### Step 2: Select the Playbook

Identify the directional intent from the user's prompt and consult the corresponding section in [PLAYBOOKS.md](PLAYBOOKS.md):

* **"Make it bolder / more striking"** -> Apply the **Bolder** playbook (dramatic scale contrast, high-confidence color, crisp structural boundaries).
* **"Tone it down / cleaner / less aggressive"** -> Apply the **Quieter** playbook (soften borders, calm competing colors, expand whitespace).
* **"Simplify / remove clutter / too busy"** -> Apply the **Distill** playbook (flatten nested containers, eliminate decorative icons, prune redundant copy).
* **"Fix spacing / alignment / feels off"** -> Apply the **Layout and Rhythm** playbook (consistent 8px spatial grid, heading proximity, responsive auto-fit grids).
* **"Fix fonts / typography hierarchy"** -> Apply the **Typeset** playbook (font selection, line-height 1.55, balanced headings, tabular numbers).
* **"Improve colors / contrast"** -> Apply the **Colorize** playbook (harmonious palette, tint dark grounds, fix gray-on-color).
* **"Smooth out transitions / add motion"** -> Apply the **Animate** playbook (exponential deceleration curves, state-change transitions, reduced-motion fallbacks).
* **"Make it production-ready / fix edge cases"** -> Apply the **Harden** playbook (complete component states, text truncation, touch targets, accessibility).

If the user gives general instructions like "polish this page", apply the **Harden** playbook alongside any specific fixes indicated by your Step 1 inspection.

### Step 3: Execute and Verify in Bounded Passes

1. **Batch your edits**: Make the code changes directly in the target files. Keep edits clean, modular, and idiomatic to the project's styling approach (Tailwind, CSS Modules, styled-components, or plain CSS).
2. **Eliminate introduced anti-patterns**: Confirm that your modifications did not introduce fresh tells (such as accidental nested cards or unstyled focus rings).
3. **Verify against the craft floor**:
   - Verify that body text contrast remains above 4.5:1.
   - Verify that responsive wrapping holds across mobile viewports.
   - Verify that interactive elements retain focus rings and accessible labels.
4. **Finish in at most two passes**: Complete the edits, perform one verification pass, apply any minor corrections, and present the finished diff to the user. Do not enter open-ended aesthetic tweaking loops.

---

## Completion Criteria

The polish pass is complete when:

1. Every specific request in the user's prompt has been addressed in code.
2. All identified anti-patterns from the 59 detector rules have been resolved.
3. Contrast ratios meet or exceed WCAG AA standards.
4. Layout scales cleanly on both mobile and desktop viewports without horizontal overflow.
5. All interactive elements provide clear hover, active, focus, and disabled states.
