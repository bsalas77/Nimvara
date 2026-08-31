# Nimvara production-readiness handoff — 2026-08-30

This is the current evidence index for the 13 strongly recommended workstreams.
It is intentionally conservative: a local implementation or synthetic test does
not substitute for an owner decision, independent review, human session, or
platform environment.

| # | Workstream | Local evidence | External completion still required |
|---:|---|---|---|
| 1 | Attachments, links, migration | Ingestion, preservation, diagnostics, repair proposals, rollback, and migration progress/cancel tests pass in the 87-test JS suite and native suite. | Consent-based real-vault usability and native drag/drop qualification. |
| 2 | Editor and keyboard workflow | Lossless editor, toolbar, shortcuts, properties, and accessibility assertions pass. | Large-note and human keyboard usability audit. |
| 3 | Kanban and graph/canvas | Review-first Kanban, mind-map, Canvas save/history, and conflict tests pass. | Richer editing and human rollback evidence. |
| 4 | Encrypted backup/restore | Authenticated encrypted snapshot, tamper/wrong-key/Unicode restore, rotation, and rollback tests pass. | OS credential-store integration, unattended encrypted scheduling, periodic real restore drills. |
| 5 | Large-vault performance | 10,000-note, long-note/attachment, and read-only representative-vault measurements recorded. | Clean-install startup and minimum-hardware measurements. |
| 6 | Two-device sync | Provider-neutral reconciliation harness covers conflicts, offline, placeholders, rename, and interruption. | Live two-device OneDrive matrix. |
| 7 | Windows release | Installer/MSIX rebuilt; manifest, SBOM, installer retention tests, and exact hashes verified. | Clean Windows 10/11 install, upgrade, rollback, UI smoke, and uninstall retention. |
| 8 | Linux/macOS packaging | Debian artifact and historical Linux-container logic evidence exist. | Reachable Linux desktop and macOS runner, native package/runtime tests, Apple signing access. |
| 9 | Human accessibility | Automated semantics, keyboard landmarks, contrast, CSP, and reduced-motion checks pass. | Narrator/NVDA, zoom, high-contrast, switch-control, and human keyboard sessions. |
| 10 | Independent security | SSRF, untrusted-content, traversal, extension, AI prompt-injection, and dependency checks pass. | Independent security assessment and remediation record. |
| 11 | Updates/SBOM/provenance | CycloneDX SBOM validator, artifact manifest/hash verifier, and CI enforcement are present. | Stable identity, signing credentials, signed updates, provenance attestation, and rollback flight. |
| 12 | Mobile capture/read/edit | Conservative iOS/iPadOS/Android capability contracts and safety boundaries are documented. | Native mobile implementation, offline queue, lifecycle, document-provider, and device tests. |
| 13 | Local AI onboarding/evaluation | Loopback/paid endpoint controls, HTTPS model provenance, hash/size checks, cited read-only answers, and reviewable edits pass. | Real-model retrieval/citation evaluation, hardware/thermal measurements, provider review, and OS credential vault. |

## Current local qualification

Run from the repository root:

```powershell
.\tools\run-local-gates.ps1
```

The current run passes 87 JavaScript tests, 26 Rust tests plus format/clippy,
the cached RustSec audit with no unignored vulnerabilities, SBOM validation,
and all four release-artifact hash checks. The readiness report is **29/39**;
the ten failed checks are owner-controlled or require external environments.

The exact owner actions are listed in
`implementation/OWNER-CONTROLLED-RELEASE-GATES.md`. Nimvara must not be called
production-ready until those gates have evidence attached.
