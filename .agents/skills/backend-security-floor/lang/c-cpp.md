# C and C++ Backend Security Rules

Language-specific sharp edges for C and C++ services, native extensions, and FFI boundaries.

### 1. `cpp-unbounded-string-format`
* **The Tell**: Unbounded C string copies (`strcpy`, `strcat`, `sprintf`, `gets`) or passing untrusted strings directly as the format argument to `printf(msg)` / `snprintf(buf, n, msg)`.
* **Vulnerable**:
```c
char buf[128];
sprintf(buf, "/var/app/%s", user_path);
syslog(LOG_INFO, user_msg);
```
* **Secure**:
```c
char buf[128];
int n = snprintf(buf, sizeof(buf), "/var/app/%s", user_path);
if (n < 0 || (size_t)n >= sizeof(buf)) return ERR_OVERFLOW;
syslog(LOG_INFO, "%s", user_msg);
```
* **Report when**: Fixed buffers receive unbounded writes or an attacker-controlled string sits in the format-string slot of `printf`-family or `syslog` functions.
* **Skip when**: Using bounded `std::string`/`std::format` with compile-time format literals, or `snprintf` checks truncation before continuing.

### 2. `cpp-use-after-free-double-free`
* **The Tell**: Manual `free()`/`delete` without setting pointers to `NULL`, returning pointers to stack frames, or sharing raw owning pointers across error paths.
* **Vulnerable**:
```c
void handle_req(Session *s) {
    if (!validate(s)) free(s);
    audit_log(s->user_id); // use-after-free when invalid
}
```
* **Secure**:
```cpp
void handle_req(std::unique_ptr<Session> s) {
    if (!validate(*s)) return;
    audit_log(s->user_id);
}
```
* **Report when**: Any error branch or callback can dereference or re-free memory after ownership was released.
* **Skip when**: Ownership is managed exclusively via RAII (`std::unique_ptr`), or C cleanup uses a single `goto cleanup;` exit path where pointers are nulled on free.

### 3. `cpp-integer-overflow-allocation`
* **The Tell**: Computing `count * elem_size` or `len + header` in fixed-width integers before `malloc`, wrapping around to allocate a tiny buffer followed by a large `memcpy`.
* **Vulnerable**:
```c
size_t total = count * sizeof(Item);
Item *items = malloc(total);
memcpy(items, raw, count * sizeof(Item));
```
* **Secure**:
```c
size_t total;
if (__builtin_mul_overflow(count, sizeof(Item), &total)) return ERR_RANGE;
Item *items = calloc(count, sizeof(Item));
```
* **Report when**: Network-derived counts or sizes multiply or add without overflow guards prior to heap allocation or bounds checks.
* **Skip when**: Checked arithmetic (`__builtin_mul_overflow`, `std::checked_mul`, `SafeInt`, or `calloc`) or validated strict upper bounds guard the allocation.

### 4. `cpp-insecure-rand`
* **The Tell**: Calling `rand()`, `random()`, or `srand(time(NULL))` for session IDs, nonces, salts, or API keys.
* **Vulnerable**:
```c
srand((unsigned)time(NULL));
for (size_t i = 0; i < len; i++) token[i] = (uint8_t)rand();
```
* **Secure**:
```c
#include <sys/random.h>
if (getrandom(token, len, 0) != (ssize_t)len) abort();
```
* **Report when**: `rand()` or `std::default_random_engine` produces any security token, key, IV, or challenge.
* **Skip when**: Used solely for non-security simulation, Monte Carlo sampling, or deterministic test data.

### 5. `cpp-non-constant-time-memcmp`
* **The Tell**: Using `memcmp()`, `strcmp()`, or `std::equal` to verify HMAC tags, signatures, or password digests.
* **Vulnerable**:
```c
if (memcmp(expected_mac, actual_mac, 32) == 0) return AUTH_OK;
```
* **Secure**:
```c
#include <openssl/crypto.h>
if (expected_len == actual_len && CRYPTO_memcmp(expected_mac, actual_mac, 32) == 0) return AUTH_OK;
```
* **Report when**: Variable-time `memcmp` or `strcmp` compares secret bytes in authentication, decryption, or webhook validation paths.
* **Skip when**: Using `CRYPTO_memcmp`, `sodium_memcmp`, or a volatile-accumulated constant-time byte loop on equal-length non-empty buffers.

### 6. `cpp-dead-store-zeroize`
* **The Tell**: Calling plain `memset(secret, 0, len)` right before `free()` or function return, which `-O2`/`-O3` compilers eliminate as dead stores.
* **Vulnerable**:
```c
memset(private_key, 0, sizeof(private_key));
free(private_key);
```
* **Secure**:
```c
explicit_bzero(private_key, key_len); // or SecureZeroMemory / OPENSSL_cleanse
free(private_key);
```
* **Report when**: Secret key material or plaintext passwords are cleared with plain `memset` immediately before scope exit or `free`.
* **Skip when**: Using `explicit_bzero`, `memset_explicit` (C23), `SecureZeroMemory`, `OPENSSL_cleanse`, or `sodium_memzero`.
