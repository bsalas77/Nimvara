# Large-workspace performance evidence — 2026-08-30

## Reproducible run

Command:

```text
cargo test --release --manifest-path app/src-tauri/Cargo.toml native_core::tests::benchmark_search_10k_synthetic_notes -- --ignored --nocapture
```

Observed output:

```text
{"notes":10000,"createMs":2180,"listMs":11,"coldIndexMs":9793,"incrementalReopenMs":1205,"warmSearchUs":1696}
test native_core::tests::benchmark_search_10k_synthetic_notes ... ok
```

This is a repeatable engineering baseline on the current Windows host, not a user-facing service-level objective or competitor comparison. It covers 10,000 synthetic Markdown notes. Real-vault measurements, startup timing, save latency, attachment-heavy workspaces, and minimum/recommended hardware remain release evidence gates.
