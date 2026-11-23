# Kotlin Backend Security Rules

Language-specific sharp edges for Ktor, Spring Boot Kotlin, and JVM coroutine backends.

### 1. `kt-nullability-and-platform-types`
* **The Tell**: Using `!!` on nullable auth claims/headers (crashing handlers on malformed input) or trusting Java platform types (`T!`) and `?: ""` fallbacks inside security checks.
* **Vulnerable**:
```kotlin
val subject = request.getHeader("X-Subject")!! // NPE DoS on missing header; platform type T!
val role = request.getHeader("X-Role") ?: ""
if (expectedToken == (token ?: "")) allowAccess() // "" == "" when config is blank
```
* **Secure**:
```kotlin
val expected = config.apiToken.takeIf { it.isNotBlank() } ?: error("API_TOKEN missing")
val provided = request.getHeader("Authorization")?.removePrefix("Bearer ")?.takeIf { it.isNotBlank() }
    ?: throw UnauthorizedException()
```
* **Report when**: Nullable auth fields coerce to empty strings (`?: ""`) that satisfy comparisons, or unvalidated Java interop types (`T!`) bypass null rejection.
* **Skip when**: Missing or blank auth headers and secrets fail immediately with an explicit unauthorized error or startup crash.

### 2. `kt-spring-security-dsl-order`
* **The Tell**: Misordered rules in Spring Security Kotlin `authorizeHttpRequests { ... }` DSL where `permitAll` precedes stricter routes or no catch-all `anyRequest` rule denies access.
* **Vulnerable**:
```kotlin
http.authorizeHttpRequests {
    authorize("/api/**", permitAll)
    authorize("/api/admin/**", hasRole("ADMIN")) // unreachable: shadowed by /api/**
}
```
* **Secure**:
```kotlin
http.authorizeHttpRequests {
    authorize("/health", permitAll)
    authorize("/api/admin/**", hasRole("ADMIN"))
    authorize(anyRequest, authenticated)
}
```
* **Report when**: Broad `permitAll` matchers shadow protected paths, or the DSL omits a trailing `authorize(anyRequest, denyAll)` / `authenticated`.
* **Skip when**: Specific public endpoints appear first and `authorize(anyRequest, authenticated)` or `denyAll` terminates the block.

### 3. `kt-unsafe-deserialization`
* **The Tell**: Using Java `ObjectInputStream`, `kotlinx.serialization` with open polymorphic `SerializersModule`, or Jackson `enableDefaultTyping()` on untrusted payloads.
* **Vulnerable**:
```kotlin
val mapper = jacksonObjectMapper().activateDefaultTyping(LaissezFaireSubTypeValidator.instance)
val job = mapper.readValue<Any>(payload)
```
* **Secure**:
```kotlin
@Serializable
sealed interface JobPayload // closed sealed hierarchy with @SerialName discriminators
val job = Json { ignoreUnknownKeys = false }.decodeFromString<JobPayload>(payload)
```
* **Report when**: Open polymorphic deserialization or `ObjectInputStream` reads unauthenticated network or queue bytes.
* **Skip when**: Deserializing concrete data classes or closed `sealed interface` hierarchies via `kotlinx.serialization` or non-polymorphic Jackson DTOs.

### 4. `kt-coroutine-context-and-supervisor`
* **The Tell**: Launching background work on `GlobalScope` (dropping structured cancellation/auth context), using `ThreadLocal` `SecurityContextHolder` across dispatcher switches without `asContextElement()`, or catching exceptions inside `SupervisorJob` around security tasks.
* **Vulnerable**:
```kotlin
GlobalScope.launch(Dispatchers.IO) {
    val auth = SecurityContextHolder.getContext().authentication // null on another thread!
    performAudit(auth)
}
```
* **Secure**:
```kotlin
withContext(Dispatchers.IO + SecurityContextHolder.getContext().asContextElement()) {
    val principal = currentAuthenticatedPrincipal()
    performAudit(principal)
}
```
* **Report when**: Security/tenant context relies on `ThreadLocal` across coroutine dispatchers without explicit `CoroutineContext` propagation, or `SupervisorJob` silently drops failed security checks.
* **Skip when**: Authenticated principal/tenant ID is passed as an explicit immutable parameter or propagated via `asContextElement()`.

### 5. `kt-insecure-random-and-sql`
* **The Tell**: Calling `kotlin.random.Random` for tokens or interpolating strings into Exposed `exec("SELECT ... '$id'")` / JDBC calls.
* **Vulnerable**:
```kotlin
val token = (1..32).map { chars[kotlin.random.Random.nextInt(chars.length)] }.joinToString("")
TransactionManager.current().exec("DELETE FROM sessions WHERE id = '$sessionId'")
```
* **Secure**:
```kotlin
val bytes = ByteArray(32).also { SecureRandom().nextBytes(it) }
val token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
Sessions.deleteWhere { Sessions.id eq sessionId }
```
* **Report when**: `kotlin.random.Random` generates security credentials, or raw SQL strings interpolate variables in Exposed/JDBC/jOOQ.
* **Skip when**: `java.security.SecureRandom` generates tokens and Exposed/JDBC DSL binds typed query parameters.
