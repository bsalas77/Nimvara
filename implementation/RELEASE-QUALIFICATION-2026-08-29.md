# Release qualification update — 2026-08-29

The current Windows build was requalified after the latest safety and usability changes.

- JavaScript suite: 61 passed, 0 failed.
- Rust/Tauri unit tests: 20 passed, 0 failed, 1 ignored benchmark.
- `cargo clippy --all-targets -- -D warnings`: passed.
- Windows installer rebuild: passed.
- Installer artifacts: `dist/Nimvara-Setup-0.7.0-dev.exe` and root `Nimvara-Setup.exe`.
- Latest installer rebuild after migration/preview UI changes: passed; both artifacts are 4,724,224 bytes with SHA-256 `DF1A4F99AB761B2A9A2191FB7C89773BBE8022020294AFB3B3BC212F6E9CEA93`.

This validates the current engineering baseline; it does not close the unresolved Linux/macOS, accessibility, large-vault, signing, or clean-machine upgrade gates.
