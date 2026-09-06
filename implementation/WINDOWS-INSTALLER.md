# Windows installer and application-window validation

Primary artifact: `dist\Nimvara-Setup-<version>-dev.exe`
Version: development candidate
Architecture: Windows x64 development build

## Experience and architecture

- Conventional Tauri/NSIS setup executable (the only supported Windows release path)
- Per-user installation under `%LOCALAPPDATA%\Programs\Nimvara`
- Start Menu entries and optional desktop shortcut
- Native Tauri 2/WebView2 window
- No administrator rights, terminal, Node installation, browser tab, localhost service, or bundled Node runtime
- First-run workspace chooser and visible version
- Registered Windows uninstall entry

All application workflows use typed Rust commands. The installer contains `Nimvara.exe`, the uninstaller, and the sample Markdown workspace.

## Upgrade and uninstall

NSIS installs per user and upgrades its application directory. It must never be
treated as authority to delete a user-selected workspace, backup destination, or
model directory. Upgrade, rollback, and uninstall-retention behavior remains a
required installed-package qualification gate.

Uninstall behavior must remove only application-owned files, shortcuts, and
registration. It must preserve user-selected workspaces, backups, and models.

## Historical evidence and current qualification

The validation list below contains earlier custom-installer evidence and is not
evidence for the current NSIS artifact. The authoritative current attempt is
`WINDOWS-INSTALLER-0.7.1-ATTEMPT-2026-09-06.md`; installed-package qualification
remains open until the canonical NSIS artifact completes clean install, upgrade,
rollback, and uninstall-retention drills.

The canonical release-pipeline correction and 0.7.2 local-install evidence are
recorded in `WINDOWS-RELEASE-PIPELINE-2026-09-06.md`.

- Native Rust safety suite: 19/19 passed (one measured benchmark intentionally ignored)
- JavaScript safety, compatibility, CSP, and accessibility suite: 26/26 passed
- Installed copied-vault UI workflow assertions: 7/7 passed
- Release compilation and installer construction: passed
- Quiet per-user install: passed
- Installed native window launch and title: passed
- Payload contains no `node.exe` or server: passed
- User-data sentinel unchanged through install/uninstall: passed
- Uninstall removes application binaries: passed
- Sample workspace packaged: passed
- Markdown-native mind map: 3/3 focused tests passed; complete JavaScript suite 29/29 passed
- Mind-map build installed and launched in a responsive native Nimvara window: passed
- Daily/calendar notes, task dashboard, folder notes, property views, reviewable visual edits,
  and PDF annotation sidecars: 4 focused tests; complete JavaScript suite 33/33 passed
- Bounded native dashboards, reviewable task/property changes, and calendar navigation:
  complete JavaScript suite 35/35; Rust 20/20; installed copied-vault workflow 10/10 passed
- File tree, safe Obsidian-compatible preview, local settings, command palette, and aggregate
  compatibility scan: complete JavaScript suite 38/38; installed copied-vault workflow 14/14
- Tables, preview tasks, footnotes, math, constrained Mermaid, transclusion, structured property
  tables, and Canvas viewing: complete JavaScript suite 41/41; installed workflows 17/17
- Current release qualification after migration, attachment-preview, diagnostics, and extension-boundary updates:
  JavaScript suite 62/62; Rust suite 20/20 plus clippy; installer rebuilt 2026-08-29.

Save/search/history/backup/restore/link and ingestion correctness are covered by native
tests. The updated installed build passed 7/7 copied-vault UI checks on 2026-07-27;
the authorized source vault's aggregate hash remained unchanged. Live multi-device
OneDrive, human accessibility, and true power-loss tests remain.

## Signing limitation

This installer is unsigned and may trigger Microsoft SmartScreen. Public distribution requires certificate-backed Authenticode signing and trusted timestamping of the installer, application, and uninstaller; protected CI signing; a signed update manifest; staged rollback; and revocation procedures.
