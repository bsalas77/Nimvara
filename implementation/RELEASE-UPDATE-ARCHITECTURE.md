# Release and update architecture

## Version 1 release policy

Every public artifact must originate from the same immutable source commit and locked
dependency manifests. CI must run formatting, tests, strict linting, dependency audit,
SBOM generation, package inspection, and platform smoke tests before signing.

Unsigned development artifacts must never be promoted or renamed into a production channel.

## Signing order

1. Build immutable binaries in a protected CI environment.
2. Sign the inner application executable and uninstaller.
3. Construct and sign the installer/package.
4. Apply a trusted RFC 3161 timestamp.
5. Verify signatures on a clean host.
6. Generate SHA-256 checksums and the signed update manifest from final signed bytes.
7. Publish to a staged channel, test upgrade and rollback, then promote.

Signing keys must be held by a managed signing service or hardware-backed credential.
They must not be stored in the repository, ordinary CI variables, developer scripts,
or application binaries.

## Update channels

- `stable`: signed, fully qualified releases only.
- `candidate`: signed release candidates for controlled testing.
- `development`: explicitly unsigned local artifacts; never offered to stable users.

The initial production release may use manual installer upgrades. Automatic updating must
not be enabled until Nimvara verifies a signed manifest and signed payload, refuses version
downgrades unless the user explicitly chooses recovery, preserves settings/workspaces/models,
and has staged rollout, rollback, revocation, and interrupted-update tests.

## Manifest requirements

A future update manifest must contain product identifier, platform, architecture, semantic
version, minimum supported version, channel, immutable HTTPS payload URL, byte length,
SHA-256, signature, signing-key identifier, publication time, and release-notes URL.
The application must treat manifest and release-note content as untrusted data.

