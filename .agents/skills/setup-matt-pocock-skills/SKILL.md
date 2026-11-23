---
name: setup-matt-pocock-skills
description: "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, domain doc layout, and Stack profile quality floor. Run once before first use of the other engineering skills."
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker**: where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels**: the strings used for the five canonical triage roles
- **Domain docs**: where `GLOSSARY.md` and ADRs live, and the consumer rules for reading them
- **Stack profile**: `frontend` or `backend`, seeding `docs/agents/quality-floor.md` (and compiled `docs/agents/security-rules.md` for `backend`)

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config`: is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root: does either exist? Is there already an `## Agent skills` section in either?
- `GLOSSARY.md` and `GLOSSARY-MAP.md` at the repo root, and the legacy `CONTEXT.md` / `CONTEXT-MAP.md`. If a legacy file exists, offer to `git mv` it to its `GLOSSARY` name and rewrite those names in `docs/agents/domain.md`.
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/`: does this skill's prior output (`issue-tracker.md`, `domain.md`, `quality-floor.md`, `security-rules.md`) already exist?
- `.scratch/`: a sign that a local-markdown issue tracker convention is already in use
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
- Monorepo signals: a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. These are present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.
- **Stack profile** signals from root manifest filenames (inspect filenames and top-level layout first at near-zero token cost; only check `package.json` dependencies or `build.gradle*` if needed to disambiguate):
  - `frontend` signals: `next.config.*`, `vite.config.*`, `astro.config.*`, `svelte.config.*`, `nuxt.config.*`, `remix.config.*`, `angular.json`, `tailwind.config.*`, or `package.json` with frontend UI frameworks (`react`, `vue`, `svelte`, `solid-js`, `next`, `@angular/core`) and no server framework.
  - `backend` signals across the 11 supported languages:
    - `c-cpp` (C / C++): `CMakeLists.txt`, `Makefile`, `meson.build`, `conanfile.txt`, `conanfile.py`, `vcpkg.json`
    - `csharp` (C# / .NET): `*.csproj`, `*.sln`, `*.slnx`, `global.json`, `Directory.Build.props`
    - `go` (Go): `go.mod`, `go.sum`
    - `java` (Java): `pom.xml`, `build.gradle`, `settings.gradle`
    - `javascript-typescript` (JavaScript / TypeScript): `package.json`, `tsconfig.json`, `deno.json`, `bun.lock`, `bun.lockb` paired with server/API entrypoints or backend frameworks
    - `kotlin` (Kotlin): `build.gradle.kts`, `settings.gradle.kts`, or Kotlin sources (`src/**/*.kt`)
    - `php` (PHP): `composer.json`, `composer.lock`, `artisan`
    - `python` (Python): `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `poetry.lock`, `uv.lock`
    - `ruby` (Ruby): `Gemfile`, `Gemfile.lock`, `Rakefile`, `config.ru`
    - `rust` (Rust): `Cargo.toml`, `Cargo.lock`
    - `swift` (Swift): `Package.swift`, `*.xcodeproj`, `*.xcworkspace`
- Local skill directories in the target repo: check whether `.claude/skills/` or `.agents/skills/` exists inside this repository, and note the installed `backend-security-floor` directory path alongside this skill for reading `SECURITY-RULES.md` and `lang/*.md`.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order. One section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo; always confirm Section D).

**Section A: Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, and `to-spec` read from and write to it. They need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub**: issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab**: issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown**: issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.): ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off**. Leave it off and don't raise it: a user who wants external PRs in the triage queue can flip the flag in the file later.

A GitHub or GitLab tracker needs a reachable repo. When the user picks one and no `git remote` points at that host, get the repo URL from them and wire it up (`git init` if needed, `git remote add origin <url>`) before going further. Done when `gh repo view` / `glab repo view` prints the project from inside this directory; if it can't, stop and tell the user what's missing.

**Section B: Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you), since an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no, usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`), collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section C: Domain docs.** Default to **single-context** (one `GLOSSARY.md` + `docs/adr/` at the repo root). This fits almost every repo; write it without asking.

Offer **multi-context** (a root `GLOSSARY-MAP.md` pointing to per-context `GLOSSARY.md` files) only when exploration found monorepo signals. Then confirm which layout they want.

**Section D: Stack profile.**

> Explainer: A **Stack profile** (`frontend` or `backend`) picks the single **Quality floor** seeded into `docs/agents/quality-floor.md` and pointed to from your instruction file, so sessions never spend context on the opposite domain.

Lead with the recommended profile from Step 1 (`frontend` or `backend`) and confirm:

- `frontend`: seeds the frontend UI craft **Quality floor** into `docs/agents/quality-floor.md`.
- `backend`: seeds the backend security **Quality floor** into `docs/agents/quality-floor.md` and compiles `docs/agents/security-rules.md` for your target language(s).

When `backend` is selected, present the language(s) detected in Step 1 and ask the user to confirm or adjust which of the 11 supported language packs enumerated in Step 1 apply.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (including `### Quality floor`; see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/agents/triage-labels.md` (when `triage` is installed), `docs/agents/quality-floor.md`, and `docs/agents/security-rules.md` (when `backend` is selected)
- If `.claude/skills/` or `.agents/skills/` exists inside the target repo, the list of unselected domain skill folders and unselected `lang/*.md` files queued for local pruning

Let them edit before writing.

### 4. Write

**Pick the file to edit:**

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create; don't pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa); always edit the one that's already there.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout: "single-context" or "multi-context"]. See `docs/agents/domain.md`.

### Quality floor

[one-line summary: "`frontend` UI craft floor" or "`backend` security floor (<confirmed languages>)"]. See `docs/agents/quality-floor.md`[ and `docs/agents/security-rules.md` for `backend`].
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.

In `### Quality floor`, point to `docs/agents/quality-floor.md`, and add `and \`docs/agents/security-rules.md\`` when `backend` is selected (omit `security-rules.md` for `frontend`).

When Section B ran on GitHub or GitLab, create each configured label the tracker lacks (`gh label create` / `glab label create`).

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md): GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md): GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md): local-markdown issue tracker
- [triage-labels.md](./triage-labels.md): label mapping (only if `triage` is installed)
- [domain.md](./domain.md): domain doc consumer rules + layout
- [quality-floor-frontend.md](./quality-floor-frontend.md): frontend Quality floor written to `docs/agents/quality-floor.md` (when `frontend` is selected)
- [quality-floor-backend.md](./quality-floor-backend.md): backend Quality floor written to `docs/agents/quality-floor.md` (when `backend` is selected)

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

**Compile `docs/agents/security-rules.md` (`backend` only):**

- Read `backend-security-floor/SECURITY-RULES.md` and ONLY the user's confirmed `lang/<lang>.md` pack(s) directly as plain files from the installed `backend-security-floor` folder alongside this skill.
- Combine the core rules from `SECURITY-RULES.md` with ONLY the confirmed `lang/<lang>.md` pack(s) into `docs/agents/security-rules.md`. Exclude all unselected language packs.

**Prune local skill directories (only when `.claude/skills/` or `.agents/skills/` exists inside the target repo):**

- Scope deletion strictly to local `.claude/skills/` and `.agents/skills/` directories inside the target repo; never delete files from global user directories (`~/.claude/skills/`, `~/.agents/skills/`) or plugin caches.
- When `backend` is selected: delete the unselected frontend skill folders (`ui-craft-floor`, `ui-review`, `ui-polish`, `ui-shape`) from any local `.claude/skills/` or `.agents/skills/` directory, and inside any local `backend-security-floor/lang/` directory delete every unselected `lang/*.md` file so only confirmed language packs remain.
- When `frontend` is selected: delete the unselected backend skill folders (`backend-security-floor`, `security-review`) from any local `.claude/skills/` or `.agents/skills/` directory.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files (including the active **Quality floor**). Mention they can edit `docs/agents/*.md` directly later; re-running this skill is only necessary if they want to switch issue trackers, change **Stack profile** or languages, or restart from scratch.
