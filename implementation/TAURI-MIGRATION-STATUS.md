# Tauri migration status

## Native boundary complete

Nimvara 0.5 loads its frontend directly in Tauri and uses typed Rust commands for workspace open/create, recursive inventory and watching, Markdown reads, conflict-aware atomic saves, search, history/checkpoints, snapshot backup/restore, attachment inventory/reveal, wikilinks/backlinks/outlines, and capture/ingestion.

The packaged application contains no Node executable, local HTTP service, or loopback CSP permission. Native events trigger immediate external-change checks; a 15-second state poll remains as a defensive fallback.

Rust enforces workspace containment, rejects linked path components and reserved metadata writes, verifies hashes after writes/restores, stages snapshot restores, preserves originals for lossy imports, and applies URL/SSRF limits before web capture.

## Validation

- Rust native safety tests: 8 passed
- Release build: passed
- Native-only payload inspection: passed
- Per-user installer: passed
- Installed native window launch: passed
- Node payload absent: passed
- Uninstall removes binaries and preserves user data: passed
- Installed copied-vault, recovery, search, restore, conflict, and accessibility assertions: 7 passed

## Remaining release gates

The migration is complete, but 0.5 remains an unsigned development build. Before public release: run copied-vault and OneDrive rehearsals, add installed UI automation, complete accessibility review, validate macOS/Linux builds, acquire signing, and implement signed updates.
