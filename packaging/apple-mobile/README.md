# iPad build boundary

Nimvara’s Rust core and responsive frontend are candidates for a Tauri 2 iPad application, but the desktop arbitrary-path workflow cannot be shipped unchanged on iPadOS.

## Required implementation

1. On a Mac with Xcode, install the Tauri CLI and Rust iOS targets.
2. Run `cargo tauri ios init` from `app`.
3. Add a native document-picker adapter using security-scoped URLs/bookmarks.
4. Copy an imported workspace into Nimvara’s app container or coordinate files through a supported File Provider. Never retain an arbitrary path string and assume future access.
5. Replace desktop attachment reveal with iOS document preview/share.
6. Suspend filesystem watching while backgrounded and reconcile hashes on foreground.
7. Keep URL capture user-initiated and use the existing Rust SSRF policy.
8. Run device tests for Files/iCloud Drive, offline edits, low-storage failure, background termination, restore, accessibility, and data export.

## Distribution

Development on a personally registered device can use a free Apple developer account, with Apple’s testing limitations. Public App Store/TestFlight distribution, reliable signing, and direct notarized macOS distribution require the paid Apple Developer Program. No iPad binary is claimed from this Windows host.
