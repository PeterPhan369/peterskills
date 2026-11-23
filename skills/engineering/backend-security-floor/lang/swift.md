# Swift Backend and Apple Platform Security Rules

Language-specific sharp edges for Vapor, SwiftNIO servers, and Apple network/security clients.

### 1. `swift-urlsession-tls-bypass`
* **The Tell**: Implementing `urlSession(_:didReceive:completionHandler:)` to unconditionally pass `URLCredential(trust: serverTrust)` without evaluating trust or pinning certificates.
* **Vulnerable**:
```swift
func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    completionHandler(.useCredential, URLCredential(trust: challenge.protectionSpace.serverTrust!))
}
```
* **Secure**:
```swift
func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let trust = challenge.protectionSpace.serverTrust,
          SecTrustEvaluateWithError(trust, nil),
          matchesPinnedPublicKey(trust) else {
        completionHandler(.cancelAuthenticationChallenge, nil)
        return
    }
    completionHandler(.useCredential, URLCredential(trust: trust))
}
```
* **Report when**: A `URLSessionDelegate` or SwiftNIO TLS verifier disables certificate chain or hostname verification in production builds.
* **Skip when**: Default `URLSession` TLS verification runs untouched, or `SecTrustEvaluateWithError` plus explicit SPKI pinning succeeds before `.useCredential`.

### 2. `swift-keychain-accessibility`
* **The Tell**: Storing Keychain secrets with deprecated `kSecAttrAccessibleAlways` or `kSecAttrAccessibleAlwaysThisDeviceOnly`, leaving items readable while locked or migrated to backups.
* **Vulnerable**:
```swift
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccessible as String: kSecAttrAccessibleAlways,
    kSecValueData as String: tokenData,
]
```
* **Secure**:
```swift
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
    kSecValueData as String: tokenData,
]
```
* **Report when**: Keychain writes use `kSecAttrAccessibleAlways*` or omit `ThisDeviceOnly` on device-bound authentication tokens/keys.
* **Skip when**: Background daemons require `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` or interactive flows use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.

### 3. `swift-userdefaults-secrets`
* **The Tell**: Writing bearer tokens, refresh tokens, API secrets, or private keys into `UserDefaults`, unencrypted `.plist` files, or app logs.
* **Vulnerable**:
```swift
UserDefaults.standard.set(accessToken, forKey: "auth_access_token")
```
* **Secure**:
```swift
try KeychainStore.save(tokenData, account: "auth_access_token")
```
* **Report when**: Credentials, tokens, passwords, or cryptographic keys are persisted in `UserDefaults` or plaintext app storage.
* **Skip when**: `UserDefaults` holds only non-sensitive UI preferences and secrets live in Keychain or environment/secret managers on Linux servers.

### 4. `swift-insecure-data-equality`
* **The Tell**: Comparing webhook HMACs, signature `Data`, or secret `String` values with `==` instead of `CryptoKit` verification or constant-time byte comparison.
* **Vulnerable**:
```swift
if Data(computedHmac) == providedSignatureData { return true }
```
* **Secure**:
```swift
let key = SymmetricKey(data: secretData)
guard !secretData.isEmpty,
      HMAC<SHA256>.isValidAuthenticationCode(providedSignatureData, authenticating: bodyData, using: key) else {
    throw Abort(.unauthorized)
}
```
* **Report when**: `==` compares raw `Data` or `String` secrets/MACs in authentication or signature checks.
* **Skip when**: Using `CryptoKit`'s `HMAC.isValidAuthenticationCode` or a constant-time XOR reduction over verified equal-length non-empty `Data` buffers.

### 5. `swift-process-shell-and-sqlite`
* **The Tell**: Spawning `Process` with `/bin/sh -c` interpolated strings or building SQLite/SQL strings via `"\(userInput)"` in Vapor/SQLite3.
* **Vulnerable**:
```swift
let proc = Process()
proc.executableURL = URL(fileURLWithPath: "/bin/sh")
proc.arguments = ["-c", "convert \(filename) out.png"]
```
* **Secure**:
```swift
let proc = Process()
proc.executableURL = URL(fileURLWithPath: "/usr/bin/convert")
proc.arguments = ["--", validatedPath, "out.png"]
```
* **Report when**: `Process` invokes a shell with interpolated arguments, or SQL/SQLite statements interpolate untrusted strings.
* **Skip when**: `Process` sets `executableURL` directly to the target binary with separated `arguments`, and SQLite/Fluent queries use bound parameters.

### 6. `swift-weak-random`
* **The Tell**: Using `Int.random`, `drand48()`, or `UUID().uuidString` as secret cryptographic keys, salts, or high-entropy bearer tokens without `SecRandomCopyBytes`.
* **Vulnerable**:
```swift
let otp = String(format: "%06d", Int.random(in: 0..<1_000_000))
```
* **Secure**:
```swift
var bytes = [UInt8](repeating: 0, count: 32)
guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw CryptoError.rngFailed }
```
* **Report when**: Non-CSPRNG generators create cryptographic keys, salts, nonces, or secret tokens.
* **Skip when**: `SecRandomCopyBytes`, `SystemRandomNumberGenerator` for non-key tokens, or `CryptoKit.SymmetricKey(size: .bits256)` produces security material.
