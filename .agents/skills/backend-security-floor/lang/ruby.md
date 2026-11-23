# Ruby and Rails Backend Security Rules

Language-specific sharp edges for Ruby on Rails, Sinatra, and Sidekiq backends.

### 1. `rb-marshal-yaml-load`
* **The Tell**: Calling `Marshal.load` or `YAML.load` on cookies, Redis payloads, uploads, or YAML configs instead of `JSON.parse` or `YAML.safe_load`.
* **Vulnerable**:
```ruby
prefs = Marshal.load(Base64.decode64(cookies[:prefs]))
cfg = YAML.load(raw_yaml)
```
* **Secure**:
```ruby
prefs = JSON.parse(verified_payload)
cfg = YAML.safe_load(raw_yaml, permitted_classes: [], aliases: false)
```
* **Report when**: `Marshal.load` or `YAML.load` (without `safe_load`) processes externally writable or unauthenticated data.
* **Skip when**: Using `JSON.parse` or `YAML.safe_load` with empty `permitted_classes` and verified signed cookies/tokens.

### 2. `rb-dynamic-send-constantize`
* **The Tell**: Invoking `.send(user_method)`, `.public_send(action)`, or `params[:type].constantize` on untrusted strings.
* **Vulnerable**:
```ruby
klass = params[:importer].constantize
klass.new.public_send(params[:action], params[:args])
```
* **Secure**:
```ruby
IMPORTERS = { "csv" => CsvImporter, "json" => JsonImporter }.freeze
importer = IMPORTERS.fetch(params[:importer]) { raise ActionController::BadRequest }
```
* **Report when**: User-controlled strings reach `send`, `public_send`, `constantize`, `safe_constantize`, `eval`, or `instance_eval`.
* **Skip when**: Class or method selection resolves exclusively through a frozen allowlist Hash.

### 3. `rb-mass-assignment-permit-bang`
* **The Tell**: Using `params.permit!` or passing unfiltered `params.to_unsafe_h` into ActiveRecord `create`, `update`, or `assign_attributes`.
* **Vulnerable**:
```ruby
user.update!(params.require(:user).permit!) # allows role: "admin"
```
* **Secure**:
```ruby
allowed = params.require(:user).permit(:display_name, :timezone)
user.update!(allowed)
```
* **Report when**: `permit!` or `to_unsafe_h` feeds model persistence or privilege-sensitive attributes without explicit field allowlisting.
* **Skip when**: Strong Parameters `permit(:field1, :field2)` explicitly enumerates safe non-privileged fields.

### 4. `rb-non-constant-time-compare`
* **The Tell**: Checking API keys, webhook HMACs, or reset tokens with `==` instead of `ActiveSupport::SecurityUtils.secure_compare`.
* **Vulnerable**:
```ruby
head :unauthorized unless request.headers["X-Signature"] == expected_hmac
```
* **Secure**:
```ruby
sig = request.headers["X-Signature"].to_s
authorized = !expected_hmac.empty? && ActiveSupport::SecurityUtils.secure_compare(sig, expected_hmac)
head :unauthorized unless authorized
```
* **Report when**: Standard `==` or `eql?` compares secrets, HMAC signatures, or bearer tokens.
* **Skip when**: `ActiveSupport::SecurityUtils.secure_compare` (or `OpenSSL.fixed_length_secure_compare` with matching lengths) compares non-empty secrets.

### 5. `rb-sql-and-kernel-open`
* **The Tell**: Interpolating strings into `.where("email = '#{email}'")` or calling `Kernel.open(path)` (which invokes a shell if `path` starts with `|`).
* **Vulnerable**:
```ruby
User.where("email = '#{params[:email]}'")
content = open(params[:file]).read
```
* **Secure**:
```ruby
User.where(email: params[:email])
content = File.read(safe_contained_path)
```
* **Report when**: ActiveRecord SQL strings interpolate variables, or `Kernel.open` / `URI.open` accepts untrusted paths/URLs.
* **Skip when**: Queries use Hash/placeholder bindings (`where("email = ?", email)`) and file reads use `File.open` on canonicalized paths.

### 6. `rb-insecure-rand`
* **The Tell**: Calling `Kernel#rand`, `Random.new`, or `Time.now.to_i` to generate reset tokens, API keys, or session IDs.
* **Vulnerable**:
```ruby
token = Array.new(24) { ("a".."z").to_a[rand(26)] }.join
```
* **Secure**:
```ruby
token = SecureRandom.urlsafe_base64(32)
```
* **Report when**: Non-cryptographic `rand` or `Random` mints secrets, verification codes, or tokens.
* **Skip when**: `SecureRandom` generates all unguessable security tokens and nonces.
