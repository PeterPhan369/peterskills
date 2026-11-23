---
name: security-review
description: Adversarial backend security review in Diff Mode or Surface Mode with parallel discovery and a 5-step refutation gate.
disable-model-invocation: true
---

# Security Review

Adversarial, read-only security audit of backend changes, services, or configuration surfaces. Produce a verified `P0` to `P3` findings report and a Refuted Candidates trail without modifying any repository files.

## 1. Load the Active Quality Floor

Read the repository's active **Quality floor** and security rules directly from disk first as primary external references when configured:
- `docs/agents/quality-floor.md`
- `docs/agents/security-rules.md`

When either file is absent, tell the user `/setup-matt-pocock-skills` creates them if missing, and fall back directly on disk to reading the installed `backend-security-floor` skill's `SKILL.md`, `SECURITY-RULES.md`, and matching `lang/*.md` files for the languages present in scope.

Read `GLOSSARY.md` and `docs/adr/` if present so findings respect documented domain boundaries and accepted security ADRs.

## 2. Select Mode, Triage Scope, and Guard Against Empty Scans

Determine the mode from the user's target:

- **Diff Mode** (given a branch, commit SHA, tag, PR, or base ref):
  1. If no base ref was specified, ask the user for the base ref before proceeding. Verify the ref resolves (`git rev-parse <base>`) and capture `git diff <base>...HEAD` plus `git log <base>..HEAD --oneline`.
  2. **Risk triage**: score every modified file as `HIGH` (auth, authz, sessions, tokens, cryptography, config/secrets loaders, external calls/SSRF, SQL/shell/deserialization sinks, or removed checks), `MEDIUM` (business logic, state changes, new public endpoints, parsers), or `LOW` (comments, docs, formatting, isolated tests).
  3. **Regression hunting (`git log -S` / `git blame`)**: for every removed or weakened validation, guard, or security check in the diff, run `git log -S` and `git blame` on the removed lines to detect regressions of past `fix`, `security`, or `CVE` commits or re-introduction of previously removed vulnerable patterns.
  4. **Caller blast-radius scoring**: count callers across the repository for modified functions, middleware, and shared helpers (`1-5` `LOW`, `6-20` `MEDIUM`, `21-50` `HIGH`, `50+` `CRITICAL`), prioritizing `HIGH` change risk paired with `HIGH`/`CRITICAL` blast radius.
  5. **Test coverage gap elevation**: elevate risk to `HIGH` when a new security-sensitive function, modified authz/validation branch, or `>20`-line logic change lacks corresponding negative or security test updates.

- **Surface Mode** (given a directory, module, service, or whole repository):
  1. Classify scope size (`SMALL <20` files, `MEDIUM 20-200`, `LARGE 200+`) so deep tracing scales cleanly without skimming critical seams.
  2. Enumerate target files across six surfaces:
     - **Configuration accessors** (`process.env`, `os.environ`, `getenv`, config schemas, startup loaders, fallback literals, constructor defaults)
     - **Authentication and sessions** (login, password hashing, session lifecycle, token generation, OTP/reset flows)
     - **Authorization and access control** (route middleware, policy guards, tenant-scoped DB queries/IDOR, CORS, file/bucket ACLs)
     - **Cryptography** (JWT verification, cipher/hash selection, nonce/IV handling, key derivation, equality checks)
     - **Data and execution sinks** (SQL, subprocess/shell, deserialization, object merge, dynamic evaluation/templates, path joins, outbound HTTP/SSRF, XML parsers)
     - **Deployment manifests** (`Dockerfile`, `docker-compose*`, Kubernetes/Helm, `vercel.json`, `.env*`, CI workflows, IaC) for permissive defaults, exposed debug ports, or unsafe runtime overrides.

**Zero-item scan guard**: record the exact target scope, file count, and search patterns before scanning. If `0` files or `0` targets match scope (bad ref, empty diff, nonexistent path, or empty filter), fail loudly by aborting and reporting `scan-failed` with the commands and paths tried rather than reporting a clean pass.

## 3. Run Parallel Discovery Sub-Agents

Spawn two discovery sub-agents **in parallel** in the foreground. Start every sub-agent with a **fresh context window** rather than forking the parent conversation. Instruct both sub-agents to treat the repository as strictly read-only, perform the scan directly, and keep all candidates regardless of perceived severity (report every candidate with `refuted: true` by default so discovery recall never collapses).

Give both sub-agents the mode, target file list (plus diff, `git blame`/`git log -S`, blast-radius, and test-gap triage in Diff Mode), and exact paths to the active **Quality floor** and security rules loaded in Step 1:

- **Sub-agent A: Insecure Defaults & Config Cliffs**
  - Hunt configurable fail-open defaults (`env.get(KEY, fallback)`, permissive auth/TLS/debug toggles, `0`/`-1` sentinel timeouts or limits, boolean string traps, unvalidated security constructors), unconditional hardcoded credentials, permissive CORS/ACLs (`0o666`, `public-read`, `*` + credentials), production debug surfaces, and stack-trace or secret leaks in logs and responses.
  - Check deployment manifests to distinguish runtime environment exposure from code defects.

- **Sub-agent B: Sharp Edges, Injection & Authz Logic**
  - Hunt authentication/session flaws (weak KDFs, 72-byte bcrypt truncation, non-constant-time token comparisons, empty-secret equality, session fixation, reusable OTPs, enumeration), authorization gaps (scattered guards, IDOR missing principal/tenant predicates, stringly-typed roles, client-supplied authority, MFA bypass), crypto sharp edges (JWT `alg` confusion, caller-chosen ciphers, ECB/unauthenticated modes, nonce reuse, swappable byte params, missing domain separation), injection/boundary sinks (SQL, shell, deserialization, prototype pollution/mass assignment, eval/SSTI, path traversal, SSRF, ReDoS, XXE), and language-specific footguns from active `lang/*.md`.
  - In Diff Mode, trace every removed check surfaced by `git log -S` / `git blame`, high-blast-radius callers, and untested security changes.

Verify each sub-agent returns non-empty scanned file counts and search patterns; if either reports `0` scanned targets, abort and report `scan-failed`.

## 4. Enforce the 5-Step False-Positive Refutation Gate

Start every candidate returned in Step 3 as **refuted by default (`refuted: true`)**. A candidate enters the confirmed findings report only after passing all five ordered gates against direct source reads with `file:line` evidence:

1. **Production Reachability**: Verify the code path executes in production entrypoints. Refute dead code, unreachable branches, local-only test fixtures, or `.env.example` placeholders.
2. **Fail-Secure vs. Fail-Open Behavior**: For configurable defaults, trace missing or malformed configuration at startup. If absent config throws or aborts startup (fail-secure), refute. Confirm only when missing config lets the service boot and operate with a known secret, weak primitive, or disabled guard (fail-open), or when the insecure value/API is unconditional in shipped code. Record deployment manifest exposure (`always`, `sometimes`, `never`, `unknown`) to calibrate priority without excusing an unconditional code defect.
3. **Upstream Validation or Framework Protection**: Trace callers and middleware upstream. Refute if an enforced auth middleware, strict schema parser, parameterized query/ORM binding, or framework auto-escaper already neutralizes input before the sink.
4. **Threat Model (`WHO / ACCESS / INTERFACE`) & Source-to-Sink Trace**: Define `WHO` (unauthenticated caller, authenticated tenant user, low-privilege role), `ACCESS` (network, API request, uploaded file, queue message), and `INTERFACE` (exact route, handler, or RPC method), paired with a concrete `file:line` source-to-sink trace. Refute if the required attacker privilege already subsumes the impact (no vulnerability without a threat model) or matches documented intentional behavior.
5. **Sibling Variant Check (Abstraction Ladder)**: For every finding surviving Gates 1 through 4, generalize the root-cause pattern one element at a time along an **abstraction ladder** (exact vulnerable expression -> sibling callers/handlers -> module-wide pattern -> repo-wide search until `>50%` of hits are noise) to locate sibling variants across the codebase. Verify each sibling hit against Gates 1 through 4 and attach confirmed siblings to the finding.

Place every candidate or sibling hit rejected at Gates 1 through 4 in the **Refuted Candidates** table with its failing gate and cited `file:line` evidence.

## 5. Report Findings

This is a strictly read-only audit: never edit, patch, or modify repository files directly; output remediation diffs inside the report instead. Present findings ordered by priority (`P0` through `P3`) followed by the Refuted Candidates trail:

````markdown
# Security Review: <Target / Branch>

**Mode**: <Diff Mode (<base>...HEAD) | Surface Mode (<target path>)>
**Scope**: <N files scanned | Scope tier: SMALL/MEDIUM/LARGE | Active rules: repo docs or fallback packs>
**Summary**: <1-2 sentences on top risk, regression status, and shipping readiness.>

## Findings by Priority

### P0 (Critical: Unauthenticated RCE, Auth/Authz Bypass, Prod Fallback Secret, Direct Data Leak)
* **[Rule ID / Issue Title]** in `<file>:<line>` (Siblings: `<other file:line>` or `none`)
  * **Attacker Model**: `WHO`: <actor> | `ACCESS`: <channel> | `INTERFACE`: <entrypoint> | `Exploitability`: <EASY | MEDIUM | HARD>
  * **Source-to-Sink**: `<source file:line>` -> `<transform/guard file:line>` -> `<sink file:line>`
  * **Exploit Scenario**: <Concrete step-by-step attack path against the code>
  * **Remediation**:
    ```diff
    - <vulnerable code>
    + <fail-secure / pit-of-success fix>
    ```

### P1 (High: Cross-Tenant IDOR, Preconditioned Injection, Weak Crypto at Sink, Security Regression)
* Use the P0 finding schema (`Attacker Model`, `Source-to-Sink`, `Exploit Scenario`, `Remediation` diff).

### P2 (Medium: Permissive Defaults, Test Gap on Security Change, Log Redaction Gap, Defense-in-Depth)
* Use the P0 finding schema (`Attacker Model`, `Source-to-Sink`, `Exploit Scenario`, `Remediation` diff).

### P3 (Advisory: Sharp-Edge APIs, Configuration Cliffs, Structural Hardening)
* Use the P0 finding schema (`Attacker Model`, `Source-to-Sink`, `Exploit Scenario`, `Remediation` diff).

## Refuted Candidates

| Candidate | Location | Rule / Pattern | Gate Failed | Refutation Evidence |
| --- | --- | --- | --- | --- |
| `<candidate>` | `<file>:<line>` | `<rule-id>` | `<Gate 1-4>` | `<concise reason with file:line>` |

## Verdict

<Block merge / Fix P0-P1 before merge / Ready to ship with P2-P3 follow-up>
````

## Rationalizations to Reject

| Rationalization | Why It Fails | Required Action |
| --- | --- | --- |
| "Small PR or one-line diff, quick skim is enough" | Removing one guard or changing a fallback literal introduces critical regressions | Run full Diff Mode triage, `git log -S`, and `git blame` |
| "Only report high-severity issues to stay concise" | Filtering severity during discovery collapses recall on chained and P2 bugs | Discover all candidates first; assign `P0`-`P3` only after refutation |
| "This grep match looks dangerous, report it as P0" | Unverified pattern hits flood engineers with false positives | Start at `refuted: true` and verify all 5 gates with `file:line` traces |
| "It's internal or behind authentication, so it's safe" | IDOR, privilege escalation, and SSRF exploit authenticated entrypoints | Build a concrete `WHO / ACCESS / INTERFACE` threat model |
| "Tests exist for this endpoint, so the change is covered" | Happy-path tests rarely verify authz denials, negative bounds, or removed checks | Flag missing negative/security tests as `HIGH` risk |
| "Found the bug here, report it and move on" | Root-cause patterns recur across handlers and helpers | Run the Gate 5 abstraction ladder for sibling variants |
| "Let me patch this quick issue while reviewing" | Silent edits bypass review scope and mix auditing with implementation | Keep the audit read-only; emit remediation diffs only |
