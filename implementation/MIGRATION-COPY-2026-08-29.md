# Verified workspace migration copy

## Delivered

The server now exposes `POST /api/migration/copy` and the shared API client exposes `api.migrateWorkspace(source, destination)`. The operation:

- requires an existing, non-symlink source folder;
- requires a new destination path outside the source (an existing destination is rejected to prevent accidental deletion);
- copies Markdown and attachment bytes without modifying the source;
- excludes Nimvara's private `.lantern` metadata;
- verifies every copied file by SHA-256 before publishing the migration manifest;
- writes `.nimvara-migration.json` with source, destination, timestamps, byte counts, and per-file hashes;
- removes only the newly created destination if a copy or verification step fails.

## Evidence

Automated file-integrity tests cover Unicode filenames, nested attachments, private metadata exclusion, source immutability, existing-destination preservation, and source-contained destination rejection. The complete JavaScript suite passes (52/52).

## Remaining work

The user-facing migration assistant still needs progress/cancel controls, a resumable journal for very large vaults, and a first-run UI that previews compatibility findings before asking the user to choose a destination. Those are deliberately separate from the safe copy primitive so the primitive can be reused by the installer and future migration flows.
