# Current-source Linux build — 2026-09-06

## Result

The current Nimvara source was mounted read-only into a disposable Docker Linux
toolchain and completed:

```text
cargo test --locked -j 2
cargo tauri build --config tauri.linux.conf.json --bundles deb --no-sign
```

Docker recorded the disposable container exit code as `0` after 167 seconds. The
first network-disabled attempt established that the image did not have a complete
locked registry cache. A second disposable container fetched the locked Rust
dependencies, compiled the current source, ran its native tests, and built the
Debian package. The container and its artifacts were intentionally removed, so no
new Linux artifact is represented as a retained release upload.

## Scope and limits

This is evidence of current-source Linux compilation and Debian packaging only.
It does **not** establish:

- launch, rendering, accessibility, or interaction in an X11/Wayland desktop;
- package installation/uninstall/upgrade or data retention on Linux;
- native filesystem watcher semantics; or
- resolution of the separately tracked GTK dependency-advisory review.

The project workspace was mounted read-only and was not modified by this build.
