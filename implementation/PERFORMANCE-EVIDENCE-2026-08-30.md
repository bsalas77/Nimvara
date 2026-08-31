# Large-workspace performance evidence — 2026-08-31

## Reproducible run

Command:

```text
cargo test --release --manifest-path app/src-tauri/Cargo.toml native_core::tests::benchmark_search_10k_synthetic_notes -- --ignored --nocapture
```

Observed output:

```text
{"notes":10000,"createMs":1176,"listMs":10,"coldIndexMs":8687,"incrementalReopenMs":1095,"warmSearchUs":1704}
test native_core::tests::benchmark_search_10k_synthetic_notes ... ok
```

This is a repeatable engineering baseline on the current Windows host, not a user-facing service-level objective or competitor comparison. It covers 10,000 synthetic Markdown notes. The run completed successfully on 2026-08-31. Real-vault measurements, startup timing, save latency, attachment-heavy workspaces, and minimum/recommended hardware remain release evidence gates.

## Long-note and attachment fixture

Command:

```text
cargo test --release --manifest-path app/src-tauri/Cargo.toml native_core::tests::benchmark_search_long_notes_with_attachments -- --ignored --nocapture
```

Observed output on 2026-08-31:

```text
{"notes":1000,"attachments":1000,"createMs":258,"coldIndexMs":922,"warmSearchUs":1053}
```

This fixture checks indexing of 1,000 long Markdown notes alongside 1,000 inert attachments. It is engineering evidence only; it does not replace representative-vault or minimum-hardware qualification.
