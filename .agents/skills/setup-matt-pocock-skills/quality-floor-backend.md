# Quality Floor: Backend

Active **Stack profile**: `backend`. Enforce these baseline security standards when writing, modifying, or reviewing backend services, APIs, auth, configuration, data access, or cryptography. An explicit repository threat model or compliance requirement strengthens defaults here; convenience never relaxes them.

Read `docs/agents/security-rules.md` before implementing or reviewing authentication, authorization, secret/config loading, deserialization, SQL/shell execution, cryptography, or error boundaries. It holds the compiled core rules and only the active language sharp-edge pack(s) for this repo.

## Core Principles

- **Pit of Success**: Design APIs, schemas, and constructors so secure usage is the easiest path and misuse fails to compile or throws at startup.
- **Fail-Secure by Default**: Require secrets, keys, and security flags explicitly at startup; crash immediately when missing or malformed instead of falling back to permissive literals.
- **Deny-by-Default Authorization**: Enforce access control centrally before handler logic runs, bind every data lookup to the authenticated principal, and reject unless an explicit policy grants access.

## The Quality Floor

1. **Secrets and Configuration**: Read secrets and keys from environment or secret stores without literal fallbacks; abort startup when missing. Reject `0`, `-1`, empty strings, and ambiguous string booleans (`"false"`).
2. **Authentication and Sessions**: Hash passwords with Argon2id, scrypt, or bcrypt (guarding against 72-byte bcrypt truncation). Mint tokens from a CSPRNG, rotate session IDs on login, invalidate one-time tokens atomically, and compare secrets/MACs with constant-time primitives.
3. **Authorization and Access Control**: Centralize auth and role guards at router or middleware seams, scope every database query and mutation to the authenticated principal or tenant to prevent IDOR, use typed permissions, private storage ACLs, and explicit CORS origin allowlists.
4. **Input Boundaries and Deserialization**: Parameterize all queries and use argv-array subprocess calls (`shell=false`). Deserialize untrusted payloads safely against strict schemas with bounded sizes, DTD-disabled XML, linear-time regexes, canonicalized file paths, and SSRF IP/scheme checks.
5. **Cryptography Ergonomics**: Hardcode or allowlist algorithms (refuse JWT `alg: none`), separate keys by purpose (semantic types or HKDF domain tags), and use authenticated encryption (AES-256-GCM or ChaCha20-Poly1305) with unique nonces generated inside the encryption boundary.
6. **Error Handling and Observability**: Log diagnostics server-side with secrets redacted and return generic errors with request IDs to clients. Disable production debug/introspection modes, collapse crypto errors uniformly, and propagate verification exceptions.

## Defaults to Refuse

Reject these patterns unless explicitly isolated inside a local-only test fixture unreachable from production:

- **Fallback secrets**: Never supply default secret literals (`getenv('SECRET', 'dev')`, `process.env.JWT_SECRET || 'dev'`).
- **Fail-open flags**: Never default security enforcement to off (`REQUIRE_AUTH='false'`, `VERIFY_TLS='false'`, `DEBUG=true`) or let `0`/`-1` disable limits.
- **Weak password hashing**: Never hash passwords with MD5, SHA-1, SHA-256, SHA-512, unsalted digests, or untracked >72-byte bcrypt truncation.
- **Non-constant-time token comparisons**: Never compare tokens, HMACs, signatures, or API keys with `==`, `===`, `!=`, or `memcmp`.
- **Permissive CORS with credentials**: Never pair wildcard or unvalidated reflected `Origin` headers with credentials, `0o666` file modes, or `public-read` buckets.
- **Stringly-typed authorization**: Never check roles via substrings or splits, trust client-supplied role fields, or omit tenant query predicates.
- **Stack trace leaks**: Never expose raw exceptions, stack traces, or driver diagnostics in HTTP or RPC responses.

## Deeper Checks

- Consult `docs/agents/security-rules.md` for `Fail-Secure vs. Fail-Open` checks and `Report when` / `Skip when` discriminators.
- Ask the user to run `/backend-security-floor` to inspect the full baseline or `/security-review` for an adversarial branch or surface audit.
