# Optimized native release-test evidence — 2026-08-31

Command executed from the repository root:

```text
cargo test --manifest-path app/src-tauri/Cargo.toml --release
```

Result: **26 passed, 0 failed, 2 ignored**. The two ignored tests are the measured 10,000-note and long-note/attachment benchmarks; they are intentionally excluded from the ordinary release test pass. The optimized binary was subsequently used to rebuild the Windows installer and MSIX.

This record is evidence for the run on this date, not a claim that clean-machine UI, signing, or cross-platform qualification has passed.
