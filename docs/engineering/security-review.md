## What it does

Audits backend code diffs, services, and configuration surfaces against fail-secure defaults and language sharp edges, producing a prioritized `P0` through `P3` security report with exploit traces and remediation diffs.

Unlike a pattern scanner that floods you with unverified matches or edits files autonomously, `security-review` starts with every candidate **refuted by default**, requires it to survive a five-step verification gate, and never modifies code directly.

## When to reach for it

You invoke this by typing `/security-review`, and the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own.

Reach for this when auditing a backend branch or pull request for security regressions, or sweeping an existing service for fail-open defaults and API footguns. To establish write-time security standards upfront, use [backend-security-floor](https://aihero.dev/skills-backend-security-floor) instead. For general repository conventions and [spec](https://www.aihero.dev/ai-coding-dictionary/spec) compliance, use [code-review](https://aihero.dev/skills-code-review).

| Situation | Reach for |
| --- | --- |
| Auditing a branch or PR for security regressions and blast radius | `/security-review` (Diff Mode) |
| Sweeping an existing service, module, or config surface | `/security-review` (Surface Mode) |
| Establishing write-time security defaults and refused patterns | [backend-security-floor](https://aihero.dev/skills-backend-security-floor) |
| Checking general code standards and spec compliance | [code-review](https://aihero.dev/skills-code-review) |
| Refactoring shallow security seams into safer module interfaces | [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) |
| Auditing frontend usability heuristics and UI anti-patterns | [ui-review](https://aihero.dev/skills-ui-review) |

## Diff Mode and Surface Mode

| Mode | Trigger target | What it inspects |
| --- | --- | --- |
| **Diff Mode** | A git branch, commit, or PR ref | Risk-scores modified files, runs `git blame` and `git log -S` on removed checks to catch regressions, quantifies caller **blast radius**, and elevates untested security changes |
| **Surface Mode** | A directory, module, or repository | Sweeps configuration accessors, authentication, authorization, cryptography, execution sinks, and deployment manifests against the active **Quality floor** |

Both modes enforce a zero-item scan guard: if an invalid ref or empty filter yields zero scanned files, the audit fails loudly rather than reporting a clean pass.

## Refuted by default: the five-step gate

Discovery runs in two parallel [subagents](https://www.aihero.dev/ai-coding-dictionary/subagent), each started with a fresh [context window](https://www.aihero.dev/ai-coding-dictionary/context-window): one targeting **Insecure Defaults & Config Cliffs**, and the other targeting **Sharp Edges, Injection & Authz Logic**.

Every candidate starts **refuted by default** and must pass all five gates before entering the report:

1. **Production reachability**: dead code, unreachable branches, and test-only fixtures drop out.
2. **Fail-secure vs. fail-open behavior**: configurable lookups that crash on missing values drop out; fail-open fallbacks and unconditional defects stay.
3. **Upstream validation or framework protection**: sinks already neutralized by upstream auth middleware, strict schemas, or parameterized ORMs drop out.
4. **Threat model and source-to-sink trace**: candidates without a concrete `WHO / ACCESS / INTERFACE` attacker model and `file:line` trace drop out.
5. **Sibling variant check**: confirmed findings generalize along an **abstraction ladder** to catch matching instances elsewhere in the codebase.

Confirmed issues appear under `P0` through `P3` with concrete remediation diffs, while rejected matches stay recorded in the **Refuted Candidates** table with the gate they failed.

## Common questions

**How does `security-review` differ from `code-review` and `backend-security-floor`?**
[code-review](https://aihero.dev/skills-code-review) checks general coding standards and spec fidelity on a diff, while [backend-security-floor](https://aihero.dev/skills-backend-security-floor) establishes write-time security defaults while building. `security-review` runs an adversarial audit focused on exploitable paths, security regressions, and refuting false positives.

**Does it require Semgrep, CodeQL, or other external scanners?**
No. It inspects source files, git history, and deployment manifests directly without external binaries. When the repository was configured with [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) under the `backend` **Stack profile**, it reads `docs/agents/quality-floor.md` and `docs/agents/security-rules.md`; otherwise it falls back directly to the built-in core rules and language packs.

**Why does it never edit files to fix the bugs it finds?**
Security fixes frequently cross module seams, change startup failure behavior, or require coordinated test updates. Keeping the audit read-only prevents unreviewed edits and leaves you with concrete source-to-sink evidence and diffs to apply deliberately in a fresh [session](https://www.aihero.dev/ai-coding-dictionary/session).

## It's working if

* Supplying a bad git ref or zero-file path fails loudly instead of returning a clean audit.
* Every finding in `P0` through `P3` carries a concrete `WHO / ACCESS / INTERFACE` attacker model, a `file:line` source-to-sink trace, an exploit scenario, and a remediation diff.
* Removing an authorization or validation guard in a branch diff surfaces its `git blame` history alongside caller blast-radius counts.
* Pattern hits neutralized by upstream middleware or fail-secure startup checks appear in the Refuted Candidates table with the gate they failed instead of cluttering `P0` or `P1`.
* Confirmed vulnerabilities list sibling occurrences found elsewhere in the codebase, and zero repository files are modified by the review.

## Where it fits

A standalone on-demand adversarial audit and optional pre-merge security gate for the `backend` **Stack profile**. Pair it with [backend-security-floor](https://aihero.dev/skills-backend-security-floor) (which enforces fail-secure defaults while writing code), [code-review](https://aihero.dev/skills-code-review) (which checks general repo conventions and spec alignment), and [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) (when findings point to shallow security seams worth deepening). Explore the whole map at [ask-matt](https://aihero.dev/skills-ask-matt).
