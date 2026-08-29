# Release qualification update — 2026-08-29

The current Windows build was requalified after the latest safety and usability changes.

- JavaScript suite: 62 passed, 0 failed.
- Rust/Tauri unit tests: 20 passed, 0 failed, 1 ignored benchmark.
- `cargo clippy --all-targets -- -D warnings`: passed.
- Windows installer rebuild: passed.
- Installer artifacts: `dist/Nimvara-Setup-0.7.0-dev.exe` and root `Nimvara-Setup.exe`.
- Latest installer rebuild after migration/preview UI changes: passed; both artifacts are 4,724,224 bytes with SHA-256 `DF1A4F99AB761B2A9A2191FB7C89773BBE8022020294AFB3B3BC212F6E9CEA93`.

This validates the current engineering baseline; it does not close the unresolved Linux/macOS, accessibility, large-vault, signing, or clean-machine upgrade gates.

## Hosted macOS qualification

The private repository now includes a manually dispatched `macOS build` workflow on
`macos-14`. It runs the same JavaScript and Rust qualification gates, then builds an
unsigned DMG and publishes a SHA-256 checksum as a workflow artifact. The first run
exposed a POSIX temporary-directory canonicalization defect; that is fixed in commit
`025e37e`. Run `33236275476` was dispatched from that commit and was still in native
qualification at the time of this record; the hosted result remains the authoritative
macOS gate. No macOS hardware or signed/notarized artifact is claimed here.
