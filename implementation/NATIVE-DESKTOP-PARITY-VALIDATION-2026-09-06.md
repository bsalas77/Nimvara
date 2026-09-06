# Native desktop workflow parity validation — 2026-09-06

## Purpose

This record closes a discovered implementation mismatch before it can be
represented as a completed desktop workflow. The saved Kanban-board controls
and Canvas edit/history controls previously assumed the development HTTP
service. A packaged Tauri app has no such service.

## Change

- Added native, workspace-scoped Kanban-board list/save commands. Board metadata
  is bounded, schema-validated, kept under `.lantern/kanban-boards.json`, and
  atomically written. It is not mixed into the user's Markdown notes.
- Added `desktop-request.js`: a small adapter that calls Tauri commands directly
  in the installed app, or uses HTTP only when the development service is
  actually present.
- Migrated the interactive Kanban runtime, saved-board controls, Canvas editing,
  and Canvas history/restore controls to that adapter.
- Added a source-level regression test that prevents those controls from quietly
  returning to the browser-only `window.nimvaraApi` route.

## Evidence

On this Windows host, the release native executable passed the automated desktop
smoke against a temporary copy of `sample-workspace`:

- executable SHA-256:
  `8d2e74026f3c6fd6800575a0a64ac99b2f68010b503c86bd64d5683958d16809`
- source workspace mutation check: `false`
- all smoke checks passed, including native bridge availability, persisted Kanban
  boards, Canvas viewer, recovery, search, ingestion, backup/restore, and
  external-conflict detection.
- the JavaScript suite and native Rust suite were also run after the change.

This is a source-build desktop result, not an installed-upgrade qualification.
The already-running installed copy was not stopped or overwritten because it may
contain unsaved user work. The installer must be rebuilt from this commit before
the installed path is requalified.

The rebuilt unsigned, per-user NSIS candidate is now available at
`dist/Nimvara-Setup-0.7.0-dev-parity.exe`:

- bytes: `5,246,913`
- SHA-256:
  `cb06b7477d67141cc158f9343706c4d38d3f521c89494fc16441babc03fb2e50`

It was built after the test results above. It has not been installed over the
currently running copy, so installed upgrade/uninstall retention evidence is
still intentionally open.

## Migration follow-up

The native migration command was subsequently added and exercised through the
same temporary-copy desktop harness. It only accepts an existing non-link source
folder and a destination that does not exist, rejects destinations inside the
source, excludes `.lantern`, verifies every copied byte, publishes a manifest at
the end, and removes the destination it created if it fails.

- executable SHA-256:
  `377e29ebb29efee88a159944931d60400f62da89da9a1ef7ab17d443132e5089`
- 32/32 automated desktop workflow checks passed, including migration.
- source workspace mutation check: `false`; uncaught browser errors: none.

This newer executable supersedes the earlier source-build hash for native smoke
evidence. Its matching installer has not yet been installed over the running
user copy.

The matching unsigned per-user installer is
`dist/Nimvara-Setup-0.7.0-dev-migration.exe` (5,259,934 bytes), SHA-256
`8067a05eb97afbf742c0fa576a7117b2c99be8ce56ff0a40a1344e5cc93025cb`.

The current candidate additionally contains the desktop extension-control guard:
`dist/Nimvara-Setup-0.7.0-dev-desktop-safety.exe` (5,260,044 bytes), SHA-256
`e063f7ceccdd2f073c31b2e09067c99ee40754627c8a35d94678199640d2907c`.

## Still deliberately open

- Extension management remains service-only. Its development controls are
  deliberately not rendered in the packaged desktop app until an isolated native
  extension host exists; it is not counted as native-desktop parity.
- This does not prove real human Canvas/Kanban usability, large-vault
  performance, Linux graphical runtime behavior, macOS behavior, or release
  signing/update operations.
