# Release qualification update — 2026-08-29

The current Windows build was requalified after the latest safety and usability changes.

- JavaScript suite: 61 passed, 0 failed.
- Rust/Tauri unit tests: 20 passed, 0 failed, 1 ignored benchmark.
- `cargo clippy --all-targets -- -D warnings`: passed.
- Windows installer rebuild: passed.
- Installer artifacts: `dist/Nimvara-Setup-0.7.0-dev.exe` and root `Nimvara-Setup.exe`.

This validates the current engineering baseline; it does not close the unresolved Linux/macOS, accessibility, large-vault, signing, or clean-machine upgrade gates.
