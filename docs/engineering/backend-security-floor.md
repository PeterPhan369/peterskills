## What it does

Defines the security **Quality floor** and anti-pattern defense layer for backend APIs, authentication, authorization, configuration, data boundaries, and cryptography. It keeps core security principles and language-specific sharp edges immediately reachable when building or modifying backend services.

Unlike an advisory checklist you skim after writing code, this skill acts as an active write-time baseline rather than a globally auto-loaded rule set: it is user-invoked so it spends zero global [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) across unrelated repositories, refuses fail-open defaults upfront, and activates per repository when you configure the `backend` Stack profile during [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) (which seeds `docs/agents/quality-floor.md`, compiles `docs/agents/security-rules.md` for your chosen languages, and adds a [context pointer](https://www.aihero.dev/ai-coding-dictionary/context-pointer) from `CLAUDE.md` or `AGENTS.md`).

## When to reach for it

You invoke this by typing `/backend-security-floor`, and the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own unless wired into your repository during setup.

Reach for this when starting backend work, aligning a [session](https://www.aihero.dev/ai-coding-dictionary/session) with your security baseline, or inspecting the refused defaults and language rules active in a backend **Stack profile**. For an adversarial audit of an existing diff or service, use [security-review](https://aihero.dev/skills-security-review) instead. For repository conventions and spec fidelity, use [code-review](https://aihero.dev/skills-code-review).

| Situation | Reach for |
| --- | --- |
| Establishing write-time security defaults and refused patterns | `/backend-security-floor` |
| Auditing an existing branch, PR, or service for exploitable defects | [security-review](https://aihero.dev/skills-security-review) |
| Wiring the active Stack profile and compiling language rules for a repo | [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) |
| Checking general repo conventions and ticket spec compliance | [code-review](https://aihero.dev/skills-code-review) |

## Core principles, pillars, and modular language rules

The floor rests on three design principles:

* **Pit of Success**: Design APIs, schemas, and constructors so secure usage is the path of least resistance and misuse fails to compile or throws at startup.
* **Fail-Secure by Default**: Crash immediately when required secrets, keys, or security toggles are missing or invalid rather than falling back to permissive literals.
* **Deny-by-Default Authorization**: Enforce access control centrally before handler logic runs, bind queries to the authenticated principal, and reject requests unless explicitly allowed.

Those principles govern six security pillars across the language-agnostic detector catalog:

| Pillar | What it blocks |
| --- | --- |
| Secrets and Configuration | Fallback secret literals, fail-open toggles, `0` or `-1` limits, unvalidated constructors |
| Authentication and Sessions | Fast password hashes, bcrypt truncation past 72 bytes, `==` token checks, weak PRNGs |
| Authorization and Access Control | Unscoped IDOR queries, stringly-typed role checks, wildcard CORS with credentials |
| Input Boundaries and Deserialization | SQL string interpolation, `shell=True`, unsafe object deserialization, path traversal, SSRF |
| Cryptography Ergonomics | JWT `alg: none`, caller-chosen ciphers, ECB mode, static nonces, raw swappable byte parameters |
| Error Handling and Observability | Stack trace leaks in HTTP responses, production debug endpoints, swallowed auth exceptions |

Language-specific sharp edges live in 11 separate files (`c-cpp`, `csharp`, `go`, `java`, `javascript-typescript`, `kotlin`, `php`, `python`, `ruby`, `rust`, `swift`) using [progressive disclosure](https://www.aihero.dev/ai-coding-dictionary/progressive-disclosure) so backend sessions stay focused on the target stack.

## Common questions

**Why is it user-invoked instead of loading automatically in every session?**
Keeping domain baselines user-invoked ensures zero global [context](https://www.aihero.dev/ai-coding-dictionary/context) cost in frontend or documentation repositories. In a backend repository, [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) adds a narrow pointer from `CLAUDE.md` or `AGENTS.md` to `docs/agents/quality-floor.md` so backend sessions pick up the active floor without loading unrelated rules elsewhere.

**Do I have to keep all 11 language modules active for one service?**
No. The core catalog stays separate from the 11 language files, and repository setup lets you select only the language or languages your codebase runs.

**How does it differ from security-review?**
`backend-security-floor` defines the write-time standard and refused defaults (`env.get` fallback secrets, non-constant-time checks, unparameterized queries). [security-review](https://aihero.dev/skills-security-review) is an on-demand adversarial audit that inspects diffs or surfaces and filters candidate findings through a five-step refutation gate.

**Does it override our project's existing threat model?**
No. Explicit project security policies, compliance requirements, and validated architecture boundaries always tighten these defaults. The floor stops unguided permissive habits from sneaking in when explicit guidance is absent.

## It's working if

* Running setup with the `backend` Stack profile seeds `docs/agents/quality-floor.md` and compiles `docs/agents/security-rules.md` with only your repository's chosen language modules.
* Missing required signing keys or credentials cause startup to fail cleanly instead of booting with hardcoded fallback strings.
* Verification of tokens, signatures, and HMACs uses constant-time primitives and rejects empty secrets.
* HTTP 500 error handlers log diagnostics server-side with redacted secrets and return generic error payloads with correlation IDs.
* Database queries scope tenant and user records by the authenticated principal while centralized middleware guards protected routes.

## Where it fits

A **reach-for-it-anytime standalone** security baseline and standards layer for the `backend` **Stack profile**. It guides feature work in [implement](https://aihero.dev/skills-implement), informs structural interface hardening in [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture), is configured per repository by [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills), and pairs with [security-review](https://aihero.dev/skills-security-review) before shipping. Explore the whole map at [ask-matt](https://aihero.dev/skills-ask-matt).
