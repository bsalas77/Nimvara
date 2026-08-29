# Release qualification update — 2026-08-29

The current Windows build was requalified after the latest safety and usability changes.

- JavaScript suite: 62 passed, 0 failed.
- Rust/Tauri unit tests: 20 passed, 0 failed, 1 ignored benchmark.
- `cargo clippy --all-targets -- -D warnings`: passed.
- Windows installer rebuild: passed.
- Installer artifacts: `dist/Nimvara-Setup-0.7.0-dev.exe` and root `Nimvara-Setup.exe`.
- Latest installer rebuild after migration/preview UI changes: passed; both artifacts are 4,724,224 bytes with SHA-256 `DF1A4F99AB761B2A9A2191FB7C89773BBE8022020294AFB3B3BC212F6E9CEA93`.
- Hosted CI run `33237942586` completed successfully after the `h2 0.4.16` security update. Its Windows artifact is 4,713,472 bytes with SHA-256 `88ed4f83313ad4f7b33269f229960365ccf42f8d59c5da66be05982dc3e59c85`.

This validates the current engineering baseline; it does not close the unresolved Linux/macOS, accessibility, large-vault, signing, or clean-machine upgrade gates.

## Hosted macOS qualification

The private repository now includes a manually dispatched `macOS build` workflow on
`macos-14`. It runs the same JavaScript and Rust qualification gates, then builds an
unsigned DMG and publishes a SHA-256 checksum as a workflow artifact. The first run
exposed a POSIX temporary-directory canonicalization defect; that is fixed in commit
`025e37e`. Run `33236275476` completed successfully and produced `Nimvara_0.7.0_aarch64.dmg`
with SHA-256 `e081e8c15d34d30ab646dee1c6b8c736ddb1357506171f86518e1e2193c70987`.
This qualifies the hosted Apple Silicon build path; it is still unsigned/notarized and
does not qualify Intel macOS or macOS hardware-specific behavior.
