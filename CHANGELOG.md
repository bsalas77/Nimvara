# Nimvara change log

## 0.7.0-dev — development distribution

This build is an unsigned Windows development release for technical evaluation.
It is not a public production release.

### Included

- Markdown-owned workspace open/create, navigation, editing, search, checkpoints,
  recovery drafts, conflict refusal, and verified snapshots.
- Safe URL and local-file ingestion with preview, provenance, duplicate detection,
  source preservation, cancellation, and rollback.
- Obsidian-compatible link diagnostics, Canvas/mind-map review workflows, Kanban,
  properties, publishing, attachment previews, migration rehearsal, and aggregate
  diagnostics.
- Optional read-only local AI and explicitly approved paid-provider adapter paths.
- Windows per-user installer and MSIX, Debian artifact, CycloneDX SBOM, and exact
  SHA-256 release manifest.

### Important limitations

- Artifacts are unsigned and carry development identity; SmartScreen/store trust is
  not established.
- macOS, native Linux desktop, live two-device sync, human accessibility sessions,
  independent security review, and consented migration usability remain open gates.
- Encrypted backup currently requires a user-supplied password; OS credential-store
  integration and unattended encrypted scheduling are not yet production-qualified.
- Local AI model selection remains user-controlled and requires a reviewed manifest;
  no model is downloaded automatically.

Before distributing beyond technical evaluation, run
`.\tools\run-local-gates.ps1` and review
`implementation/PRODUCTION-READINESS-HANDOFF-2026-08-30.md`.
