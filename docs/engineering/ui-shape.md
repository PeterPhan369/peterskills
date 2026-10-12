## What it does

Plans, structures, and wireframes user interfaces before writing production frontend code. It resolves visual hierarchy, layout architecture, component boundaries, and interaction states upfront.

The defining constraint is that it designs the structure and component seams without writing implementation code: it produces an actionable specification that guides subsequent implementation and prototyping passes.

## When to reach for it

You invoke this by typing `/ui-shape`, and the agent won't reach for it on its own.

Reach for this when you are starting a new screen, complex view, or dashboard and want to resolve the user experience, information architecture, and component decomposition before writing code. To explore throwaway code variations quickly, use [prototype](https://aihero.dev/skills-prototype) instead. To turn an idea thread into an engineering specification, use [to-spec](https://aihero.dev/skills-to-spec).

| Goal | Skill |
| --- | --- |
| Plan UI hierarchy, layout, and component seams | [ui-shape](https://aihero.dev/skills-ui-shape) |
| Build throwaway code to see UI variations | [prototype](https://aihero.dev/skills-prototype) |
| Turn an idea into an engineering feature spec | [to-spec](https://aihero.dev/skills-to-spec) |

## The 4-step shaping workflow

The skill walks four progressive steps to produce a complete UI specification:

1. **Hierarchy and primary purpose**: Identifies the single primary action of the screen, ranks information into primary, secondary, and tertiary tiers, and establishes domain copy direction.
2. **Layout and viewport mapping**: Outlines the desktop layout structure and details responsive adaptation on mobile screens (what stacks, what collapses, and what defers).
3. **Component boundaries and seams**: Decomposes the view into atomic, reusable components (such as headers, metric cards, and filter bars), defining props and state ownership upfront.
4. **Edge states and error handling**: Details concrete visual specifications for all states: empty state messaging, loading indicators, field validation errors, and disabled control affordances.

## Common questions

**Does ui-shape write React or HTML components?**
No. It outputs an ASCII layout wireframe, component prop boundaries, and state requirements. This keeps thinking fast and prevents premature implementation details from obscuring architectural flaws.

**When should I use ui-shape instead of to-spec?**
Use `to-spec` when planning the full system behavior, API contracts, and engineering slices. Use `ui-shape` when the primary challenge is frontend visual hierarchy, user interface layout, and screen ergonomics.

## It's working if

* The resulting UI specification clearly states the primary user goal and information tiers.
* Component boundaries and state ownership are unambiguous before any code is generated.
* Mobile and desktop layouts are fully resolved, leaving no layout questions during implementation.

## Where it fits

The upfront design stage in the engineering flow. Run it in Step 2 of the main flow alongside [prototype](https://aihero.dev/skills-prototype) when answering what a feature should look like, before merging into [to-spec](https://aihero.dev/skills-to-spec) or [implement](https://aihero.dev/skills-implement). Explore the full map at [ask-matt](https://aihero.dev/skills-ask-matt).
