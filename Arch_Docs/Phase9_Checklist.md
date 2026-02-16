# Phase 9: API Token Management — Audit Checklist

**Status:** Phase 9 implemented. All requirements below are implemented; see the Implementation column for file references.

Source: [09_Development_Phases.md](09_Development_Phases.md), [08_Security.md](08_Security.md).

## Phase 9 Requirements (from 09_Development_Phases.md)

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| P9-1 | Update API token in Settings (passphrase + new token) | OK | `src/pages/Settings.tsx`: API token section; "Update API token" button; modal with passphrase and new token fields; submit flow |
| P9-2 | Verify passphrase before replace (decrypt current token) | OK | Submit flow: `deriveKeyFromPassphrase` then `decryptToken(encrypted, key)`; on failure show "Invalid passphrase" / error; no replace |
| P9-3 | Validate new token with Up Bank before storage | OK | `validateUpBankToken(newToken)`; on invalid show "Invalid API token. Please check and try again." |
| P9-4 | Re-encrypt and replace stored token only; no data loss | OK | `encryptToken(newToken, key)` then `setAppSetting('api_token_encrypted', newEncrypted)`; session `setUnlocked(newToken)` |
| P9-5 | 401 from Up Bank surfaced with guidance to update token | OK | `src/api/upBank.ts`: `UpBankUnauthorizedError`, `SYNC_401_MESSAGE`; `fetchWithAuth` throws on 401; Settings and Navbar sync catch and show SYNC_401_MESSAGE |
| P9-6 | Settings UI (API token section, modal, success message) | OK | Data card: "API token" subsection, copy, "Update API token" button; Modal: passphrase, new token, Cancel/Update token; success "API token updated. You can re-sync now." |
| P9-7 | Documentation | OK | This file; 09_Development_Phases.md Phase 9 subsection; 08_Security.md "Update API token" subsection |

## API layer

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| A1 | UpBankUnauthorizedError thrown on 401 | OK | `src/api/upBank.ts`: class `UpBankUnauthorizedError`; `fetchWithAuth` throws it when `res.status === 401` |
| A2 | validateUpBankToken returns false on 401 (onboarding) | OK | `validateUpBankToken` try/catch; on `UpBankUnauthorizedError` return false |
| A3 | SYNC_401_MESSAGE for UI | OK | `src/api/upBank.ts`: exported `SYNC_401_MESSAGE` |

## Security

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| S1 | Passphrase required to update token | OK | Modal requires passphrase; submit verifies via decrypt |
| S2 | Passphrase verified by decrypting current token | OK | `decryptToken(encrypted, key)` before any replace |
| S3 | New token validated with Up Bank | OK | `validateUpBankToken(newToken)` before storage |
| S4 | Only api_token_encrypted updated | OK | `setAppSetting('api_token_encrypted', newEncrypted)` only |
| S5 | Passphrase and plaintext token not stored | OK | Form state cleared after success; no persistence of passphrase or token |

## Documentation

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| DOC1 | Phase9_Checklist.md | OK | This file |
| DOC2 | 09_Development_Phases.md Phase 9 | OK | Phase 9 subsection with bullets and link to Phase9_Checklist.md |
| DOC3 | 08_Security.md Update API token | OK | Subsection under 8.1 with implementation ref |
