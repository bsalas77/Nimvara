# Patched glib 0.18.5 provenance

Purpose: backport the upstream fix for `RUSTSEC-2024-0429` while Tauri 2's Linux
GTK/WebKit dependency graph remains on `glib 0.18`.

- Original crate: `glib 0.18.5`
- crates.io checksum:
  `233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5`
- Original license files are preserved in this directory.
- Upstream reviewed fix: <https://github.com/gtk-rs/gtk-rs-core/pull/1343>
- Upstream fix commit: `05dff0e`

## Deliberate source difference

Only `src/variant_iter.rs` is behaviorally changed:

```diff
- let p: *mut libc::c_char = std::ptr::null_mut();
+ let mut p: *mut libc::c_char = std::ptr::null_mut();
...
- &p,
+ &mut p,
```

The C function mutates this pointer as an out-argument. Passing a mutable reference
restores Rust's aliasing guarantees and prevents optimized builds from disregarding the
write and later dereferencing a null pointer.

## Verification

Run:

```text
cargo tree --target all -i glib@0.18.5
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
```

The dependency tree must show `glib v0.18.5
(.../third_party/glib-0.18.5-patched)` with no registry copy.

## Retirement condition

Delete this directory and the `[patch.crates-io]` entry as soon as Tauri's supported
Linux stack moves to `glib >= 0.20.0` or upstream publishes a compatible fixed 0.18
release. Re-run Linux tests, package validation, dependency audit, and SBOM afterward.

