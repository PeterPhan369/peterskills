## What it does

`setup-matt-pocock-skills` configures four parts of one repo: where issues live, what the triage labels are called, where the domain docs sit, and which **Stack profile** (`frontend` or `backend`) sets its **Quality floor**. It records the answers as markdown files under `docs/agents/` and wires a [context pointer](https://www.aihero.dev/ai-coding-dictionary/context-pointer) in `CLAUDE.md` or `AGENTS.md`.

Those files are the only thing that varies between repos. The skills themselves are identical everywhere. They read `docs/agents/issue-tracker.md` and `docs/agents/quality-floor.md` at run time and do what they say. That is why the set is not tied to GitHub or one tech stack, and why you never edit a skill file to point it at another tracker or domain. Invoking it with "link the skills to a custom issue tracker" works with anything you can connect to programmatically, with no changes to the skills.

It is a prompt-driven skill, not a deterministic script. It reads your `git remote`, `CLAUDE.md`, `GLOSSARY.md`, and root manifest filenames, proposes what it found, and waits for you to confirm before it writes anything.

## When to reach for it

You invoke this by typing `/setup-matt-pocock-skills`; the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own. Its metadata marks it non-invokable on purpose, so no other skill can fire it for you.

Reach for it once per repo, before the first use of any other engineering skill. If [triage](https://aihero.dev/skills-triage), [to-spec](https://aihero.dev/skills-to-spec), [to-tickets](https://aihero.dev/skills-to-tickets) or [wayfinder](https://aihero.dev/skills-wayfinder) start guessing where your issues go, or apply labels your tracker doesn't have, this repo has not been set up yet. You can run it in a repo halfway through a project. The skill reads what is already there, so no earlier work is lost.

## Prerequisites

It writes into the repo you run it in:

| It writes | Where |
| --- | --- |
| `issue-tracker.md` | `docs/agents/` |
| `domain.md` | `docs/agents/` |
| `triage-labels.md` | `docs/agents/`, only when the `triage` skill is installed |
| `quality-floor.md` | `docs/agents/`, seeded from your chosen `frontend` or `backend` **Stack profile** |
| `security-rules.md` | `docs/agents/`, compiled for `backend` repos from core rules plus your confirmed language packs |
| An `## Agent skills` block | whichever of `CLAUDE.md` or `AGENTS.md` already exists |

You commit all of it as markdown. There is no user-level or global mode. The config lives in the repo, so every repo gets its own copy. If skills were installed locally inside the repo under `.claude/skills/` or `.agents/skills/`, setup also removes unselected domain skill folders and unselected backend language files.

## The four decisions

It starts each section with the recommended answer, and skips any question its exploration already settled. Most runs need two or three confirmations.

| Decision | What it proposes | When it asks |
| --- | --- | --- |
| **Issue tracker** | the one matching your `git remote` | always, because this is the one real choice |
| **Triage labels** | keep the five canonical names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) | only if the `triage` skill is installed |
| **Domain docs** | single-context: one `GLOSSARY.md` plus `docs/adr/` at the root | only if it spots monorepo signals, and then it offers a multi-context `GLOSSARY-MAP.md` |
| **Stack profile** | `frontend` or `backend` (plus detected backend languages) from root manifest filenames | always, to confirm `frontend` or `backend` and your target languages |

The tracker options:

| Option | Where issues live | Needs |
| --- | --- | --- |
| **GitHub** | the repo's GitHub Issues | the `gh` CLI |
| **GitLab** | the repo's GitLab Issues | the `glab` CLI |
| **Local markdown** | files under `.scratch/<feature>/` in this repo | nothing, not even a remote |
| **Other** | wherever you say | one paragraph from you describing the workflow |

The first three ship as templates in the skill and work out of the box. Local markdown is a full option, not a fallback. The skill supports a solo project with no remote. One caveat: don't use local markdown if you use GitHub. They are alternatives, so pick one.

"Other" is a full option too. It is how Jira, Linear, Azure DevOps and Beads all work. You describe the workflow, the skill records your prose in `docs/agents/issue-tracker.md`, and the downstream skills follow the prose. Users have already built this: a Jira-over-[MCP](https://www.aihero.dev/ai-coding-dictionary/mcp) variant, a Gitea CLI shaped like `gh`, a hand-built local dashboard.

The **Stack profile** options:

| Profile | What setup writes | Local skill pruning (when `.claude/skills/` or `.agents/skills/` exists) |
| --- | --- | --- |
| **`frontend`** | Seeds `docs/agents/quality-floor.md` with the UI craft **Quality floor** and points `### Quality floor` at it | Deletes `backend-security-floor` and `security-review` from local skill folders |
| **`backend`** | Seeds `docs/agents/quality-floor.md` with the security **Quality floor** and compiles `docs/agents/security-rules.md` from core rules plus only your confirmed languages out of 11 packs | Deletes `ui-craft-floor`, `ui-review`, `ui-polish`, `ui-shape`, and unselected `lang/*.md` files from local skill folders |

## Common questions

**Do I have to use GitHub?**

No. GitHub, GitLab and local markdown under `.scratch/` all ship as ready-made templates, and anything else works through the "other" path. This is the most-repeated question, in roughly these words: *"hard locked to github"*, *"can I use GitLab / Jira"*, *"what about Azure DevOps"*. The answer is always the same: setup chooses the tracker, not the skill.

**Do I need to re-run it after updating the skills?**

The direct answer after v1.1 was yes. The skill's own closing message is softer. It tells you to re-run only to switch trackers or start over. Both are defensible. The seed templates change between versions, so a `docs/agents/issue-tracker.md` from an older release can go out of date against the skills that now read it. If a downstream skill does something different from what the docs describe, re-run setup. It is cheap.

**It wrote to `CLAUDE.md`, but I'm on Codex.**

This is a known gap, and still open. The file-selection rule is "edit `CLAUDE.md` if it exists, else `AGENTS.md`". It checks which file exists, not which [harness](https://www.aihero.dev/ai-coding-dictionary/harness) is running. In a repo with a `CLAUDE.md` left over from Claude Code, the skill writes its `## Agent skills` block to a file Codex never reads. Users have two workarounds: move the block to `AGENTS.md` by hand, or keep `AGENTS.md` canonical and make `CLAUDE.md` a one-line pointer at it. If neither file exists, the skill asks you which to create instead of picking one. This has confused people who expected it to decide.

**It didn't create my triage labels.**

It doesn't. `docs/agents/triage-labels.md` is a *mapping*: it tells `/triage` which strings in your tracker correspond to the five canonical roles. It does not run `gh label create`. On a fresh GitHub repo the labels do not exist yet, and users have filed this as a bug more than once. Two consequences:

- If your tracker already uses the canonical names, the mapping is an identity table and there is nothing to configure. That is the intended common case, not a missing step.
- This skill does not create [wayfinder](https://aihero.dev/skills-wayfinder)'s `wayfinder:map` and `wayfinder:<type>` labels either, and `gh issue create --label <missing>` fails instead of creating the label. Create them by hand before the first wayfinder run on a GitHub repo.

**Can I configure the other skills' behaviour here ([grilling](https://www.aihero.dev/ai-coding-dictionary/grilling) cadence, question format, tone)?**

No. It configures four things: tracker, labels, doc layout, and Stack profile. Users have asked to make it the place for per-user preferences. The answer is that skills stay opinionated and take no per-user config. Preferences belong in your `CLAUDE.md` as plain instructions, which every skill already reads.

**Can I keep the config in `~/.claude` instead of committing it to every repo?**

Not today. A user who runs the skills across many repos has an open request for this, but no user-level mode exists. Every repo carries its own `docs/agents/`.

**Isn't it strange to have a skill that configures the other skills?**

One long-standing complaint says yes, in these words: *"having a skill to set up the other skill does not feel right to me: that means the LLM is configuring its own skills."* The trade-off is real. Without a setup step, every skill that touches issues would need its own copy of the tracker instructions. The output is markdown you can read and edit, and that limits the risk. You can read every file it wrote and change it by hand. Make day-to-day changes that way, not with another run.

## It's working if

- `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/quality-floor.md` exist, plus `triage-labels.md` if `triage` is installed and `security-rules.md` if you selected `backend`.
- An `## Agent skills` section appears in the instruction file your harness reads, with a one-line summary pointing at each of those files (including `### Quality floor`).
- The tracker it proposed matches the remote you use, and the label strings match labels that exist in your tracker.
- Afterwards, `/to-tickets` publishes without asking you where issues live, and `/triage` applies labels rather than inventing them.
- No remaining skill's `SKILL.md` was edited. If local skill directories existed under `.claude/skills/` or `.agents/skills/`, only unselected domain skill folders and unselected `lang/*.md` files were removed.

## Where it fits

`setup-matt-pocock-skills` is the **run-once setup** for the engineering flow, the precondition everything else assumes rather than a step in the chain. Its neighbours are its readers: [triage](https://aihero.dev/skills-triage), which applies the label vocabulary written here; [to-spec](https://aihero.dev/skills-to-spec) and [to-tickets](https://aihero.dev/skills-to-tickets), which publish into the tracker named here; and [wayfinder](https://aihero.dev/skills-wayfinder), which reads the "Wayfinding operations" section of the same tracker file to learn how to store maps and child [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket). Its **Stack profile** choice seeds the active **Quality floor** aligned with [ui-craft-floor](https://aihero.dev/skills-ui-craft-floor) or [backend-security-floor](https://aihero.dev/skills-backend-security-floor) for [implement](https://aihero.dev/skills-implement), [code-review](https://aihero.dev/skills-code-review), [security-review](https://aihero.dev/skills-security-review), and [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture). [domain-modeling](https://aihero.dev/skills-domain-modeling) later fills in the domain-doc layout that setup records. It creates `GLOSSARY.md` and ADRs only when you resolve a term or decision, so a repo with no domain docs after setup is normal. For which skill to reach for next, [ask-matt](https://aihero.dev/skills-ask-matt) routes the whole set.
