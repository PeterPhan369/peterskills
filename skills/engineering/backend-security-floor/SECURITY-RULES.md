# Backend Security Core Detector Rules

Language-agnostic catalog of 42 deterministic security rules across six pillars. Use these rules alongside the active language reference(s) under [lang/](lang/) to prevent and detect fail-open defaults, sharp-edge APIs, and boundary bugs.

## Evaluation Model: Configurable vs. Unconditional

- **Configurable candidate**: Code reads configuration or environment variables with a fallback (`env.get(KEY, fallback)`, `cfg.timeout || 0`). **Fail-Secure** means missing or invalid config throws or aborts startup (`env[KEY]`). **Fail-Open** means the process boots and operates using a known secret, weak algorithm, or disabled guard.
- **Unconditional candidate**: Code embeds an insecure literal, primitive, or bypass directly with no configuration toggle (for example `MD5(password)`, `tls.InsecureSkipVerify = true`, or `==` on a MAC). Report whenever the code path reaches a security sink in production.

---

## 1. Secrets and Configuration

### 1. `fallback-secret`
* **Name**: Environment or config lookup with fallback secret literal
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure throws at boot when a secret env var is absent; Fail-Open supplies a string literal (`'dev-secret'`, `'changeme'`) so signing or encryption silently runs with a public key.
* **The Tell**: Calling `getenv`, `os.environ.get`, or `process.env.X || 'literal'` for signing keys, JWT secrets, session secrets, webhook secrets, or encryption keys.
* **Vulnerable**: `const secret = process.env.JWT_SECRET || "dev-secret-key";`
* **Secure**: `const secret = requireEnv("JWT_SECRET"); // throws Error if unset or < 32 bytes`
* **Report when**: Production startup or request handling accepts a literal fallback string, default secret, or empty key when configuration is missing.
* **Skip when**: The fallback only runs inside a local test fixture unreachable from production entrypoints, or missing config raises an error immediately.

### 2. `hardcoded-credential`
* **Name**: Unconditional hardcoded credential, API key, or seeded admin password
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure injects credentials from a secret store or bootstrap token rotated on first login; Fail-Open ships fixed passwords, private keys, or database DSNs in source code.
* **The Tell**: Literal passwords, bearer tokens, private key PEM blocks, or `bootstrap_admin("admin", "admin123")` outside ephemeral test suites.
* **Vulnerable**: `DB_DSN = "postgres://app:prodPass123@db.internal:5432/app"`
* **Secure**: `DB_DSN = require_secret("DB_DSN")`
* **Report when**: A literal credential or private key authenticates against a database, external API, or seeded administrative account in shipped code.
* **Skip when**: The value is a dummy placeholder in `.env.example` or an isolated unit test mock with no real service trust.

### 3. `fail-open-security-toggle`
* **Name**: Security enforcement flag defaulting to permissive
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure defaults authentication, TLS verification, CSRF, and rate limiting to enabled and debug modes to off; Fail-Open defaults `REQUIRE_AUTH`, `VERIFY_TLS`, or `PRODUCTION` checks to permissive.
* **The Tell**: `env.get("REQUIRE_AUTH", "false")`, `VERIFY_SSL = os.getenv("VERIFY_SSL", "0")`, or `DEBUG = env.get("DEBUG", "true")`.
* **Vulnerable**: `const requireAuth = process.env.REQUIRE_AUTH === "true"; // defaults false when unset`
* **Secure**: `const requireAuth = process.env.DISABLE_AUTH !== "true" || isLocalDevOnly();`
* **Report when**: An omitted or misnamed environment variable disables authentication, authorization, CSRF, TLS validation, or activates debug mode in production.
* **Skip when**: Enforcement is on by default and disabling requires an explicit non-production environment guard that crashes if `NODE_ENV=production` or `ENV=prod`.

### 4. `sentinel-disables-enforcement`
* **Name**: Zero, negative, or null sentinel disabling limits and expiry
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure rejects non-positive bounds (`<= 0`) for lifetimes, timeouts, and attempt limits; Fail-Open interprets `0`, `-1`, or `null` as "never expires" or "unlimited attempts".
* **The Tell**: Config schemas or functions using `timeout = 0`, `ttlSeconds = -1`, or `maxAttempts = 0` to bypass rate limits, OTP expiry, or lockouts.
* **Vulnerable**: `function checkOtp(ttl = 0) { if (ttl <= 0) return true; /* skips expiry check */ }`
* **Secure**: `function createOtpPolicy(ttlSeconds: number) { if (ttlSeconds < 30 || ttlSeconds > 900) throw new RangeError("Invalid OTP TTL"); }`
* **Report when**: Passing `0`, `-1`, or omitting a numeric limit disables token expiry, session timeout, lockouts, or request timeouts.
* **Skip when**: A dedicated typed option (such as an explicit `NoTimeout` type on an internal streaming worker) documents unbounded streams without affecting auth or rate limits.

### 5. `boolean-string-trap`
* **Name**: Truthy evaluation of string configuration booleans
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure parses booleans strictly (`"true"` -> `true`, `"false"` -> `false`, anything else throws); Fail-Open coerces strings via `Boolean(val)` or `bool(val)` where `"false"` and `"0"` evaluate `true`.
* **The Tell**: Passing an env string directly into `if (process.env.SKIP_AUTH)` or `bool(os.getenv("DISABLE_CHECK"))`.
* **Vulnerable**: `const allowInsecure = Boolean(process.env.ALLOW_INSECURE); // "false" is truthy!`
* **Secure**: `const allowInsecure = parseStrictBool(process.env.ALLOW_INSECURE, { default: false });`
* **Report when**: A string environment or config value representing a security toggle is tested for truthiness instead of strictly parsed.
* **Skip when**: A typed schema validator (`zod`, `pydantic`, `envconfig`) strictly converts `"true"`/`"false"` and rejects unrecognized values at startup.

### 6. `unvalidated-security-constructor`
* **Name**: Configuration cliff allowing insecure overrides at construction
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure validates algorithm, origin, and numeric security options against an allowlist in the constructor; Fail-Open gives a safe default that callers can silently override with `'md5'`, `'*'`, or `-1`.
* **The Tell**: Library or service options objects storing raw strings (`hashAlg = opts.hashAlg || 'sha256'`) without checking allowed values.
* **Vulnerable**: `class TokenService { constructor(readonly alg = "HS256") {} }`
* **Secure**: `class TokenService { constructor(readonly alg: "RS256" | "EdDSA" = "EdDSA") { assertAllowedAlg(alg); } }`
* **Report when**: A caller or config file can override a secure default with a deprecated algorithm, negative bound, or wildcard policy without throwing at initialization.
* **Skip when**: Options are restricted by runtime allowlist validation inside the constructor before any request is served.

### 7. `env-override-injection`
* **Name**: Untrusted input overriding configuration keys or search paths
* **Pillar**: Secrets and Configuration
* **Fail-Secure vs. Fail-Open**: Fail-Secure freezes configuration at boot from trusted sources; Fail-Open merges request headers, query parameters, or user-writable config files into runtime settings or `PATH`/`LD_PRELOAD`.
* **The Tell**: Merging parsed request bodies into config objects or copying user-supplied headers into subprocess environments.
* **Vulnerable**: `execFile(cmd, args, { env: { ...process.env, ...req.body.env } });`
* **Secure**: `execFile(cmd, args, { env: { PATH: "/usr/bin:/bin", LANG: "C.UTF-8" } });`
* **Report when**: External input can inject environment variables, loader flags, config filenames, or plugin paths.
* **Skip when**: Environment keys and values come from a static allowlist validated against strict patterns.

---

## 2. Authentication and Sessions

### 8. `weak-password-kdf`
* **Name**: Fast or unsalted hashes used for password storage
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure uses Argon2id, scrypt, or bcrypt with high work factors; Fail-Open uses MD5, SHA-1, SHA-256, SHA-512, or static salts vulnerable to GPU cracking.
* **The Tell**: `sha256(password)`, `md5(salt + password)`, or HMAC-SHA256 used in user registration or password verification.
* **Vulnerable**: `const digest = crypto.createHash("sha256").update(salt + password).digest("hex");`
* **Secure**: `const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });`
* **Report when**: Any password, passphrase, or low-entropy PIN is hashed with a general-purpose digest rather than a memory-hard or adaptive KDF.
* **Skip when**: The input being hashed is a high-entropy 256-bit API key or webhook token (not a human password), or used only as a non-secret cache key.

### 9. `bcrypt-silent-truncation`
* **Name**: Unbounded password input passed to bcrypt
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure rejects passwords over 72 UTF-8 bytes or applies domain-separated SHA-256 pre-hashing consistently; Fail-Open passes raw strings to bcrypt, ignoring bytes 73+.
* **The Tell**: Calling `bcrypt.hash(password, rounds)` without checking `Buffer.byteLength(password, "utf8") <= 72` or pre-hashing.
* **Vulnerable**: `bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12))`
* **Secure**: `if len(password.encode("utf-8")) > 72: raise ValueError("Password exceeds 72 bytes")`
* **Report when**: Password hashing or login verification uses bcrypt without enforcing the 72-byte limit or switching to Argon2id/scrypt.
* **Skip when**: Input length in UTF-8 bytes is validated to `<= 72` before bcrypt, or Argon2id/scrypt is used instead.

### 10. `non-constant-time-comparison`
* **Name**: Variable-time equality used on secrets, MACs, or tokens
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure compares byte slices of verified equal length via constant-time primitives; Fail-Open uses `==`, `===`, `!=`, or `memcmp` that short-circuit on the first mismatched byte.
* **The Tell**: `expectedHmac === providedHmac`, `token == user.apiToken`, or `memcmp(sig, expected, len)` in auth paths.
* **Vulnerable**: `if signature == expected_signature: return True`
* **Secure**: `if hmac.compare_digest(signature, expected_signature): return True`
* **Report when**: An authentication token, HMAC, signature, API key, reset token, or password digest is compared using standard string or buffer equality.
* **Skip when**: Comparing public identifiers (non-secret UUIDs, route names) or when an explicit constant-time function wraps the comparison.

### 11. `empty-secret-equality`
* **Name**: Missing or empty credentials passing equality checks
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure rejects empty, null, or zero-length secrets before comparison; Fail-Open lets unconfigured `""` match an empty header or missing claim (`"" == ""`).
* **The Tell**: Comparing `providedToken` against `config.token` without checking `expected.length > 0` first.
* **Vulnerable**: `return timingSafeEqualSafe(req.headers["x-token"] ?? "", config.webhookSecret ?? "");`
* **Secure**: `if (!expected || !provided || expected.length !== provided.length) return false;`
* **Report when**: A missing config secret or uninitialized DB field can coerce to `""` and match an empty caller credential.
* **Skip when**: Non-empty length (`>= 16` or `> 0`) is enforced at startup and before every comparison.

### 12. `predictable-token-prng`
* **Name**: Non-cryptographic PRNG used for security tokens or secrets
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure generates all sessions, API keys, CSRF tokens, nonces, and OTPs from the OS CSPRNG; Fail-Open uses `Math.random()`, `random.randint()`, `math/rand`, or timestamps.
* **The Tell**: `Math.random().toString(36)`, `uuid.v1()`, `rand()`, or `time.Now().UnixNano()` generating secrets or invite codes.
* **Vulnerable**: `const resetToken = Math.random().toString(36).slice(2);`
* **Secure**: `const resetToken = crypto.randomBytes(32).toString("base64url");`
* **Report when**: Any unguessable identifier (session ID, CSRF token, password reset code, OTP, API key, encryption nonce) derives from a non-CSPRNG or timestamp.
* **Skip when**: The random value only drives non-security logic such as UI jitter, log sampling, or test fixture generation.

### 13. `session-fixation`
* **Name**: Reusing pre-authentication session ID across login or privilege escalation
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure destroys the pre-login session and issues a fresh CSPRNG session identifier on login, MFA completion, or password change; Fail-Open keeps the incoming cookie session ID.
* **The Tell**: Setting `req.session.userId = user.id` directly on login without calling `session.regenerate()` or rotating cookies.
* **Vulnerable**: `req.session.userId = user.id; res.redirect("/dashboard");`
* **Secure**: `await regenerateSession(req); req.session.userId = user.id;`
* **Report when**: Login, SSO callback, or privilege elevation mutates an existing server session without rotating the session ID, or accepts a session ID from query parameters.
* **Skip when**: Authentication uses stateless signed tokens rotated on login, or the framework automatically regenerates session IDs inside the invoked login primitive.

### 14. `reusable-one-time-token`
* **Name**: OTP, magic link, or reset token remaining valid after use or lacking expiry
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure atomically consumes one-time tokens (`DELETE ... RETURNING` or `UPDATE ... WHERE used_at IS NULL`) with short TTL and attempt caps; Fail-Open only checks token equality.
* **The Tell**: Reading a reset/OTP record without marking `used_at`, deleting it atomically, or bounding retry attempts.
* **Vulnerable**: `const record = await db.resetTokens.findFirst({ where: { tokenHash } });`
* **Secure**: `const record = await db.resetTokens.consumeValid({ tokenHash, now: new Date() });`
* **Report when**: An OTP, magic link, or password reset token can be replayed concurrently or after first verification, or never expires.
* **Skip when**: Single-use atomic consumption with expiration and attempt throttling is enforced in the database transaction.

### 15. `auth-error-enumeration`
* **Name**: Distinguishable responses revealing account existence
* **Pillar**: Authentication and Sessions
* **Fail-Secure vs. Fail-Open**: Fail-Secure returns identical status codes, response bodies, and roughly constant work across unknown users and wrong passwords; Fail-Open returns `"User not found"` vs `"Wrong password"`.
* **The Tell**: Returning early before password KDF verification when `user == null`, or sending distinct error messages on login or password reset.
* **Vulnerable**: `if (!user) return res.status(404).json({ error: "Email not registered" });`
* **Secure**: `await verifyPasswordOrDummy(user?.passwordHash, password); return res.status(401).json({ error: "Invalid credentials" });`
* **Report when**: Unauthenticated login or password-reset endpoints leak whether an email/username exists via status codes, messages, or skipped KDF timing.
* **Skip when**: Registration intentionally informs an explicit signup form where email uniqueness is an accepted product trade-off, or on authenticated internal admin endpoints.

---

## 3. Authorization and Access Control

### 16. `scattered-authorization`
* **Name**: Ad-hoc per-handler authorization checks instead of centralized policy
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure enforces authentication and role/policy guards on router groups or middleware by default, requiring explicit opt-out for public routes; Fail-Open relies on remembering checks inside each handler.
* **The Tell**: Sensitive routes defined on an unauthenticated router where individual handlers manually start with `if (!req.user)` while sibling routes forget it.
* **Vulnerable**: `router.delete("/admin/users/:id", deleteUserHandler); // handler forgot admin check`
* **Secure**: `adminRouter.use(requireRole("admin")); adminRouter.delete("/users/:id", deleteUserHandler);`
* **Report when**: Protected endpoints lack centralized auth middleware or policy enforcement and rely on repeated manual handler checks where siblings can drift.
* **Skip when**: Router-level deny-by-default middleware guards the route group and explicit public routes are opted out in an allowlist.

### 17. `idor-unscoped-resource-query`
* **Name**: Direct object reference lookup without principal or tenant ownership filter
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure scopes every read, update, and delete query by `owner_id` / `tenant_id` (or explicit policy check); Fail-Open fetches `WHERE id = $1` directly from caller input.
* **The Tell**: `findById(req.params.id)`, `DELETE FROM invoices WHERE id = ?`, or `update({ where: { id } })` without checking `userId` or `orgId`.
* **Vulnerable**: `const doc = await db.documents.findUnique({ where: { id: req.params.id } });`
* **Secure**: `const doc = await db.documents.findFirst({ where: { id: req.params.id, orgId: req.auth.orgId } });`
* **Report when**: A user-supplied ID retrieves, modifies, or deletes a tenant-scoped or user-owned record without verifying principal/tenant membership.
* **Skip when**: Upstream middleware or RLS/query-scope enforces principal ownership on the exact resource type, or the resource is explicitly public catalog data.

### 18. `stringly-typed-role-check`
* **Name**: Substring or comma-delimited string checks for permissions
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure evaluates typed enums, sets, or structured capability lists (`Role.ADMIN`); Fail-Open tests `"admin" in user.roles` or splits comma-joined strings.
* **The Tell**: `user.role.includes("admin")`, `"write" in scopes_str`, or parsing `"read,write"` without exact token matching.
* **Vulnerable**: `if "admin" in current_user.permissions: allow_delete()`
* **Secure**: `if Permission.ADMIN_DELETE in current_user.permissions_set: allow_delete()`
* **Report when**: Substring membership, regex substring matching, or ad-hoc string concatenation decides authorization privileges (for example `"not_admin"` matching `"admin"`).
* **Skip when**: Roles/permissions are parsed at the boundary into typed enums or a `Set` checked via exact membership.

### 19. `client-supplied-authority`
* **Name**: Trusting caller-supplied identity, role, or tenant claims
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure derives `userId`, `orgId`, and `roles` strictly from verified server sessions or signed tokens; Fail-Open trusts `req.body.userId`, `X-User-Id` headers, or unverified JWT payloads.
* **The Tell**: Using `req.body.role`, `req.query.tenantId`, `X-Forwarded-User` (without mTLS/trusted proxy stripping), or `jwt.decode(..., verify=False)`.
* **Vulnerable**: `const userId = req.body.userId || req.user.id;`
* **Secure**: `const userId = req.auth.userId; // exclusively from verified session/token`
* **Report when**: An unverified header, query parameter, request body field, or unsigned JWT claim grants identity, tenant scope, or elevated privileges.
* **Skip when**: An authenticated proxy strips and overwrites the header on an isolated private network verified by mTLS or HMAC proxy signatures.

### 20. `permissive-cors-with-credentials`
* **Name**: Wildcard or reflected CORS origin combined with credentials
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure checks `Origin` against an explicit exact allowlist before reflecting and only enables credentials for trusted origins; Fail-Open sets `*` or reflects any `Origin` with `Allow-Credentials: true`.
* **The Tell**: `origin: "*"` or `origin: true` paired with `credentials: true`, or naive `origin.endsWith(".example.com")` (`evil-example.com` bypass).
* **Vulnerable**: `cors({ origin: (origin, cb) => cb(null, origin), credentials: true })`
* **Secure**: `cors({ origin: ALLOWED_ORIGINS_SET, credentials: true })`
* **Report when**: Any `Origin` is echoed back or wildcarded alongside cookies/credentials, or origin validation allows suffix/substring spoofing (or `null` origin).
* **Skip when**: The API is strictly public read-only with `credentials: false` and no cookie or `Authorization` header ambient authority.

### 21. `permissive-file-or-bucket-acl`
* **Name**: World-readable/writable file permissions or public cloud storage ACLs
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure sets restrictive file modes (`0o600` for secrets/keys, `0o644` for non-secret files, `0o700`/`0o755` for dirs) and `private` bucket ACLs; Fail-Open uses `0o666`, `0o777`, or `public-read`.
* **The Tell**: `chmod 0o777`, `fs.writeFile(..., { mode: 0o666 })`, `ACL: "public-read"`, or missing private ACL defaults on uploads.
* **Vulnerable**: `s3.put_object(Bucket=bucket, Key=key, Body=data, ACL="public-read")`
* **Secure**: `s3.put_object(Bucket=bucket, Key=key, Body=data, ACL="private")`
* **Report when**: Secrets, user uploads, logs, temp files, or object storage artifacts are created with world-writable/readable permissions or public bucket ACLs.
* **Skip when**: Static public CDN assets intentionally published with no sensitive or tenant data.

### 22. `mfa-or-step-up-bypass`
* **Name**: Issuing full session privileges before MFA or step-up completion
* **Pillar**: Authorization and Access Control
* **Fail-Secure vs. Fail-Open**: Fail-Secure issues a restricted pre-MFA token valid only for the MFA verification route and enforces step-up checks on sensitive actions; Fail-Open sets the normal session cookie after password check alone.
* **The Tell**: Password login sets the full session token and redirects to `/mfa`, allowing direct navigation to `/api/*` without completing MFA.
* **Vulnerable**: `setSessionCookie(res, user); return res.json({ mfaRequired: true });`
* **Secure**: `setPendingMfaCookie(res, user.id); // only accepted by /auth/mfa/verify`
* **Report when**: A user with MFA enabled receives a credential accepted by protected API routes prior to completing the second factor.
* **Skip when**: Standard auth middleware rejects pending-MFA tokens on every route except `/auth/mfa/*`.

---

## 4. Input Boundaries and Deserialization

### 23. `sql-string-interpolation`
* **Name**: Unparameterized SQL or NoSQL query construction
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure binds all untrusted values via prepared placeholders (`$1`, `?`, ORM bindings) and maps dynamic sort columns through strict allowlists; Fail-Open interpolates strings into queries.
* **The Tell**: Template literals, `+` concatenation, `%s`, or f-strings inside `db.query`, `execute`, `$queryRawUnsafe`, or `ORDER BY ${sort}`.
* **Vulnerable**: ``db.query(`SELECT * FROM users WHERE email = '${email}'`)``
* **Secure**: `db.query("SELECT * FROM users WHERE email = $1", [email])`
* **Report when**: Request-derived data (including sort columns, table names, or JSON operators) enters a database query via string interpolation instead of bound parameters or allowlist mapping.
* **Skip when**: All dynamic values are parameterized placeholders and any dynamic identifier (`ORDER BY`, direction) maps strictly via a static allowlist dictionary.

### 24. `shell-command-injection`
* **Name**: Invoking a shell interpreter with interpolated command strings
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure invokes executables directly with an argument array (`shell: false`) or pure library APIs; Fail-Open passes strings to `/bin/sh -c`, `cmd.exe /c`, `exec`, `os.system`, or `shell=True`.
* **The Tell**: `exec(\`git log ${ref}\`)`, `subprocess.run(cmd, shell=True)`, or interpolating user strings into CLI calls.
* **Vulnerable**: `subprocess.run(f"convert {filename} out.png", shell=True, check=True)`
* **Secure**: `subprocess.run(["convert", safe_path, "out.png"], shell=False, check=True)`
* **Report when**: User-controlled data reaches a shell-invoking API or flags (`--output=...`) of an executable without `--` end-of-options separation.
* **Skip when**: An argument array with `shell=false` runs a fixed binary on validated arguments with `--` separating options from positional inputs.

### 25. `unsafe-deserialization`
* **Name**: Deserializing untrusted payloads with arbitrary-object formats
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure uses schema-validated JSON or `yaml.safe_load` / explicit safe allowlists; Fail-Open calls `pickle.loads`, `yaml.load`, `ObjectInputStream`, `BinaryFormatter`, `unserialize`, or `Marshal.load`.
* **The Tell**: Polymorphic or native object serialization (`TypeNameHandling.All`, `ObjectInputStream`, `pickle`, `unserialize`) reading bytes from network, cookies, queues, or uploads.
* **Vulnerable**: `data = pickle.loads(request.data)`
* **Secure**: `data = PayloadSchema.model_validate_json(request.data)`
* **Report when**: Untrusted or externally modifiable bytes (including cookies, caches, or message queues without HMAC integrity from trusted producers) pass into an unsafe deserializer.
* **Skip when**: Using safe data-only parsers (`JSON.parse`, `yaml.safe_load`) or deserializing strictly internal payloads protected by verified AEAD/HMAC signatures.

### 26. `prototype-and-mass-assignment`
* **Name**: Unfiltered object merge or ORM mass assignment
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure extracts an explicit allowlist of schema-validated fields before object assignment or ORM writes; Fail-Open spreads `req.body` into models or deep-merges `__proto__`/`constructor`/`prototype`.
* **The Tell**: `Object.assign(target, req.body)`, recursive `merge(dst, src)` without prototype-key guards, or `User.create(req.body)` passing sensitive fields like `isAdmin`.
* **Vulnerable**: `await db.users.update({ where: { id }, data: req.body });`
* **Secure**: `const patch = UpdateProfileSchema.parse(req.body); await db.users.update({ where: { id }, data: { displayName: patch.displayName } });`
* **Report when**: Raw request objects can overwrite privileged model columns (`role`, `orgId`, `verified`) or pollute object prototypes (`__proto__`, `constructor`).
* **Skip when**: Strict schema parsing strips unknown keys (`z.object(...).strict()` or `strip`) and explicitly maps only user-editable fields.

### 27. `dynamic-code-evaluation`
* **Name**: Evaluating untrusted strings as code, templates, or reflection paths
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure dispatches over static lookup tables or sandbox-free data interpreters; Fail-Open passes user input into `eval`, `Function`, server-side template rendering (`Jinja2(user_str)`), SpEL, or dynamic `send`/`constantize`.
* **The Tell**: Calling `eval`, `new Function`, `vm.runInNewContext`, template-from-string constructors, or `obj[userKey]()` on untrusted strings.
* **Vulnerable**: `return jinja2.Template(user_template).render(ctx=ctx)`
* **Secure**: `return env.get_template("notification.html").render(message=user_message)`
* **Report when**: User-controlled strings can reach code evaluation, dynamic template compilation, expression parsers, or arbitrary method/class resolution.
* **Skip when**: Templates are static pre-registered files on disk and user values only appear as escaped template variables.

### 28. `path-traversal-unbounded-join`
* **Name**: Joining untrusted path segments without root containment verification
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure resolves the canonical real path (`realpath`) and verifies it starts with the canonical base directory plus path separator (or uses safe file-ID lookups); Fail-Open uses raw `path.join` / `filepath.Join`.
* **The Tell**: `path.join(UPLOAD_DIR, req.params.file)` where `../` or symlinks escape `UPLOAD_DIR`.
* **Vulnerable**: `const target = path.join(BASE_DIR, req.query.name); return fs.readFile(target);`
* **Secure**: `const target = resolveContainedPath(BASE_DIR, req.query.name); // realpath + baseDir + sep prefix check`
* **Report when**: Untrusted filenames or archive entry paths (`zip`/`tar` slip) are joined to a base directory without canonical containment and symlink checks.
* **Skip when**: Files are looked up by opaque generated ID from a database or strictly validated against `resolveContainedPath` after symlink resolution.

### 29. `ssrf-unvalidated-outbound-url`
* **Name**: Fetching user-supplied URLs without scheme and IP egress controls
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure allows only `https:` (or `http:` where required), resolves DNS once and blocks loopback, RFC1918 private, link-local (`169.254.0.0/16`), and cloud metadata IPs while disabling or re-validating redirects; Fail-Open passes URLs straight to `fetch`/`requests.get`.
* **The Tell**: `fetch(req.body.webhookUrl)` or image/PDF fetchers accepting arbitrary URLs with redirects enabled.
* **Vulnerable**: `resp = requests.get(payload["callback_url"], timeout=5)`
* **Secure**: `resp = safe_egress_get(payload["callback_url"]) # enforces https, public IP pin, no unsafe redirects`
* **Report when**: Server-side HTTP clients fetch attacker-controlled URLs or follow HTTP redirects without validating resolved IP addresses at connect time.
* **Skip when**: URLs are selected from an exact static allowlist of origins/hosts or routed through a dedicated egress proxy that blocks internal CIDRs.

### 30. `redos-and-missing-size-limits`
* **Name**: Exponential regex backtracking or unbounded request/upload limits
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure uses linear-time regex engines (`re2`), bounded non-backtracking patterns, and explicit body/upload/pagination caps; Fail-Open compiles dynamic regexes or accepts unbounded payloads and page sizes (`limit=10000000`).
* **The Tell**: `new RegExp(userInput)`, nested quantifiers `(a+)+`, unbounded `express.json()` / multipart uploads, or missing `maxLimit` clamping on list queries.
* **Vulnerable**: `const re = new RegExp(req.query.pattern); return re.test(text);`
* **Secure**: `if (req.query.pattern.length > 64) throw new BadRequestError(); return text.includes(req.query.pattern);`
* **Report when**: Untrusted input builds a regex, hits a super-linear regex pattern, or sends unbounded payload sizes, decompression bombs, or page limits.
* **Skip when**: Fixed linear regexes (`re2` or verified safe patterns) run on length-capped strings and body parsers/pagination enforce strict upper bounds.

### 31. `xxe-external-entity-enabled`
* **Name**: XML parsers resolving external entities or DTDs
* **Pillar**: Input Boundaries and Deserialization
* **Fail-Secure vs. Fail-Open**: Fail-Secure disables DTDs and external entities (`disallow-doctype-decl`, `defusedxml`); Fail-Open leaves default XML parser entity expansion enabled, exposing local file read and SSRF.
* **The Tell**: Default `DocumentBuilderFactory`, `lxml.etree.XMLParser()`, or `libxml` parsing untrusted XML without disabling DTDs.
* **Vulnerable**: `tree = lxml.etree.fromstring(xml_bytes)`
* **Secure**: `tree = defusedxml.ElementTree.fromstring(xml_bytes)`
* **Report when**: Untrusted XML (including SVG, DOCX, SAML, SOAP) is parsed without explicitly disabling DTDs and external entity resolution.
* **Skip when**: Using `defusedxml` or a parser explicitly configured with `disallow-doctype-decl=true` and external entities disabled.

---

## 5. Cryptography Ergonomics

### 32. `jwt-algorithm-confusion`
* **Name**: Trusting JWT header `alg` or mixing asymmetric and HMAC keys
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure pins an explicit allowlist of expected asymmetric or symmetric algorithms (`algorithms: ["EdDSA"]`) in verification calls; Fail-Open honors `alg: none` or verifies HS256 using an RSA public key.
* **The Tell**: `jwt.verify(token, key)` without `algorithms: [...]`, or `jwt.decode` without signature verification.
* **Vulnerable**: `const claims = jwt.verify(token, publicOrSecretKey);`
* **Secure**: `const claims = jwt.verify(token, publicKey, { algorithms: ["RS256"], issuer: EXPECTED_ISS, audience: EXPECTED_AUD });`
* **Report when**: JWT verification omits an explicit non-empty `algorithms` allowlist, permits `"none"`, or shares one key parameter across HMAC and asymmetric algorithms.
* **Skip when**: Verification hardcodes a single expected algorithm (for example `["EdDSA"]` or `["ES256"]`) and validates `iss`, `aud`, and `exp`.

### 33. `caller-chosen-cipher-or-hash`
* **Name**: Algorithm agility exposing insecure cipher or hash selection
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure hardcodes modern algorithms (`AES-256-GCM`, `SHA-256`) or restricts versioned protocol suites to an explicit safe enum; Fail-Open lets strings like `"md5"` or `"rc4"` drive `createCipheriv`/`hashlib.new`.
* **The Tell**: Passing request parameters, URL fields, or unvalidated config strings directly into `crypto.createHash(alg)` or `Cipher.getInstance(alg)`.
* **Vulnerable**: `function sign(data: Buffer, alg = "sha256") { return crypto.createHash(alg).update(data).digest(); }`
* **Secure**: `const ALLOWED_DIGESTS = new Set(["sha256", "sha512"] as const);`
* **Report when**: Callers or unvalidated config strings can downgrade a cryptographic primitive to MD5, SHA-1, DES, 3DES, RC4, or ECB.
* **Skip when**: Algorithm selection maps a narrow static enum of approved algorithms (`AES-256-GCM`, `ChaCha20-Poly1305`) and rejects unknown values.

### 34. `non-aead-or-ecb-encryption`
* **Name**: Unauthenticated block cipher modes or weak legacy ciphers
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure uses AEAD (`AES-256-GCM`, `ChaCha20-Poly1305`) verifying authentication tags before returning plaintext; Fail-Open uses ECB mode, unauthenticated CBC/CTR, DES, or RC4.
* **The Tell**: `AES/ECB/PKCS5Padding`, `aes-256-cbc` without Encrypt-then-MAC, or deprecated ciphers (`DES`, `Blowfish`, `RC4`).
* **Vulnerable**: `Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");`
* **Secure**: `Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");`
* **Report when**: Symmetric encryption uses ECB mode, legacy weak ciphers, or CBC/CTR without an authenticated Encrypt-then-MAC integrity tag.
* **Skip when**: An authenticated AEAD cipher verifies the tag, or legacy CBC is strictly wrapped in verified Encrypt-then-MAC for an explicit compatibility boundary.

### 35. `nonce-or-iv-reuse`
* **Name**: Static, zero, or caller-controlled IVs and nonces
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure generates fresh 96-bit CSPRNG nonces (or XChaCha20 192-bit nonces) inside the encryption wrapper and binds AAD; Fail-Open hardcodes `iv = b"\x00" * 16` or accepts the IV from callers without uniqueness guarantees.
* **The Tell**: Constant IV arrays, `Buffer.alloc(12, 0)`, or `encrypt(key, iv, plaintext)` forcing callers to supply nonces.
* **Vulnerable**: `const iv = Buffer.alloc(12, 0); const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);`
* **Secure**: `const nonce = crypto.randomBytes(12); // generated inside seal(), prepended to ciphertext + tag`
* **Report when**: An IV/nonce is constant, zero-filled, derived deterministically from a repeated input under AES-GCM/CTR/ChaCha20, or caller-supplied without uniqueness tracking.
* **Skip when**: Fresh CSPRNG nonces (12 bytes for AES-GCM at bounded volume, or 24 bytes for XChaCha20-Poly1305) or atomic monotonic counters generate unique nonces per key inside the wrapper.

### 36. `swappable-primitive-parameters`
* **Name**: Untyped byte/string arguments allowing key, nonce, and plaintext transposition
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure exposes semantic types (`EncryptionKey`, `CiphertextBlob`) and bundles nonce plus tag inside the envelope; Fail-Open takes `(key: Buffer, iv: Buffer, data: Buffer)` where argument swaps compile cleanly.
* **The Tell**: Crypto helpers taking multiple raw `string` or `bytes`/`Buffer` parameters for keys, salts, nonces, and plaintexts.
* **Vulnerable**: `export function encrypt(key: Buffer, iv: Buffer, aad: Buffer, plaintext: Buffer): Buffer`
* **Secure**: `export function seal(key: SecretKey, plaintext: Uint8Array, context: AssociatedData): SealedEnvelope`
* **Report when**: Public internal crypto wrappers accept interchangeable untyped byte/string parameters that can silently swap key, nonce, AAD, or plaintext.
* **Skip when**: A single high-level wrapper (`seal(key, plaintext)`) manages nonces internally and accepts typed key wrappers.

### 37. `missing-domain-separation`
* **Name**: Reusing a raw key across unrelated cryptographic purposes
* **Pillar**: Cryptography Ergonomics
* **Fail-Secure vs. Fail-Open**: Fail-Secure derives subkeys with HKDF (`info = "session-signing-v1"`) or domain-tagged inputs; Fail-Open passes the same master secret directly to JWT signing, encryption, and webhook HMACs.
* **The Tell**: Using `MASTER_KEY` directly as both encryption key and HMAC key, or signing payloads across multiple message types without a domain prefix.
* **Vulnerable**: `const hmacKey = process.env.APP_SECRET; const aesKey = Buffer.from(process.env.APP_SECRET);`
* **Secure**: `const hmacKey = hkdfSync("sha256", masterKey, salt, Buffer.from("webhook-hmac-v1"), 32);`
* **Report when**: One secret key is passed directly into distinct cryptographic primitives or contexts (encryption + MAC, reset tokens + session cookies) without KDF domain separation.
* **Skip when**: Distinct derived keys (`hkdf(..., info=...)`) or separate provisioned secrets isolate each purpose.

---

## 6. Error Handling and Observability

### 38. `stack-trace-or-driver-leak`
* **Name**: Exposing stack traces, raw exceptions, or SQL errors to clients
* **Pillar**: Error Handling and Observability
* **Fail-Secure vs. Fail-Open**: Fail-Secure logs full diagnostics with a correlation ID server-side and returns a generic client error; Fail-Open serializes `err.stack`, `traceback.format_exc()`, or `e.getMessage()` in HTTP responses.
* **The Tell**: `res.status(500).json({ error: err.message, stack: err.stack })` or Flask/Django/Spring error handlers dumping tracebacks.
* **Vulnerable**: `except Exception as e: return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500`
* **Secure**: `except Exception: logger.exception("request_failed", extra={"request_id": req_id}); return jsonify({"error": "Internal error", "request_id": req_id}), 500`
* **Report when**: Production HTTP/gRPC/GraphQL responses include stack traces, file paths, SQL queries, driver messages, or raw unhandled exception text.
* **Skip when**: Detailed diagnostics are strictly gated to local-only development builds and never serialized in production error middleware.

### 39. `production-debug-surface`
* **Name**: Debug consoles, introspection, or diagnostic endpoints enabled in production
* **Pillar**: Error Handling and Observability
* **Fail-Secure vs. Fail-Open**: Fail-Secure disables debug servers, GraphQL introspection/playground, Swagger UI, and `/debug/pprof` unless explicitly authorized; Fail-Open leaves them enabled by default.
* **The Tell**: `introspection: true`, `playground: true`, Flask `debug=True`, Django `DEBUG = True`, or unauthenticated `/actuator/*` / `/metrics` endpoints.
* **Vulnerable**: `new ApolloServer({ typeDefs, resolvers, introspection: true });`
* **Secure**: `new ApolloServer({ typeDefs, resolvers, introspection: process.env.NODE_ENV === "development" });`
* **Report when**: Production configurations enable debug mode, interactive query playgrounds, GraphQL introspection (when private schema), or unauthenticated diagnostic endpoints.
* **Skip when**: Explicitly gated to local dev or protected behind internal network mTLS and administrative auth.

### 40. `swallowed-security-exception`
* **Name**: Catching security check failures and falling through cleanly
* **Pillar**: Error Handling and Observability
* **Fail-Secure vs. Fail-Open**: Fail-Secure treats any exception in signature verification, auth middleware, rate limiting, or policy lookup as denial (fail-closed); Fail-Open catches errors and returns `true`, `null`, or calls `next()`.
* **The Tell**: `try { verifyToken(t); } catch { /* ignore */ }` or Redis rate-limiter catch blocks letting requests pass unthrottled without explicit fail-closed policy.
* **Vulnerable**: `try { await checkPermission(user, resource); } catch (err) { logger.warn(err); } // proceeds!`
* **Secure**: `try { return await checkPermission(user, resource); } catch (err) { logger.error(err); throw new ForbiddenError(); }`
* **Report when**: Exceptions during auth, signature, schema validation, or authorization checks are swallowed and allow execution to continue.
* **Skip when**: The catch block explicitly rejects the request (`401`/`403`/`503`), except where an audited availability-critical rate limiter deliberately documents a fail-open circuit breaker.

### 41. `sensitive-data-in-logs`
* **Name**: Logging credentials, tokens, session cookies, or private keys
* **Pillar**: Error Handling and Observability
* **Fail-Secure vs. Fail-Open**: Fail-Secure redacts `Authorization`, `Cookie`, `Set-Cookie`, `password`, and secret fields at the logger serializer; Fail-Open dumps full request headers, bodies, or env maps into logs.
* **The Tell**: `logger.info("request", req.headers)`, `console.log(req.body)` on `/login`, or printing exception frames containing secret variables.
* **Vulnerable**: `logger.info("Auth attempt", { email, password, headers: req.headers });`
* **Secure**: `logger.info("Auth attempt", { emailHash: hashEmailForLog(email), requestId });`
* **Report when**: Passwords, session IDs, bearer tokens, API keys, PII secrets, or full `req.headers`/`req.body` on auth endpoints are written to logs or telemetry.
* **Skip when**: Logger redaction filters strip sensitive keys (`redact: ["req.headers.authorization", "*.password", "*.token"]`) before serialization.

### 42. `padding-or-timing-oracle-errors`
* **Name**: Distinguishable crypto or validation errors creating state oracles
* **Pillar**: Error Handling and Observability
* **Fail-Secure vs. Fail-Open**: Fail-Secure returns a single opaque decryption/authentication error after constant-work verification; Fail-Open distinguishes `"Invalid padding"`, `"Bad MAC"`, and `"Unknown key ID"`.
* **The Tell**: Returning distinct HTTP messages or error codes for PKCS#7 padding errors vs. MAC mismatch vs. malformed ciphertext.
* **Vulnerable**: `except PaddingError: raise BadRequest("Invalid padding") except MacError: raise BadRequest("Invalid MAC")`
* **Secure**: `except CryptoError: raise Unauthorized("Invalid token")`
* **Report when**: Public endpoints expose distinct error types or timing differences between padding failures, MAC failures, or signature decode steps.
* **Skip when**: AEAD verification validates the tag before decryption and collapses all crypto failures into a single uniform error.
