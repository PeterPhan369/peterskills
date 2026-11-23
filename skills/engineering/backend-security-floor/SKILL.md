---
name: backend-security-floor
description: Baseline backend security quality floor enforcing fail-secure defaults, deny-by-default authorization, and Pit of Success design.
disable-model-invocation: true
---

# Backend Security Floor

The minimum **Quality floor** for backend services, APIs, authentication, authorization, configuration, data access, and cryptography. When writing, modifying, or reviewing backend code, enforce these standards by default.

An explicit repository threat model or compliance requirement strengthens standards here; developer convenience or habit never relaxes them.

## Reference Catalogs

- **Core language-agnostic rules**: Read [SECURITY-RULES.md](SECURITY-RULES.md) for all 42 deterministic rules with `Fail-Secure vs. Fail-Open` checks and `Report when` / `Skip when` discriminators.
- **Language-specific sharp edges**: Read only the active language reference(s) for the current repository under [lang/](lang/):
  - C / C++: [lang/c-cpp.md](lang/c-cpp.md)
  - C# / .NET: [lang/csharp.md](lang/csharp.md)
  - Go: [lang/go.md](lang/go.md)
  - Java: [lang/java.md](lang/java.md)
  - JavaScript / TypeScript: [lang/javascript-typescript.md](lang/javascript-typescript.md)
  - Kotlin: [lang/kotlin.md](lang/kotlin.md)
  - PHP: [lang/php.md](lang/php.md)
  - Python: [lang/python.md](lang/python.md)
  - Ruby: [lang/ruby.md](lang/ruby.md)
  - Rust: [lang/rust.md](lang/rust.md)
  - Swift: [lang/swift.md](lang/swift.md)

## Core Principles

- **Pit of Success**: Design APIs, schemas, and constructors so secure usage is the path of least resistance and misuse fails to compile or throws at initialization rather than silently degrading security.
- **Fail-Secure by Default**: Require secrets, signing keys, and security flags explicitly at startup; crash immediately when missing or malformed instead of falling back to literals or permissive modes.
- **Deny-by-Default Authorization**: Enforce access control centrally before handler logic runs, bind every resource query to the authenticated principal, and reject requests unless an explicit policy grants access.

## The Quality Floor

Verify these six pillars on all generated or modified backend code:

1. **Secrets and Configuration**:
   - Read secrets, signing keys, and credentials from environment variables or a secret manager without fallback literals; abort startup when missing.
   - Validate configuration bounds and allowlists at construction; reject `0`, `-1`, empty strings, unvalidated overrides, and ambiguous string booleans (`"false"`).

2. **Authentication and Sessions**:
   - Hash passwords with Argon2id, scrypt, or bcrypt; reject passwords exceeding 72 UTF-8 bytes or pre-hash consistently before bcrypt to avoid silent truncation.
   - Mint session IDs, API keys, OTPs, and reset tokens from a CSPRNG; rotate session identifiers on login and invalidate one-time tokens atomically on first use.
   - Compare MACs, signatures, tokens, and hashes using constant-time primitives, reject empty inputs explicitly, and return uniform authentication failures.

3. **Authorization and Access Control**:
   - Enforce authentication and role/permission policies centrally at router or middleware seams rather than duplicating checks inside handlers.
   - Scope every data lookup and mutation to the authenticated principal or tenant (`WHERE id = $1 AND org_id = $2`) to eliminate IDOR.
   - Use typed permission models, private storage ACLs, restrictive file modes (`0o600`/`0o644`), restricted pre-MFA tokens, and explicit origin allowlists for credentialed CORS.

4. **Input Boundaries and Deserialization**:
   - Use parameterized database queries and argv-array subprocess calls (`shell=false`); keep shells, dynamic `eval`, and string-interpolated queries out of request paths.
   - Deserialize untrusted payloads with safe formats (JSON, `yaml.safe_load`) validated against strict schemas, bounded payload/page limits, DTD-disabled XML, and linear-time regexes.
   - Canonicalize file paths against a root directory and validate outbound URLs against scheme allowlists and non-private IP ranges to prevent path traversal and SSRF.

5. **Cryptography Ergonomics**:
   - Hardcode or strictly allowlist algorithms in code (refuse JWT `alg: none` and caller-chosen ciphers) and separate keys by purpose using semantic types or HKDF domain tags.
   - Use authenticated encryption (AES-256-GCM or ChaCha20-Poly1305) with unique CSPRNG or monotonic nonces generated inside the encryption boundary.

6. **Error Handling and Observability**:
   - Log full stack traces and driver diagnostics server-side with credentials and bearer tokens redacted; return generic errors and request IDs to clients.
   - Disable debug modes, GraphQL introspection, and error detail dumps in production, collapse crypto errors uniformly to prevent oracles, and propagate verification exceptions rather than swallowing them.

## Defaults to Refuse

Reject these common AI security anti-patterns unless an audited, temporary local-only test harness explicitly isolates them from production paths:

- **Fallback secrets**: Never write `os.environ.get('SECRET', 'dev-secret')`, `process.env.JWT_SECRET || 'fallback'`, or hardcoded default keys that let services boot with known credentials.
- **Fail-open flags**: Never default security controls to permissive states (`REQUIRE_AUTH='false'`, `VERIFY_TLS='false'`, `DEBUG=true`) or let `timeout=0` and `max_attempts=0` disable enforcement.
- **Weak password hashing**: Never hash passwords with MD5, SHA-1, SHA-256, SHA-512, unsalted digests, or untracked bcrypt truncation past 72 bytes.
- **Non-constant-time token comparisons**: Never compare tokens, signatures, HMACs, or API keys using `==`, `===`, `!=`, or `memcmp`; always use constant-time equality and guard against empty strings.
- **Permissive CORS with credentials**: Never pair `Access-Control-Allow-Origin: *` or unvalidated reflected `Origin` headers with `Access-Control-Allow-Credentials: true`, and never default file modes to `0o666` or cloud buckets to `public-read`.
- **Stringly-typed authorization**: Never evaluate access with substring or comma-split checks (`"admin" in user.roles`, `.includes("admin")`), trust client-supplied role fields, or omit tenant-scoped query predicates.
- **Stack trace leaks**: Never return raw exception messages, stack traces (`traceback.format_exc()`, `err.stack`, `e.getMessage()`), or SQL/driver error details in HTTP or RPC responses.
