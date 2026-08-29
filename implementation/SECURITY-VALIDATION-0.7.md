# Security validation — 0.7.0-dev

Date: 2026-07-27  
Artifact SHA-256: `30685bb311974cd646a637fc62d4c0c2d963240d239cb2d5e7eb3a4d5411a4fc`

## Completed checks

- Rust compilation, tests, and Clippy with all warnings denied
- RustSec scan of all 480 locked Rust packages
- npm audit after removing the unused React/Vite/local-server dependency surface
- strict CSP and frontend capability review
- source scan for credential/key markers
- installer payload inspection
- Windows Store MSIX construction and manifest validation
- idle installed-process network inspection
- path traversal, symlink/junction, metadata-path, NTFS alternate-stream, reserved-device-name, and nonportable-path tests
- stale-hash conflict and external-write preservation tests
- atomic write interruption, recovery journal, corrupt snapshot, restore containment, and case-colliding manifest tests
- SSRF, mixed/private DNS, redirect, response size, timeout, sanitization, duplicate, source-change, rollback, and preservation tests
- installed UI/copy-vault regression after capability reduction

## Results

- Native Rust tests: 10 passed
- Frontend safety/compatibility/accessibility tests: 25 passed
- Installed workflow assertions: 7 passed
- Clippy warnings: 0
- npm vulnerabilities: 0
- RustSec vulnerability advisories: 0
- Potential credential/key files: 0
- Forbidden Node/server installer payload files: 0
- Idle TCP connections/listeners: 0/0
- Source vault mutation: false
- Installer Authenticode status: `NotSigned` (expected deferred gate)
- Development MSIX: constructed successfully; intentionally unsigned and not locally installable until Store/certificate signing

## Findings fixed

### SEC-001 — Excessive frontend capability set

The Tauri frontend previously received `core:default`. It now receives only event listen/unlisten, which is all the UI uses.

### SEC-002 — Windows NTFS alternate data stream path

A path such as `Note.md:stream.md` could pass the Markdown suffix check. Nimvara now rejects cross-platform forbidden characters, Windows device names, and trailing-dot/space aliases before any write.

### SEC-003 — Case-colliding snapshot entries

A malicious manifest could contain paths that collide on case-insensitive filesystems. Verification now rejects duplicate case-folded paths before restore.

### SEC-004 — False minimum-Rust compatibility

Clippy found APIs newer than the declared Rust 1.77.2 minimum. They were replaced with compatible implementations.

### SEC-005 — Unused frontend supply-chain surface

React, Vite, TypeScript, concurrently, and the legacy localhost scripts were declared but not used by the shipped static frontend. They were removed; the npm lock now contains no third-party package.

## Open dependency risk

RustSec reports informational warnings in the all-platform graph for unmaintained GTK3 and
related packages. The `glib 0.18.5` unsoundness (`RUSTSEC-2024-0429`) is now repaired using
the exact upstream two-line backport in the vendored crate. A guarded audit script verifies
both the source repair and Cargo resolution before applying the version-based audit exception.
The Linux GTK graph is not linked into the Windows binary.

Do not label Linux production-ready until the package is built on Linux, the advisory’s reachable code is reviewed, and the upstream/backend strategy is accepted. Updating Tauri alone does not currently remove this chain.

## Limits

This is an internal engineering security pass, not an independent penetration test or certification. Remaining work includes external review, fuzzing over sustained runs, live multi-device cloud conflict testing, clean-VM sandbox/EDR behavior, macOS entitlements/notarization review, mobile sandbox review, and signed artifact provenance.
