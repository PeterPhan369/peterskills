# Python Backend Security Rules

Language-specific sharp edges for FastAPI, Django, Flask, and Python backend services.

### 1. `py-pickle-yaml-deserialization`
* **The Tell**: Deserializing untrusted inputs, Redis/cache blobs, or job payloads with `pickle.loads`, `marshal.loads`, `shelve`, or `yaml.load(..., Loader=yaml.Loader)`.
* **Vulnerable**:
```python
import pickle, yaml
obj = pickle.loads(request.data)
cfg = yaml.load(raw_yaml, Loader=yaml.FullLoader)
```
* **Secure**:
```python
import json, yaml
obj = PayloadModel.model_validate_json(request.data)
cfg = yaml.safe_load(raw_yaml)
```
* **Report when**: `pickle`, `cPickle`, `marshal`, or non-safe PyYAML loaders process externally controlled bytes or files.
* **Skip when**: Using `json.loads`, Pydantic schema validation, or `yaml.safe_load` / `CSafeLoader`.

### 2. `py-subprocess-shell-true`
* **The Tell**: Invoking `subprocess.run(..., shell=True)`, `os.system()`, or `os.popen()` with formatted or concatenated command strings.
* **Vulnerable**:
```python
subprocess.run(f"ffmpeg -i {input_path} out.mp4", shell=True, check=True)
```
* **Secure**:
```python
subprocess.run(["ffmpeg", "-i", str(safe_input_path), "out.mp4"], shell=False, check=True)
```
* **Report when**: `shell=True`, `os.system`, or `os.popen` runs commands containing any non-constant input.
* **Skip when**: Passing a list of strings (`shell=False`, the default) to a fixed executable with validated positional arguments after `--`.

### 3. `py-mutable-default-privilege-leak`
* **The Tell**: Using mutable default arguments (`def create_session(roles=[]):` or `{}`) in Python functions; the default object persists across calls and leaks state or permissions between users.
* **Vulnerable**:
```python
def build_claims(user_id: str, scopes: list[str] = []):
    if is_admin(user_id):
        scopes.append("admin")
    return {"sub": user_id, "scopes": scopes} # subsequent non-admin calls inherit "admin"!
```
* **Secure**:
```python
def build_claims(user_id: str, scopes: tuple[str, ...] = ()):
    resolved = list(scopes)
    if is_admin(user_id):
        resolved.append("admin")
    return {"sub": user_id, "scopes": tuple(resolved)}
```
* **Report when**: A function holding security state, permissions, caches, or headers uses a mutable `[]`, `{}`, or `set()` default parameter.
* **Skip when**: Defaults are `None` (creating a fresh container inside the body) or immutable types (`tuple`, `frozenset`).

### 4. `py-format-string-attribute-leak`
* **The Tell**: Passing an attacker-controlled template string to `user_tpl.format(...)` or `str.format_map`, exposing globals (`{0.__init__.__globals__[SECRET_KEY]}`).
* **Vulnerable**:
```python
return user_greeting_template.format(user=current_user)
```
* **Secure**:
```python
return f"Hello, {html.escape(current_user.display_name)}"
```
* **Report when**: User-supplied strings act as the format string in `.format()` or `.format_map()`.
* **Skip when**: The format string is a compile-time literal and untrusted values only appear as arguments.

### 5. `py-environ-get-fallback`
* **The Tell**: Using `os.environ.get("SECRET_KEY", "dev-secret")` or `os.getenv("JWT_SECRET", "")`, or enabling `DEBUG = True` / returning `traceback.format_exc()` in HTTP errors.
* **Vulnerable**:
```python
SECRET_KEY = os.environ.get("SECRET_KEY", "unsafe-dev-key")
except Exception as exc:
    return {"error": str(exc), "trace": traceback.format_exc()}, 500
```
* **Secure**:
```python
SECRET_KEY = os.environ["SECRET_KEY"]  # crashes immediately at import/boot if unset
except Exception:
    logger.exception("unhandled_request_error", extra={"request_id": req_id})
    return {"error": "Internal server error", "request_id": req_id}, 500
```
* **Report when**: Production startup falls back to literal secrets/permissive booleans, or exception handlers return `traceback.format_exc()` to clients.
* **Skip when**: `os.environ[KEY]` raises `KeyError` on missing secrets and 500 handlers log tracebacks server-side only.

### 6. `py-random-and-timing`
* **The Tell**: Using `random` (`random.choice`, `random.randint`) for tokens/OTPs, or `==` for HMAC/token checks instead of `secrets` and `hmac.compare_digest`.
* **Vulnerable**:
```python
otp = "".join(random.choices("0123456789", k=6))
if sig == expected_sig:
    grant_access()
```
* **Secure**:
```python
otp = f"{secrets.randbelow(1_000_000):06d}"
if expected_sig and hmac.compare_digest(sig.encode("utf-8"), expected_sig.encode("utf-8")):
    grant_access()
```
* **Report when**: The `random` module mints credentials/tokens or `==` compares secret strings/digests.
* **Skip when**: `secrets` generates tokens and `hmac.compare_digest` checks non-empty secrets.

### 7. `py-sql-fstring-injection`
* **The Tell**: Interpolating strings into `cursor.execute(f"...")`, SQLAlchemy `text(f"...")`, or Django `Model.objects.raw(f"...")`.
* **Vulnerable**:
```python
rows = db.execute(text(f"SELECT * FROM orders WHERE account_id = '{account_id}'"))
```
* **Secure**:
```python
rows = db.execute(text("SELECT * FROM orders WHERE account_id = :account_id"), {"account_id": account_id})
```
* **Report when**: f-strings, `%`, or `+` concatenation build SQL strings passed to DB drivers or ORM raw query APIs.
* **Skip when**: Parameter dictionaries (`:name`, `%s` driver params) bind all dynamic values and identifiers map through a static allowlist.
