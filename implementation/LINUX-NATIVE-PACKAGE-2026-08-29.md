# Native Linux package qualification — 2026-08-29

The disposable Docker toolchain now builds the native Tauri Linux package successfully.

- Toolchain: Debian Bookworm container, Rust 1.97, Tauri CLI 2.11.4.
- Package: `app/src-tauri/target/release/bundle/deb/Nimvara_0.7.0_amd64.deb`.
- Size: 5,724,498 bytes.
- SHA-256: `BCA79D6974385157CF16691C03B676A6E4B1BF8FEB7AB6FFDF57215CFA9151CC`.
- Rust tests: 20 passed, 1 ignored benchmark.
- Clippy: passed with the project warning policy; third-party GTK/glib warnings remain informational.

The package was built successfully but not launched in a Linux desktop session. Installation, WebKitGTK runtime behavior, desktop integration, and AppImage qualification remain open. macOS still requires a Mac runner or device.

## Fresh container inspection — 2026-08-31

The current `dist/Nimvara_0.7.0_amd64.deb` was inspected inside a clean
`debian:bookworm` container. Control metadata, dependency declarations, executable
permissions, desktop entry, icon, and bundled sample workspace were all present.
This confirms package structure only; GTK/WebKit runtime and graphical launch still
require an actual Linux desktop session.
