# Windows installer and application-window validation

Primary artifact: `E:\Obisian Project\Lantern-Project\Nimvara-Setup.exe`  
Versioned copy: `dist\Nimvara-Setup-0.7.0-dev.exe`  
Version: `0.7.0-dev`  
Size: 4,718,080 bytes  
SHA-256: `7f3240238ef361940f5a1d83f9f25dd39072a856300091e63f9851eb568b6697`  
Architecture: Windows x64 development build

## Experience and architecture

- Conventional GUI setup executable
- Per-user installation under `%LOCALAPPDATA%\Programs\Nimvara`
- Start Menu entries and optional desktop shortcut
- Native Tauri 2/WebView2 window
- No administrator rights, terminal, Node installation, browser tab, localhost service, or bundled Node runtime
- First-run workspace chooser and visible version
- Registered Windows uninstall entry

All application workflows use typed Rust commands. The installer contains `Nimvara.exe`, the uninstaller, and the sample Markdown workspace.

## Upgrade and uninstall

Setup stages a replacement and retains the prior installation for rollback if replacement fails. It does not replace `%LOCALAPPDATA%\Nimvara\UserData`.

Uninstall removes application binaries, shortcuts, and registration. It never deletes user-selected workspaces, backup destinations, models, or `%LOCALAPPDATA%\Nimvara\UserData`.

The first Nimvara install also removes an installed legacy Lantern executable and its
shortcuts after the Nimvara payload is committed. Legacy `%LOCALAPPDATA%\Lantern\UserData`,
workspaces, backups, and models are deliberately retained. This rename-upgrade path passed
a sentinel-data preservation test on 2026-07-27.

## Validated on this host

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

Save/search/history/backup/restore/link and ingestion correctness are covered by native
tests. The updated installed build passed 7/7 copied-vault UI checks on 2026-07-27;
the authorized source vault's aggregate hash remained unchanged. Live multi-device
OneDrive, human accessibility, and true power-loss tests remain.

## Signing limitation

This installer is unsigned and may trigger Microsoft SmartScreen. Public distribution requires certificate-backed Authenticode signing and trusted timestamping of the installer, application, and uninstaller; protected CI signing; a signed update manifest; staged rollback; and revocation procedures.
