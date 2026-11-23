# PHP Backend Security Rules

Language-specific sharp edges for Laravel, Symfony, and modern PHP 8+ backends.

### 1. `php-unsafe-unserialize`
* **The Tell**: Calling `unserialize($payload)` without `['allowed_classes' => false]` on cookies, cache values, or request inputs, enabling PHP Object Injection (POP chains).
* **Vulnerable**:
```php
$prefs = unserialize($_COOKIE['prefs']);
```
* **Secure**:
```php
$prefs = json_decode($_COOKIE['prefs'], true, 512, JSON_THROW_ON_ERROR);
```
* **Report when**: `unserialize()` accepts untrusted or client-stored data without `['allowed_classes' => false]` (and even then prefer JSON).
* **Skip when**: Parsing JSON with `JSON_THROW_ON_ERROR` into associative arrays/DTOs.

### 2. `php-loose-comparison-magic-hash`
* **The Tell**: Using `==`, `!=`, `switch`, or `in_array($val, $list)` (default `$strict = false`) on tokens, hashes, or roles; `"0e1234" == "0e9999"` and `"0" == "admin"` evaluate true in PHP loose coercion.
* **Vulnerable**:
```php
if ($providedToken == $storedToken || in_array($role, ['admin', 'editor'])) { ... }
```
* **Secure**:
```php
if (is_string($providedToken) && $storedToken !== '' && hash_equals($storedToken, $providedToken)) { ... }
if (in_array($role, ['admin', 'editor'], true)) { ... }
```
* **Report when**: Loose `==` / `!=` or non-strict `in_array` / `array_search` compares credentials, hashes, or authorization roles.
* **Skip when**: `hash_equals()` checks non-empty secret strings and `===` / `in_array(..., true)` checks typed enums or identifiers.

### 3. `php-non-constant-time-hash-equals`
* **The Tell**: Comparing HMAC tags, CSRF tokens, or webhook signatures with `===` or `strcmp()` instead of `hash_equals()`.
* **Vulnerable**:
```php
if (hash_hmac('sha256', $body, $secret) === $sigHeader) { return true; }
```
* **Secure**:
```php
if ($secret === '' || !is_string($sigHeader)) { return false; }
$expected = hash_hmac('sha256', $body, $secret);
return hash_equals($expected, $sigHeader);
```
* **Report when**: Variable-time `===` or `strcmp` verifies cryptographic tags, signatures, or secret API tokens.
* **Skip when**: `hash_equals()` runs after verifying both inputs are non-empty strings.

### 4. `php-shell-exec-injection`
* **The Tell**: Passing interpolated strings to `shell_exec`, `exec`, `system`, `passthru`, or backticks without `escapeshellarg()` or `proc_open` array arguments.
* **Vulnerable**:
```php
$out = shell_exec("pdftotext " . $_GET['file'] . " -");
```
* **Secure**:
```php
$proc = proc_open(['pdftotext', '--', $validatedPath, '-'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
```
* **Report when**: User-influenced strings concatenate into shell execution calls or unescaped arguments.
* **Skip when**: `proc_open` receives an array command (bypassing `/bin/sh`) with validated paths and `--` end-of-options markers.

### 5. `php-lfi-rfi-include`
* **The Tell**: Passing request variables or database values into `include`, `include_once`, `require`, or `require_once` (allowing `../` traversal or `php://filter` stream wrappers).
* **Vulnerable**:
```php
include __DIR__ . "/pages/" . $_GET['page'] . ".php";
```
* **Secure**:
```php
$allowed = ['home' => 'home.php', 'profile' => 'profile.php'];
$template = $allowed[$_GET['page'] ?? ''] ?? abort(404);
require __DIR__ . '/pages/' . $template;
```
* **Report when**: Dynamic variables influence file paths passed to `include`/`require` without a static map lookup.
* **Skip when**: Included path comes strictly from a hardcoded allowlist dictionary.

### 6. `php-weak-prng-and-hash`
* **The Tell**: Generating tokens with `rand()`, `mt_rand()`, `uniqid()`, or hashing passwords with `md5()`/`sha1()`.
* **Vulnerable**:
```php
$token = md5(uniqid((string)mt_rand(), true));
$pwHash = sha1($password);
```
* **Secure**:
```php
$token = bin2hex(random_bytes(32));
$pwHash = password_hash($password, PASSWORD_ARGON2ID);
```
* **Report when**: Weak PRNGs or fast hashes generate tokens or store user passwords.
* **Skip when**: `random_bytes()` / `random_int()` generate tokens and `password_hash()` with `PASSWORD_ARGON2ID` or `PASSWORD_BCRYPT` hashes passwords.
