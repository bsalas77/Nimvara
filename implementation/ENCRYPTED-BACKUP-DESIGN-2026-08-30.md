# Encrypted backup design

## Scope

Encrypted snapshots are an optional safety feature. Plain verified snapshots remain supported for portability. Encryption must never alter the workspace or make restore depend on a hosted service.

## Contract

- Use an authenticated encryption construction with a unique random nonce per file/chunk.
- Encrypt file contents and attachment bytes; keep only the minimum metadata needed to enumerate and verify a snapshot.
- Authenticate the manifest, schema, snapshot id, source identifier, and file paths as associated data.
- Fail closed on an invalid tag, missing key, duplicate path, truncated ciphertext, or unsupported schema.
- Publish encrypted snapshots through the same temporary-directory then atomic-rename lifecycle as current snapshots.
- Restore into an empty target only after decrypting and verifying every file; never publish a partial restore.

## Key management

- The user creates or imports a recovery key; Nimvara never derives a key from a workspace password without an explicit KDF contract.
- The recovery key is exported as a user-controlled recovery artifact and is never written to the workspace or backup destination.
- Desktop builds should use the platform credential store for an optional local key copy, with clear deletion/rotation controls.
- A lost recovery key means encrypted backups cannot be restored. The UI must state this before enabling encryption.
- Key rotation creates a new snapshot lineage; old snapshots remain decryptable only with their recorded key identifier.

## Restore-drill gate

Before production release, automated tests must cover wrong-key refusal, tampered ciphertext, truncated chunks, manifest tampering, interrupted publication, duplicate paths, Unicode/long paths, and successful full restore. A periodic user-visible restore drill should verify a randomly selected snapshot into a disposable empty folder without touching the active workspace.

## Current status

Verified unencrypted snapshots, bounded scheduling, explicit run-now, retention planning, safe restore, and a password-based encrypted-snapshot service proof of concept are implemented. The encrypted service is not yet wired to native key stores, scheduled backups, or the desktop UI; platform credential-store integration, key rotation, and production interoperability remain release gates.
