# Ship frontend and backend skills on `main` as user-invoked skills, and activate the chosen Stack profile via `/setup-matt-pocock-skills`

Repositories using these skills are typically either `frontend`-heavy or `backend`-heavy. Loading frontend UI rules in a backend service (or backend security rules in a frontend app) wastes context tokens and risks irrelevant guidance. We considered splitting the repository into `frontend` and `backend` git branches, or keeping both `ui-craft-floor` and `backend-security-floor` globally model-invoked.

## Decision

- Keep all skills on the single `main` branch so managed plugin marketplaces (`.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json`) and shared engineering skills (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `tdd`, `code-review`, `improve-codebase-architecture`, `ask-matt`, etc.) have a single source of truth.
- Mark all domain-specific skills (`ui-craft-floor`, `ui-review`, `ui-polish`, `ui-shape`, `backend-security-floor`, `security-review`) as **user-invoked** (`disable-model-invocation: true` in `SKILL.md` and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`). This guarantees **zero global context load** and prevents the model from ever auto-invoking the inactive domain's skills, even when the full plugin is installed globally.
- Add a **Stack profile** step (`frontend` or `backend`) to `/setup-matt-pocock-skills`:
  - It seeds `docs/agents/quality-floor.md` in the target repository with only the chosen profile's **Quality floor** and writes a context pointer under `## Agent skills` in `CLAUDE.md` / `AGENTS.md`.
  - For `backend` repositories, `/setup-matt-pocock-skills` asks which language(s) the project uses (from the 11 supported languages under `skills/engineering/backend-security-floor/lang/`), compiles only the language-agnostic core rules plus the chosen language rules into `docs/agents/security-rules.md`, and prunes unused language files.
  - When skills were installed locally into the target repository via `npx skills@latest add`, `/setup-matt-pocock-skills` deletes the unselected Stack profile's local skill folders from `.claude/skills/` and `.agents/skills/`.

## Considered Options

- **Separate `frontend` and `backend` git branches**: Rejected because plugin marketplaces (`Claude Code`, `Codex`, `Copilot`, `VS Code`) resolve the default branch (`main`), and maintaining 27+ shared skills across three branches creates permanent merge and release overhead.
- **Globally model-invoked `ui-craft-floor` and `backend-security-floor`**: Rejected because model-invoked descriptions remain loaded in the system prompt on every turn in global plugin installs and could still be triggered by the model in the wrong project type.
- **Inlining the full Quality floor directly into `CLAUDE.md` / `AGENTS.md`**: Rejected per `writing-for-agents` progressive disclosure rules, as inlining 80 to 150 lines into `CLAUDE.md` / `AGENTS.md` pays context tokens on every turn even during planning or git operations.
