# Nimvara release audit — 2026-08-30

The local release checker reports **15/25 checks passing**. The application is suitable for a technical-preview build, not a broad production release.

## Passing locally

- CSP and frontend capability restrictions
- Session-only AI credentials
- Windows installer artifact exists and rebuilds successfully
- SBOM artifact exists
- Linux package artifact exists (GUI qualification remains open)
- Search/performance evidence
- Disposable backup/restore drill
- Provider-neutral sync reconciliation harness
- Dependency policy with reviewed `glib` backport and tracked warnings
- Native attachment preview and diagnostics

## Remaining gates

1. Owner-selected product license.
2. Formal Nimvara name/trademark/domain clearance.
3. Removal of development labels and reserved store identity.
4. macOS artifact, signing, notarization, and host validation.
5. Independent security review and remediation.
6. Human accessibility sessions using Narrator/NVDA and keyboard-only workflows.
7. Consent-based migration usability sessions.
8. Two physical devices with live OneDrive/offline/reconnect testing.
9. Protected Microsoft/Apple signing identities and signed-update rollback evidence.
10. Public HTTPS privacy, support, and security URLs.

These are not substituted with synthetic evidence. The latest full test run is 68 JavaScript tests passed and 23 native Rust tests passed with one measured benchmark intentionally ignored.
