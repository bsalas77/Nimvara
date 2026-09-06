# Release-gate validation — 0.6.0-dev

Date: 2026-07-27  
Host: Windows x64, WebView2 151  
Artifact: `dist\Nimvara-Setup-0.6.0-dev.exe`  
SHA-256: `978a6492c25d8ff9354d725cc8d5d30fdcf55119b5acc6356da489088899c1bb`

## Copied-vault and OneDrive evidence

The source was a personal OneDrive-managed Obsidian vault, inspected strictly read-only. It contained 45 Markdown notes and 55 total files. All 55 files reported a reparse-point attribute, so the copy exercised reading OneDrive-managed files. No source file was created, edited, renamed, moved, or deleted.

The installed-app harness copied the vault to a random `%TEMP%` directory, hashed the source before and after, ran all mutation tests on the disposable copy, and deleted the temporary workspace, backup, and restore trees afterward.

Passed:

- source tree hash unchanged;
- all 45 notes visible in the installed application;
- forced termination preserved an unsaved recovery draft;
- restart offered recovery and saved the recovered bytes;
- recovered text became searchable;
- versioned snapshot restored to a separate directory with byte-equivalent user files;
- a simulated sync/external edit caused stale-hash save rejection and was not overwritten.

Evidence gap: this is a deterministic OneDrive-managed-file copy and conflict simulation, not a measured live OneDrive sync race across two machines. Placeholder availability, Files On-Demand transitions, simultaneous remote edits, and OneDrive-generated conflict copies still require a dedicated live-sync matrix.

## Installed UI automation

`tools\windows-installed-ui-smoke.mjs` drives the installed Tauri/WebView2 application through the Chromium DevTools protocol. It validates the first-run workspace UI, file inventory, accessibility semantics, recovery after forced termination, search, backup/restore, and conflict refusal. It uses a random temporary workspace and never targets the source vault for writes.

Result: 7/7 installed workflow assertions passed.

## Crash recovery

Drafts are atomically journaled under `.lantern\recovery` after 700 ms of inactivity. The note itself is not changed. Reopening a note offers explicit Recover and Discard actions. A verified save clears its recovery record. Path escapes and non-Markdown recovery targets are rejected.

Result: native unit test and installed forced-termination test passed.

## Accessibility

Implemented:

- semantic landmarks and named sidebars;
- programmatic labels for text controls;
- polite live status regions and alert regions;
- skip-to-editor link;
- visible keyboard focus;
- `Ctrl+S` save shortcut;
- reduced-motion preference;
- responsive layout down to the native minimum width;
- representative normal-text contrast ratios of 5.49:1 to 15.15:1.

Automated result: semantic/label/shortcut/reduced-motion and representative WCAG AA contrast checks passed.

Evidence gaps: no human screen-reader session, Windows High Contrast manual pass, 200–400% zoom manual pass, switch-control test, or full keyboard usability study has occurred. Automated checks do not establish complete WCAG conformance.

## Automated totals

- Native Rust: 8 passed, 0 failed
- JavaScript safety/compatibility/accessibility: 25 passed, 0 failed
- Installed UI workflow assertions: 7 passed, 0 failed

No user interviews, performance benchmarks, live multi-device sync results, macOS results, or Linux results are claimed.
