# Dependency security decision — 2026-07-27

## Current evidence

`cargo audit` evaluated the locked 480-component Rust graph against advisory database
commit `0bfde9d6a469ae503f8a6147c2dd552856cd5999`.

- Vulnerability advisories: **0**
- Informational warnings: GTK3 and related unmaintained crates
- Unsoundness advisory: `RUSTSEC-2024-0429`, `glib 0.18.5`

The affected `glib` path is transitive through Tauri/Wry's Linux GTK/WebKit backend.
`cargo tree --target all -i glib@0.18.5` confirms that dependency path. Windows and macOS
builds do not link this Linux GTK graph.

## Remediation

The `glib 0.18.5` crate is now vendored at
`app/src-tauri/third_party/glib-0.18.5-patched`. Nimvara applies the exact reviewed
two-line upstream repair from gtk-rs PR 1343 and forces Cargo to resolve the entire
Linux graph to that path through `[patch.crates-io]`.

`tools/audit-rust.ps1` refuses to run the advisory exception unless:

- both repaired source lines are present;
- the provenance file is present; and
- `cargo tree --target all` confirms the patched path is active.

The script then runs `cargo audit --ignore RUSTSEC-2024-0429`. This exception is necessary
because RustSec matches package name/version and cannot recognize a downstream source
backport. It is not a risk waiver: the affected code is repaired in the shipped source.

## Current decision

- Windows: does not link this target-specific GTK graph.
- Linux: the concrete `RUSTSEC-2024-0429` unsoundness is repaired and the patched `.deb`
  passes compilation, tests, strict linting, package inspection, and linkage checks.
- Maintenance debt remains because Tauri 2 uses archived GTK3 Rust bindings. Track Tauri 3's
  planned GTK4 transition and remove the vendored patch as soon as the supported stack moves.

No other vulnerability advisory is present. Informational unmaintained warnings remain
visible in audit output.
