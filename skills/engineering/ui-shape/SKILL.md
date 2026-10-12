---
name: ui-shape
description: Plan, structure, and wireframe UX/UI layouts, component boundaries, and states before writing production frontend code.
disable-model-invocation: true
---

# UI Shape

Plan and structure user interfaces before writing production code.

Call this skill when starting a new screen, dashboard, view, or complex component to resolve information hierarchy, responsive layouts, component seams, and edge states early.

For the quality standards to establish during planning, see [ui-craft-floor](../ui-craft-floor/SKILL.md).

---

## The 4-Step Shaping Process

Follow these steps to shape a clean interface specification:

### 1. Define Primary Hierarchy and Purpose

1. **The single primary action**: Identify the one thing the user came to this view to accomplish.
2. **Information ranking**: Sort information into primary (must see immediately), secondary (needed to make a decision), and tertiary (reference or background).
3. **Copy direction**: Draft clear, plain-language headings and button action verbs that reflect authentic domain language.

### 2. Map Layout and Viewports

1. **Desktop architecture**: Define the high-level layout structure (such as split pane, side navigation with fluid canvas, or stacked feed).
2. **Mobile adaptation**: Define how the layout reorganizes on narrow viewports:
   - What stacks vertically?
   - What collapses into tabs, drawers, or accordion panels?
   - What tertiary data is hidden or deferred on mobile?
3. **Spatial grouping**: Establish clean spacing zones. Keep related controls tightly grouped; provide generous white space between major task sections.

### 3. Establish Component Boundaries and Seams

1. **Identify atomic components**: Break the view into focused, reusable pieces (for example: `PageHeader`, `MetricCard`, `DataTable`, `FilterBar`, `ActionPanel`).
2. **Assign state ownership**: Decide where data lives (URL search params, parent container state, local component state, or global store).
3. **Define component props**: Draft the interface signature for each component seam before writing implementation details.

### 4. Detail Edge Cases and States

Define explicit visual specifications for every state:
* **Empty state**: What does the user see when there are zero items? Provide contextual copy and an onboarding action.
* **Loading state**: Skeleton layout or inline spinner during data fetching.
* **Error state**: Inline field validation and global error banners with actionable recovery steps.
* **Partial or extreme data**: Handling single-item lists, long customer names, high-digit financial numbers, and multiline text wraps.

---

## Output Format

Present the shaped specification as a structured UI brief:

```markdown
# UI Specification: <Feature or View Name>

## 1. Purpose and Primary Goal
<Core user goal and primary action>

## 2. Information Hierarchy
* **Primary**: <List essential elements>
* **Secondary**: <List supporting elements>
* **Tertiary**: <List background/ancillary details>

## 3. Layout Structure
* **Desktop (1024px+)**: <Layout description and ASCII wireframe>
* **Mobile (<768px)**: <Adaptive stacking and responsive behavior>

## 4. Component Seams
* `<ComponentName>`: <Responsibility, inputs, outputs>

## 5. Required States
* **Empty**: <Empty state behavior>
* **Loading**: <Skeleton or spinner specification>
* **Error**: <Failure presentation and recovery>
* **Disabled**: <Affordance for disabled controls>

## 6. Design System Alignment
* **Type scale**: <Headings, body, and metric font sizes>
* **Palette**: <Primary, surface, and status colors>
```

---

## Completion Criteria

The shaping pass is complete when:

1. The primary user action and information hierarchy are explicitly defined.
2. Responsive composition across both desktop and mobile viewports is specified.
3. Component boundaries, props, and state owners are identified.
4. All component states (empty, loading, error, disabled) have concrete visual specifications.
5. The resulting plan is ready to hand off to implementation or prototyping.
