## What it does

Defines the quality floor and anti-pattern defense layer for frontend interface code. It establishes baseline visual, typographic, contrast, spatial, elevation, interaction, and motion standards alongside 75 detectable AI-pattern refusals.

It is a passive reference baseline rather than an interactive questionnaire or an always-loaded global rule set: the skill is user-invoked so it spends zero global [context](https://www.aihero.dev/ai-coding-dictionary/context) across unrelated repositories, and its baseline is activated per repository when you configure the `frontend` Stack profile during [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills), which seeds `docs/agents/quality-floor.md` and adds a [context pointer](https://www.aihero.dev/ai-coding-dictionary/context-pointer) from `CLAUDE.md` or `AGENTS.md`.

## When to reach for it

You invoke this by typing `/ui-craft-floor`, and the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own.

Reach for this when you want to inspect or apply the baseline visual standards directly, or activate it once per frontend repository by selecting the `frontend` Stack profile in [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills). For targeted audits of existing pages, use [ui-review](https://aihero.dev/skills-ui-review) instead. For active repair and perfection passes, use [ui-polish](https://aihero.dev/skills-ui-polish).

| Situation | Action |
| --- | --- |
| Setting up a frontend repository | Configure the `frontend` Stack profile with [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) to seed `docs/agents/quality-floor.md` |
| Inspecting or applying the baseline directly | Run `/ui-craft-floor` |
| Evaluating an existing page | Use [ui-review](https://aihero.dev/skills-ui-review) |
| Active refactoring and polish | Use [ui-polish](https://aihero.dev/skills-ui-polish) |

## The craft floor and anti-pattern catalog

The craft floor establishes explicit boundaries across six core dimensions:

* **Contrast and color**: Body copy must meet or exceed 4.5:1 contrast against its rendered surface. Dark interfaces must be tinted with subtle palette undertones rather than raw un-tinted black.
* **Typography**: Line length must stay constrained between 55 and 75 characters per line (`max-w-prose`). Large display headings must use fluid scaling (`clamp()`), multiline titles must balance word wraps, and numeric tables must use tabular figures.
* **Spatial rhythm**: Spacing must scale proportionally: tight grouping for related controls (4px to 8px), moderate margins for field groups (16px to 24px), and generous padding between sections (48px to 80px).
* **Depth and shadows**: Shadows must carry an explicit vertical offset and soft diffusion. Zero-offset chromatic glowing halos and heavy opaque shadows are rejected.
* **Interaction completeness**: Every interactive control must provide distinct hover, active, focus-visible, and disabled states. Focus outlines may never be removed without an accessible replacement.
* **Motion**: Transitions must use smooth exponential deceleration (`ease-out`) rather than bouncy curves, animating state changes purposefully.

The skill houses an exhaustive catalog of 75 deterministic detector rules in its reference files, providing concrete definitions and code remediations for recognizable AI tells such as kickers/eyebrows, ghost cards, decorative gridlines, side-tab accent stripes, nested cards, gradient text, and overused typefaces.

## Common questions

**Why is ui-craft-floor user-invoked instead of globally model-invoked?**
A model-invoked skill keeps its description in every [session](https://www.aihero.dev/ai-coding-dictionary/session) across every repository, spending [tokens](https://www.aihero.dev/ai-coding-dictionary/token) and risking UI rules firing in backend services. Keeping it user-invoked eliminates global load while per-repo `frontend` Stack profile activation points frontend repositories at `docs/agents/quality-floor.md` from `CLAUDE.md` or `AGENTS.md`.

**Does the craft floor override my existing design system?**
No. A committed project design system, brand guideline, or explicit brief always takes precedence over the default floor. The craft floor only prevents unguided agents from defaulting to generic AI templates when specific instructions are absent.

**Why does it ban fonts like Inter or Roboto?**
Because [models](https://www.aihero.dev/ai-coding-dictionary/model) default to them on almost every project, producing interfaces that feel generic and indistinguishable. Choosing an intentional typeface rooted in the product's domain immediately elevates craft and character.

## It's working if

* Running setup with the `frontend` Stack profile writes `docs/agents/quality-floor.md` and points to it from `CLAUDE.md` or `AGENTS.md`.
* Frontend components avoid purple-blue gradients, side-tab stripes, and nested cards by default, while non-frontend repositories spend zero context on UI rules.
* Text contrast across light and dark modes passes automated accessibility checks, and headings and reading paragraphs remain legible across mobile viewports.

## Where it fits

A **reach-for-it-anytime standalone** standards layer beneath frontend development. When activated per repository via [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) under the `frontend` Stack profile, its seeded quality floor guides [implement](https://aihero.dev/skills-implement), [ui-shape](https://aihero.dev/skills-ui-shape), [ui-polish](https://aihero.dev/skills-ui-polish), [ui-review](https://aihero.dev/skills-ui-review), and [prototype](https://aihero.dev/skills-prototype). Explore the whole map at [ask-matt](https://aihero.dev/skills-ask-matt).
