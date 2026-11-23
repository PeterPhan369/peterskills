# Java Backend Security Rules

Language-specific sharp edges for Spring Boot, Jakarta EE, and JVM services.

### 1. `java-object-input-stream`
* **The Tell**: Calling `ObjectInputStream.readObject()` on untrusted streams, HTTP bodies, cookies, or message queues without a strict `ObjectInputFilter`.
* **Vulnerable**:
```java
try (ObjectInputStream ois = new ObjectInputStream(req.getInputStream())) {
    return (UserSession) ois.readObject();
}
```
* **Secure**:
```java
ObjectMapper mapper = new ObjectMapper();
return mapper.readValue(req.getInputStream(), UserSessionDto.class);
```
* **Report when**: Java native serialization (`ObjectInputStream`, `XMLDecoder`, `Yaml` without `SafeConstructor`) processes untrusted bytes.
* **Skip when**: Using JSON/Protobuf DTOs without polymorphic type activation, or `ObjectInputFilter` permits only an explicit narrow value-class allowlist.

### 2. `java-xxe-xml-factory`
* **The Tell**: Parsing XML with `DocumentBuilderFactory`, `SAXParserFactory`, `XMLInputFactory`, or `TransformerFactory` with default entity settings.
* **Vulnerable**:
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
Document doc = dbf.newDocumentBuilder().parse(untrustedStream);
```
* **Secure**:
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
```
* **Report when**: Any JDK XML parser parses external input without `disallow-doctype-decl` (or `SUPPORT_DTD = false` on StAX).
* **Skip when**: DTDs and external entities are explicitly disabled on the factory before parsing.

### 3. `java-spel-jndi-injection`
* **The Tell**: Evaluating Spring Expression Language (`SpelExpressionParser`) with `StandardEvaluationContext` on user strings, or passing untrusted names into `InitialContext.lookup`.
* **Vulnerable**:
```java
Expression exp = new SpelExpressionParser().parseExpression(userFilter);
Object result = exp.getValue(new StandardEvaluationContext(root));
```
* **Secure**:
```java
EvaluationContext ctx = SimpleEvaluationContext.forReadOnlyDataBinding().build();
// Better: parse a structured AST or allowlist enum rather than SpEL on user strings
```
* **Report when**: User input reaches `SpelExpressionParser`, `InitialContext.lookup`, `JdbcTemplate` lookups, or OGNL/MVEL evaluators.
* **Skip when**: Expressions are compile-time constants or evaluated only via strict typed query builders without expression parsing.

### 4. `java-util-random`
* **The Tell**: Using `new java.util.Random()`, `Math.random()`, or `ThreadLocalRandom` to mint tokens, reset codes, salts, or IDs.
* **Vulnerable**:
```java
long code = new Random().nextInt(900000) + 100000;
```
* **Secure**:
```java
private static final SecureRandom RNG = new SecureRandom();
int code = 100000 + RNG.nextInt(900000);
```
* **Report when**: Non-cryptographic PRNGs generate session identifiers, OTPs, API keys, or cryptographic salts/IVs.
* **Skip when**: Used only for shuffling UI order, retry backoff jitter, or benchmark fixtures.

### 5. `java-non-constant-time-equals`
* **The Tell**: Calling `String.equals`, `Arrays.equals`, or `Objects.equals` on MACs, signatures, or secret tokens.
* **Vulnerable**:
```java
if (providedHmac.equals(expectedHmac)) { return true; }
```
* **Secure**:
```java
if (expectedBytes.length == 0) return false;
return MessageDigest.isEqual(providedBytes, expectedBytes);
```
* **Report when**: `String.equals` or `Arrays.equals` compares HMAC tags, API tokens, or signature digests.
* **Skip when**: `MessageDigest.isEqual` compares non-empty byte arrays.

### 6. `java-jdbc-concatenation`
* **The Tell**: Concatenating strings in `Statement.executeQuery` or JPA `entityManager.createNativeQuery("..." + input)`.
* **Vulnerable**:
```java
ResultSet rs = stmt.executeQuery("SELECT * FROM orders WHERE id = '" + orderId + "'");
```
* **Secure**:
```java
PreparedStatement ps = conn.prepareStatement("SELECT * FROM orders WHERE id = ?");
ps.setString(1, orderId);
ResultSet rs = ps.executeQuery();
```
* **Report when**: Request parameters concatenate into JDBC `Statement` strings or JPQL/native SQL query strings.
* **Skip when**: `PreparedStatement` `?` parameters or named JPA `:param` bindings carry all untrusted values.

### 7. `java-spring-security-bypass`
* **The Tell**: Calling `.csrf().disable()` on browser-cookie endpoints, matching `permitAll()` before restricted rules, or implementing a no-op `X509TrustManager`.
* **Vulnerable**:
```java
http.csrf(csrf -> csrf.disable())
    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
```
* **Secure**:
```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/health").permitAll()
    .anyRequest().authenticated());
```
* **Report when**: Spring Security defaults to `permitAll()`, disables CSRF while accepting cookie sessions, or installs a trust-all `TrustManager` / `HostnameVerifier`.
* **Skip when**: CSRF is disabled strictly for stateless Bearer-token APIs that accept no authentication cookies, and `anyRequest().authenticated()` (or `denyAll()`) sits last.
