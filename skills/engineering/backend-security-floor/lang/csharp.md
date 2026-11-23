# C# and .NET Backend Security Rules

Language-specific sharp edges for ASP.NET Core, Entity Framework, and .NET services.

### 1. `cs-unsafe-binary-formatter`
* **The Tell**: Deserializing payloads with `BinaryFormatter`, `NetDataContractSerializer`, `LosFormatter`, or `ObjectStateFormatter`.
* **Vulnerable**:
```csharp
var formatter = new BinaryFormatter();
var session = (SessionState)formatter.Deserialize(stream);
```
* **Secure**:
```csharp
var session = await JsonSerializer.DeserializeAsync<SessionState>(stream);
```
* **Report when**: Any code invokes `BinaryFormatter` or legacy .NET object-graph deserializers on streams, cookies, caches, or message queues.
* **Skip when**: Data is serialized with `System.Text.Json`, `MessagePack`, or `Protobuf` using concrete non-polymorphic DTOs.

### 2. `cs-json-typename-handling`
* **The Tell**: Configuring Newtonsoft.Json with `TypeNameHandling.All`, `Auto`, `Objects`, or `Arrays` without a strict `ISerializationBinder` allowlist.
* **Vulnerable**:
```csharp
var settings = new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.All };
var obj = JsonConvert.DeserializeObject(rawJson, settings);
```
* **Secure**:
```csharp
var settings = new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.None };
var obj = JsonConvert.DeserializeObject<OrderDto>(rawJson, settings);
```
* **Report when**: `TypeNameHandling` is anything other than `None` on untrusted JSON without an explicit narrow allowlist `ISerializationBinder`.
* **Skip when**: `TypeNameHandling.None` is active (default) or `System.Text.Json` `[JsonDerivedType]` uses a sealed compile-time discriminator allowlist.

### 3. `cs-system-random`
* **The Tell**: Calling `new Random()` or `Random.Shared` to generate tokens, OTPs, API keys, or nonces.
* **Vulnerable**:
```csharp
var code = Random.Shared.Next(100000, 999999).ToString();
```
* **Secure**:
```csharp
var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
```
* **Report when**: `System.Random` generates security credentials, reset tokens, CSRF tokens, or encryption nonces.
* **Skip when**: Used only for jitter, shuffling display lists, or synthetic test fixtures.

### 4. `cs-non-constant-time-equality`
* **The Tell**: Comparing HMAC signatures, webhook secrets, or tokens with `==`, `string.Equals`, or `SequenceEqual`.
* **Vulnerable**:
```csharp
if (providedSig == expectedSig) return true;
```
* **Secure**:
```csharp
return expectedBytes.Length > 0 &&
    CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
```
* **Report when**: Standard string or sequence equality compares cryptographic digests, MACs, API keys, or reset tokens.
* **Skip when**: `CryptographicOperations.FixedTimeEquals` wraps equal-length non-empty byte spans.

### 5. `cs-ef-raw-sql-interpolation`
* **The Tell**: Passing an interpolated string (`$"..."`) directly to `FromSqlRaw` or `ExecuteSqlRaw` instead of `FromSqlInterpolated` / `ExecuteSql`.
* **Vulnerable**:
```csharp
var users = db.Users.FromSqlRaw($"SELECT * FROM Users WHERE Email = '{email}'");
```
* **Secure**:
```csharp
var users = db.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {email}");
```
* **Report when**: Interpolated strings or `+` concatenation reach `FromSqlRaw`, `ExecuteSqlRaw`, or `SqlCommand.CommandText`.
* **Skip when**: Queries use LINQ, `FromSqlInterpolated` / `ExecuteSql` (which convert `FormattableString` to `DbParameter`), or explicit `@param` bindings.

### 6. `cs-tls-callback-bypass`
* **The Tell**: Setting `ServerCertificateCustomValidationCallback` or `ServicePointManager.ServerCertificateValidationCallback` to unconditionally return `true`.
* **Vulnerable**:
```csharp
handler.ServerCertificateCustomValidationCallback = (_, _, _, _) => true;
```
* **Secure**:
```csharp
using var handler = new HttpClientHandler(); // enforces system trust store and hostname checks
```
* **Report when**: TLS certificate validation callbacks return `true` unconditionally or when `errors == SslPolicyErrors.None` is missing in production.
* **Skip when**: Custom validation checks an explicit pinned SPKI/certificate hash and only accepts local self-signed certs behind explicit dev-only guards.

### 7. `cs-detailed-error-leak`
* **The Tell**: Enabling `IncludeErrorDetailPolicy.Always`, `UseDeveloperExceptionPage()`, or returning `ex.ToString()` in ASP.NET exception filters in production.
* **Vulnerable**:
```csharp
app.UseDeveloperExceptionPage(); // unconditional in Program.cs
```
* **Secure**:
```csharp
if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();
else app.UseExceptionHandler("/error");
```
* **Report when**: Developer exception pages or raw `Exception` stack traces are enabled outside `app.Environment.IsDevelopment()`.
* **Skip when**: Production paths log internally and return RFC 9457 `ProblemDetails` with no stack trace or internal path details.
