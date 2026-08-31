# Extension trust-key storage design

## Current state

Nimvara verifies Ed25519 extension signatures against a session-scoped trusted-key registry. Keys are not written to the workspace, extension packages, logs, or diagnostics. This is the safe development behavior.

## Production design

Persistent trust must use the operating-system credential facility, with no plaintext fallback:

- Windows: DPAPI/Credential Manager scoped to the current user and application identity.
- macOS: Keychain item scoped to the signed Nimvara application and current user.
- Linux: Secret Service/libsecret when available; otherwise persistence is disabled and the UI explains why.

Stored records contain a key fingerprint, public key, issuer/label, first-seen time, and revocation state. Private keys are never accepted or stored. Import, replacement, and revocation require an explicit confirmation and show the fingerprint; extension activation rechecks trust after every change.

## Required implementation gates

1. Native per-platform read/write/delete commands with access-denied and unavailable-service handling.
2. No plaintext fallback, workspace storage, environment-variable secrets, or automatic key import.
3. Migration test from session-only keys; rotation and revocation tests; locked-user and unavailable-service tests.
4. Human review on Windows, macOS, and Linux, plus independent security review of the native bindings.

Until these gates exist, trusted keys remain session-scoped and signed extensions cannot claim persistent trust.
