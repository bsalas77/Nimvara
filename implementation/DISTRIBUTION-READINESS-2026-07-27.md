# Distribution readiness record — 2026-07-27

## Decision

Nimvara is **not yet 100% distribution-ready**. It is a tested Windows development candidate and a compiled/tested Debian candidate. Public production claims remain prohibited until every failed gate in `dist/release-readiness.json` passes with evidence.

## Completed in this qualification cycle

- Rebuilt the Windows installer and development MSIX from the current Rust/Tauri source.
- Installed the rebuilt Windows package per-user and ran the installed UI/data-safety smoke workflow.
- Confirmed the authorized source Obsidian vault was not modified.
- Passed workspace open, accessibility assertions, recovery journal, forced-process recovery, search, backup/restore, and external-conflict refusal.
- Passed 19 native Rust safety tests on Windows and Linux; one measured benchmark remains
  intentionally ignored.
- Passed 26 JavaScript safety, ingestion, compatibility, CSP, and accessibility tests.
- Passed Rust formatting and Clippy with warnings denied on Windows.
- Built and inspected the Debian amd64 package in Debian Docker.
- Added a read-only AI boundary for loopback local providers and an explicit reviewed-host allowlist for paid HTTPS providers.
- Disabled AI redirects, blocked private/local paid-provider destinations, limited request sizes/time, kept API keys session-only, and withheld all AI file-writing authority.
- Added a disposable persistent incremental search cache outside the workspace, with external-change and mutation invalidation, corruption recovery, and a user-visible clear action.
- Measured 10,000 synthetic notes in release mode on 2026-08-30: 9,524 ms cold index, 1,204 ms unchanged incremental reopen, and 1,643 microseconds warm search. These are engineering baselines, not production SLOs; representative real-vault and clean-machine measurements remain required.
- Generated a 480-component CycloneDX SBOM from locked dependency manifests.
- Pinned existing GitHub Actions to immutable commit hashes.
- Added manual cross-platform Windows/Linux/macOS candidate-build workflow definitions.
- Added privacy, support, third-party notice, AI safety, Store flight, and owner-controlled gate records.

## Current artifacts

See `dist/SHA256SUMS.txt` for the authoritative hashes:

- `dist/Nimvara-Setup-0.7.0-dev.exe`
- `dist/Nimvara-0.7.0-dev.msix`
- `dist/Nimvara_0.7.0_amd64.deb`
- `dist/nimvara.cdx.json`

These artifacts remain development/unsigned outputs. They are not public production releases.

## Local limitations encountered

- Microsoft Defender custom scanning could not run because the Defender service returned `0x800106ba`; use the active endpoint-security product and a clean CI malware-scanning service.
- The current Docker Linux toolchain passed strict Clippy, formatting, and all 19 native tests.
- AppImage packaging still fails in `linuxdeploy`; Debian packaging succeeds.
- No macOS host or Apple signing identity is available locally.

## Remaining engineering blockers

1. Installed graphical Debian/Ubuntu workflow qualification and offline package lifecycle testing.
2. OS credential-vault integration if paid-provider keys are to persist.
3. Verified local-model discovery/download, model-license review, checksums, hardware sizing, cancellation, and support matrix.
4. Provider-specific AI response, rate-limit, cost, privacy, and adversarial prompt-injection testing.
5. Expanded AI edit-proposal UI automation across checkpoint, explicit approval, bounded scope, and rollback.
6. Track removal of the reviewed `RUSTSEC-2024-0429` backport when Tauri adopts maintained
   GTK bindings; informational GTK3 maintenance warnings remain visible.
7. Repair AppImage and produce/test Flatpak; test the Debian package in graphical Ubuntu/Debian environments.
8. Complete installed ingestion and AI UI automation.
9. Complete signed update/rollback implementation for non-Store distribution.
10. Complete Windows 10 and Windows 11 clean-VM matrices and true VM power-loss testing.

## Remaining owner/external gates

See `implementation/OWNER-CONTROLLED-RELEASE-GATES.md`. The immediate critical path is license/name approval, Microsoft publisher enrollment and product identity, public HTTPS policy/support URLs, GitHub configuration, signing credentials, independent security review, human accessibility testing, migration usability sessions, two-device sync testing, and Apple enrollment/hardware.
