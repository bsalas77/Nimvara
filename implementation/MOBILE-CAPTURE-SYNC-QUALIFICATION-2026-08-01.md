# Mobile capture and sync qualification — 2026-08-01

## Product boundary

Mobile is not qualified by merely compiling a Tauri shell. Android and iPad must preserve
Nimvara's file ownership, conflict refusal, recovery, and verified-backup guarantees despite
platform document-provider and background-lifecycle constraints. No mobile-production claim
is permitted until the following gates have real-device evidence.

## Required capture slice

- Choose or create a workspace through the platform document picker.
- Persist only platform-approved scoped access; never request broad storage permission when a
  document-tree or security-scoped bookmark is sufficient.
- Create/open daily notes, capture text/share-sheet URLs, append a Markdown task, search, and
  attach a photo or PDF.
- Queue interrupted captures locally and require a verified atomic commit before clearing them.
- Never execute imported HTML, scripts, document macros, or embedded active content.

## Sync and integrity gates

1. Same-note concurrent edits on two real devices produce an explicit conflict; neither set of
   bytes is silently overwritten.
2. Offline create/edit followed by reconnect converges without losing attachments or frontmatter.
3. Rename/delete races remain recoverable from history or a conflict copy.
4. Provider eviction, placeholder files, revoked permissions, low storage, process termination,
   and device reboot do not report a save that was not durably committed.
5. Unicode, normalization variants, case collisions, long names, and unsupported provider names
   are rejected or mapped visibly and reversibly.
6. Snapshot restore is verified into a new destination before the user elects replacement.
7. App uninstall never requests deletion of an external workspace or backup.

## Platform matrix still requiring hardware

- Android: current and previous major Android versions; Pixel reference device plus Samsung;
  local storage, Google Drive document provider, OneDrive provider, share sheet, camera capture,
  background kill, and permission revocation.
- iPadOS: current and previous major versions; Files local storage, iCloud Drive, OneDrive Files
  provider, security-scoped bookmark renewal, share sheet, Split View, background suspension, and
  Files-provider eviction.

Docker and desktop emulators may validate pure parsers and UI flows, but cannot satisfy provider,
filesystem-durability, background lifecycle, or real-device accessibility gates.
