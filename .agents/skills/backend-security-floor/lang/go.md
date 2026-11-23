# Go Backend Security Rules

Language-specific sharp edges for Go HTTP services, gRPC servers, and CLI/daemon backends.

### 1. `go-text-template-xss`
* **The Tell**: Importing `"text/template"` instead of `"html/template"` when rendering HTML pages, emails, or error views with user data.
* **Vulnerable**:
```go
import "text/template"
tmpl := template.Must(template.New("msg").Parse("<p>{{.Body}}</p>"))
_ = tmpl.Execute(w, data)
```
* **Secure**:
```go
import "html/template"
tmpl := template.Must(template.New("msg").Parse("<p>{{.Body}}</p>"))
_ = tmpl.Execute(w, data)
```
* **Report when**: `text/template` writes HTML, SVG, or script-bearing markup containing untrusted input.
* **Skip when**: `text/template` generates non-HTML plain text, or `html/template` renders HTML without `template.HTML` bypasses on untrusted strings.

### 2. `go-math-rand-secrets`
* **The Tell**: Using `math/rand` or `math/rand/v2` to generate session tokens, API keys, CSRF tokens, or OTPs.
* **Vulnerable**:
```go
import "math/rand"
token := fmt.Sprintf("%016x", rand.Uint64())
```
* **Secure**:
```go
import "crypto/rand"
buf := make([]byte, 32)
if _, err := rand.Read(buf); err != nil {
    return "", err
}
token := base64.RawURLEncoding.EncodeToString(buf)
```
* **Report when**: `math/rand` or `math/rand/v2` produces any secret, bearer credential, verification code, or cryptographic nonce.
* **Skip when**: Used only for backoff jitter, load balancing, or non-security sampling.

### 3. `go-tls-insecure-skip-verify`
* **The Tell**: Setting `InsecureSkipVerify: true` in `&tls.Config{}` on HTTP, gRPC, database, or webhook clients.
* **Vulnerable**:
```go
client := &http.Client{
    Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},
}
```
* **Secure**:
```go
pool := loadCustomCAPool(caPath)
client := &http.Client{
    Transport: &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: pool}},
}
```
* **Report when**: `InsecureSkipVerify: true` appears in production client configuration without custom `VerifyPeerCertificate` verification.
* **Skip when**: Strictly isolated in `_test.go` against `httptest.NewTLSServer` or replaced with a dedicated `RootCAs` cert pool.

### 4. `go-filepath-join-traversal`
* **The Tell**: Calling `filepath.Join(baseDir, userInput)` without validating containment; `filepath.Join` cleans `../../etc/passwd` cleanly out of `baseDir`.
* **Vulnerable**:
```go
target := filepath.Join(uploadRoot, r.URL.Query().Get("file"))
data, err := os.ReadFile(target)
```
* **Secure**:
```go
root, err := os.OpenRoot(uploadRoot) // Go 1.24+; or filepath.EvalSymlinks + filepath.Rel containment check
if err != nil { return err }
defer root.Close()
data, err := root.ReadFile(name)
```
* **Report when**: `filepath.Join` concatenates user-controlled paths or archive entries (`zip`/`tar`) without `os.Root` or `EvalSymlinks` + `filepath.Rel` non-escape verification.
* **Skip when**: Files are accessed through `os.Root`, or resolved canonical paths verify `rel != ".."` and `!strings.HasPrefix(rel, ".."+string(os.PathSeparator))`.

### 5. `go-sql-sprintf`
* **The Tell**: Building SQL queries via `fmt.Sprintf` or `+` before calling `db.QueryContext` / `db.ExecContext` / GORM `Raw`.
* **Vulnerable**:
```go
q := fmt.Sprintf("SELECT id FROM users WHERE email = '%s'", email)
row := db.QueryRowContext(ctx, q)
```
* **Secure**:
```go
row := db.QueryRowContext(ctx, "SELECT id FROM users WHERE email = $1", email)
```
* **Report when**: Formatted strings enter SQL execution calls, including dynamic `ORDER BY` or `IN (...)` clauses built from request strings.
* **Skip when**: Parameter placeholders (`$1`, `?`) bind all user values and dynamic column names map via a static `map[string]string` allowlist.

### 6. `go-constant-time-compare`
* **The Tell**: Checking signatures, webhook HMACs, or bearer tokens with `==` or `bytes.Equal`.
* **Vulnerable**:
```go
if !hmac.Equal(got, want) && string(got) == expectedSecret { ... }
if token == storedToken { return true }
```
* **Secure**:
```go
if len(want) == 0 || subtle.ConstantTimeCompare(got, want) != 1 {
    return ErrUnauthorized
}
```
* **Report when**: `==`, `!=`, or `bytes.Equal` compares MACs, tokens, or secret strings, or `ConstantTimeCompare` lacks a non-empty check.
* **Skip when**: Using `hmac.Equal` or `subtle.ConstantTimeCompare` on non-empty secrets.

### 7. `go-goroutine-race-toctou`
* **The Tell**: Concurrent HTTP handlers mutating shared maps/caches/counters or running check-then-act quota/balance updates without `sync.Mutex` or DB transactions.
* **Vulnerable**:
```go
if balance >= amount {
    _, _ = db.Exec("UPDATE wallets SET balance = balance - $1 WHERE id = $2", amount, id)
}
```
* **Secure**:
```go
res, err := db.ExecContext(ctx, "UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1", amount, id)
```
* **Report when**: Shared state in goroutines lacks synchronization (`go test -race` hazard) or authorization/balance checks run outside atomic SQL predicates/locks.
* **Skip when**: State transitions execute atomically in SQL/Redis Lua or are serialized under a lock held across the full check-and-update window.
