# JavaScript and TypeScript Backend Security Rules

Language-specific sharp edges for Node.js, Deno, Bun, Express, Fastify, and TypeScript APIs.

### 1. `js-prototype-pollution`
* **The Tell**: Recursive object merges or bracket writes (`target[key] = val`) using untrusted keys without blocking `__proto__`, `constructor`, and `prototype`.
* **Vulnerable**:
```ts
function merge(target: Record<string, any>, src: Record<string, any>) {
  for (const key of Object.keys(src)) {
    if (typeof src[key] === "object") merge(target[key] ??= {}, src[key]);
    else target[key] = src[key];
  }
}
```
* **Secure**:
```ts
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function safePick<T extends object>(src: Record<string, unknown>, allowed: readonly (keyof T)[]): Partial<T> {
  const out = Object.create(null);
  for (const k of allowed) {
    if (!BLOCKED_KEYS.has(String(k)) && Object.hasOwn(src, k)) out[k] = src[k];
  }
  return out;
}
```
* **Report when**: Untrusted JSON keys flow into dynamic property writes or recursive merge helpers without key filtering or `Map` / `Object.create(null)` isolation.
* **Skip when**: Schema validation (`zod`, `valibot`) parses explicit allowlisted keys into a flat object before assignment.

### 2. `js-redos-dynamic-regexp`
* **The Tell**: Constructing `new RegExp(userInput)` or running nested quantifier patterns (`/^(a+)+$/`) on unbounded request strings, stalling the single-threaded event loop.
* **Vulnerable**:
```ts
const matcher = new RegExp(req.query.q as string, "i");
return items.filter((i) => matcher.test(i.name));
```
* **Secure**:
```ts
const query = String(req.query.q ?? "").slice(0, 128).toLowerCase();
return items.filter((i) => i.name.toLowerCase().includes(query));
```
* **Report when**: User strings compile into `RegExp` without escaping/length limits, or static regexes contain nested ambiguous quantifiers on unvalidated input.
* **Skip when**: Plain substring matching (`includes`), escaped fixed-max literals, or `re2` linear-time evaluation handles bounded inputs.

### 3. `js-missing-await-auth`
* **The Tell**: Calling an `async` authentication, signature, or permission helper without `await`; the returned `Promise` object is always truthy in `if (verifySession(req))`.
* **Vulnerable**:
```ts
if (!verifyAccessToken(req.headers.authorization)) {
  return res.status(401).end(); // Promise is truthy, !Promise is always false!
}
```
* **Secure**:
```ts
const session = await verifyAccessToken(req.headers.authorization);
if (!session) {
  return res.status(401).end();
}
```
* **Report when**: Any `async` or `Promise<boolean | Session | null>` security check is evaluated directly in a conditional without `await`.
* **Skip when**: The check is strictly synchronous and typed not to return a `Promise` (enforced by `@typescript-eslint/no-floating-promises` and `no-misused-promises`).

### 4. `js-eval-new-function`
* **The Tell**: Passing request-derived expressions or templates into `eval()`, `new Function()`, or Node's `vm.runInNewContext()` (which is not a security sandbox).
* **Vulnerable**:
```ts
const fn = new Function("row", `return ${req.body.formula}`);
```
* **Secure**:
```ts
const expr = FormulaAstSchema.parse(req.body.formula); // evaluate whitelisted AST ops only
```
* **Report when**: Untrusted strings reach `eval`, `Function`, `vm.*`, or dynamic `require(userPath)` / `import(userPath)`.
* **Skip when**: Evaluating strictly static compile-time modules or a non-eval AST interpreter restricted to safe arithmetic/boolean nodes.

### 5. `ts-as-assertion-lie`
* **The Tell**: Using TypeScript `as UserInput` or `<AdminPayload>JSON.parse(raw)` at trust boundaries; type assertions vanish at runtime and leave `role`, `__proto__`, or types unverified.
* **Vulnerable**:
```ts
const payload = JSON.parse(rawBody) as { userId: string; role: "member" };
await updateUser(payload); // attacker sent { userId, role: "admin" }
```
* **Secure**:
```ts
const PayloadSchema = z.object({ userId: z.string().uuid(), name: z.string().max(100) }).strict();
const payload = PayloadSchema.parse(JSON.parse(rawBody));
```
* **Report when**: HTTP bodies, query params, JWT claims, headers, or queue payloads are narrowed with `as` without runtime validation.
* **Skip when**: Runtime schema parsing (`zod`, `valibot`, `arktype`, `typebox`) validates the exact fields before downstream use.

### 6. `js-env-fallback-and-timing`
* **The Tell**: Writing `process.env.JWT_SECRET || "dev-secret"`, generating tokens with `Math.random()`, or comparing signatures with `===`.
* **Vulnerable**:
```ts
const secret = process.env.WEBHOOK_SECRET || "fallback";
if (req.headers["x-sig"] === expectedSig) next();
```
* **Secure**:
```ts
const secret = process.env.WEBHOOK_SECRET;
if (!secret) throw new Error("WEBHOOK_SECRET is required");
const a = Buffer.from(sigHeader, "utf8");
const b = Buffer.from(expectedSig, "utf8");
if (a.length === 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).end();
```
* **Report when**: Fallback literals keep signing/auth operational, `Math.random()` mints secrets, or `===` compares MACs/tokens.
* **Skip when**: Startup throws on missing env vars, `crypto.randomBytes` generates secrets, and `crypto.timingSafeEqual` verifies equal-length non-empty buffers.

### 7. `js-exec-shell-injection`
* **The Tell**: Calling `child_process.exec`, `execSync`, or `spawn(..., { shell: true })` with interpolated request data.
* **Vulnerable**:
```ts
exec(`git show ${req.query.ref}:README.md`);
```
* **Secure**:
```ts
execFile("git", ["show", `${validatedSha}:README.md`], { shell: false });
```
* **Report when**: Untrusted inputs reach `child_process.exec`, `execSync`, or `spawn` with `shell: true`.
* **Skip when**: `execFile` or `spawn` with `shell: false` passes an argv array to a fixed binary with validated arguments.
