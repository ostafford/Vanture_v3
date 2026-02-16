8. Security
8.1 API Token Storage
**Encryption:**
- The encryption key is **derived from the user's passphrase** (e.g. PBKDF2 with a salt, sufficient iterations). Use Crypto-JS or Web Crypto for AES encryption.
- **Passphrase is never stored.** It is required at onboarding (to create the key and encrypt the token) and at each app open (to derive the key and decrypt the token for sync).
- Use a **random salt** per installation (or per user); store the salt in app_settings (e.g. key `encryption_salt`); use it with the passphrase for key derivation.
- Use an **IV** (initialization vector) per encryption and store it with the ciphertext (e.g. IV + ciphertext) so the same token does not produce the same ciphertext every time.

**Storage:**
- Encrypted token stored in SQLite (app_settings table).
- SQLite database stored in IndexedDB (browser storage).
- Never transmitted or logged.
- Decrypted token and passphrase exist only in memory during the session and are never persisted.

**IndexedDB persist failure (Phase 5):** When writing the SQLite binary back to IndexedDB fails (e.g. quota exceeded), the app surfaces a non-blocking, dismissible message via `persistErrorStore` (e.g. "Changes may not be saved" or "Storage is almost full"). On failure, `navigator.storage.estimate()` is used when available to refine the message. Implementation: `src/db/index.ts` doPersist catch path; banner in `src/layout/Layout.tsx`.

**Implementation notes (Phase 2):**
- **Crypto library:** Web Crypto API (PBKDF2 with SHA-256, 100,000 iterations; AES-GCM 256-bit). No Crypto-JS dependency; suitable for modern browsers.
- **IV storage:** 12-byte random IV per encryption, prepended to ciphertext; stored as single base64 string in `app_settings.api_token_encrypted` (format: base64(IV || ciphertext)).
- **Salt:** Stored in `app_settings.encryption_salt` (base64, 16 bytes), generated once at first token storage.

**Implementation (complete):** `src/lib/crypto.ts`: `PBKDF2_ITERATIONS = 100_000`, `KEY_LENGTH_BITS = 256`, `SALT_LENGTH_BYTES = 16`, `IV_LENGTH_BYTES = 12`. Key derivation: `deriveKeyFromPassphrase(passphrase, saltBase64)`; encryption: `encryptToken(plaintext, key)` returns base64(IV || ciphertext); decryption: `decryptToken(ivAndCiphertextBase64, key)`. App settings keys: `encryption_salt`, `api_token_encrypted`; session token held only in memory via `src/stores/sessionStore.ts` (cleared on lock / beforeunload).


8.2 Data Privacy
Local-First Principles:

✅ All data stored in browser's IndexedDB
✅ No external server/database
✅ No analytics or tracking
✅ No data leaves user's machine
✅ API calls made directly from browser to Up Bank
✅ API token is not visible or accessible to anyone after the user has entered it, unless they enter the correct passphrase to unlock the app

User Control:

✅ Option to clear all data (delete database)
✅ Option to revoke API token (manual in Up Bank app)
✅ Transparent about what data is stored


8.3 API Rate Limiting
Up Bank API Limits:

~60 requests per minute
Implement 1-second delay between batch requests
Show friendly error if rate limit hit

```javascript
async function fetchWithRateLimit(url, options) {
  try {
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limit hit
      throw new Error('Too many requests. Please wait a minute and try again.');
    }
    throw error;
  }
}
```
