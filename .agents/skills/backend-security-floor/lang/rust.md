# Rust Backend Security Rules

Language-specific sharp edges for Axum, Actix-web, Tokio, and Rust systems services.

### 1. `rs-unsafe-ffi-invariants`
* **The Tell**: `unsafe` blocks calling `slice::from_raw_parts`, `transmute`, or raw FFI pointer dereferences without documented `// SAFETY:` invariants and runtime bounds/null/alignment validation.
* **Vulnerable**:
```rust
pub unsafe fn parse_frame(ptr: *const u8, len: usize) -> &[u8] {
    std::slice::from_raw_parts(ptr, len) // UB if ptr is null or len exceeds allocation
}
```
* **Secure**:
```rust
pub fn parse_frame(bytes: &[u8], len: usize) -> Result<&[u8], FrameError> {
    bytes.get(..len).ok_or(FrameError::OutOfBounds)
}
```
* **Report when**: `unsafe` pointer/slice construction lacks checked bounds, null checks, lifetime anchoring, or `// SAFETY:` invariant proof against untrusted sizes.
* **Skip when**: Pure safe Rust slices (`bytes.get(...)`) or audited FFI wrappers validate null, alignment, and length before entering `unsafe`.

### 2. `rs-release-integer-overflow`
* **The Tell**: Arithmetic (`+`, `-`, `*`) on buffer sizes, offsets, balances, or TTL timestamps that panics in debug mode but silently wraps modulo `2^N` in `--release` builds.
* **Vulnerable**:
```rust
let total_bytes = header_len + body_len; // wraps to small value in release if header_len is huge
let expires_at = now_secs + ttl_secs;
```
* **Secure**:
```rust
let total_bytes = header_len.checked_add(body_len).ok_or(ParseError::Overflow)?;
let expires_at = now_secs.checked_add(ttl_secs).ok_or(AuthError::InvalidTtl)?;
```
* **Report when**: Untrusted counts, sizes, offsets, financial amounts, or timestamps perform unchecked integer arithmetic in release-compiled paths.
* **Skip when**: Using `checked_*`, `saturating_*`, or validated `NonZero*` bounded domain types.

### 3. `rs-unwrap-panic-dos`
* **The Tell**: Calling `.unwrap()`, `.expect()`, or unchecked `slice[i]` on untrusted headers, JSON fields, base64/hex decoders, or network frames inside request handlers.
* **Vulnerable**:
```rust
let token = req.headers().get("authorization").unwrap().to_str().unwrap();
```
* **Secure**:
```rust
let token = req.headers().get("authorization")
    .and_then(|v| v.to_str().ok())
    .ok_or(ApiError::Unauthorized)?;
```
* **Report when**: Request-reachable paths invoke `.unwrap()`, `.expect()`, or unchecked indexing on caller-influenced inputs (remote panic DoS).
* **Skip when**: Errors propagate cleanly via `?`, `ok_or(...)`, or `.get(...)`, or `.expect()` documents an unreachable compile-time constant invariant.

### 4. `rs-non-constant-time-subtle`
* **The Tell**: Comparing MACs, webhook signatures, or secret tokens with `==` (`PartialEq`) instead of `subtle::ConstantTimeEq` or `hmac::Mac::verify_slice`.
* **Vulnerable**:
```rust
if provided_mac == expected_mac { Ok(()) } else { Err(AuthError) }
```
* **Secure**:
```rust
use subtle::ConstantTimeEq;
if !expected_mac.is_empty() && bool::from(provided_mac.ct_eq(expected_mac)) {
    Ok(())
} else {
    Err(AuthError)
}
```
* **Report when**: `==` / `!=` compares secret slices, HMAC outputs, or tokens.
* **Skip when**: Verification uses `subtle::ConstantTimeEq` or `ring::hmac::verify` / `hmac::Mac::verify_slice` with non-empty keys.

### 5. `rs-async-lock-and-raw-sql`
* **The Tell**: Holding `std::sync::MutexGuard` across `.await` points (blocking executor worker threads) or formatting untrusted values into `sqlx::raw_sql(&format!(...))`.
* **Vulnerable**:
```rust
let guard = state.cache.lock().unwrap();
db.fetch_user(&guard.key).await?; // std::sync::Mutex held across await!
let q = sqlx::raw_sql(&format!("SELECT * FROM users WHERE email = '{}'", email));
```
* **Secure**:
```rust
let key = { state.cache.lock().map_err(|_| ApiError::Internal)?.key.clone() };
let user = sqlx::query!("SELECT id, email FROM users WHERE email = $1", email)
    .fetch_optional(&pool)
    .await?;
```
* **Report when**: `std::sync::Mutex` stays locked across `.await` or SQL strings interpolate user input instead of bound `sqlx::query` parameters.
* **Skip when**: Synchronous locks drop before `.await` (or use `tokio::sync::Mutex`) and queries bind parameters via `$1`/`?`.

### 6. `rs-command-shell-c`
* **The Tell**: Spawning `std::process::Command::new("sh").args(["-c", &format!(...)])` with untrusted inputs.
* **Vulnerable**:
```rust
Command::new("sh").args(["-c", &format!("tar -xf {}", archive_name)]).status()?;
```
* **Secure**:
```rust
Command::new("tar").args(["-xf", "--", safe_archive_path]).status()?;
```
* **Report when**: `Command` invokes a shell (`sh -c`, `cmd /C`) with interpolated user strings.
* **Skip when**: `Command::new(binary)` passes arguments directly via `.args([...])` with `--` option termination.
