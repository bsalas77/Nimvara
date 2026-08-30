# Static publishing validation — 2026-08-30

The native static publisher now rewrites safe internal Obsidian wikilinks into relative HTML links while keeping all other Markdown content escaped. This is a proposal/export operation: source Markdown and attachments remain untouched.

## Safety rules

- Link targets are normalized to forward-slash paths and emitted as relative `.html` links.
- Absolute targets, protocol-like targets, fragment-only targets, and traversal markers are left escaped as text.
- Titles, labels, scripts, and all non-link Markdown remain HTML-escaped; no scripts or embedded HTML are executed.
- Export still requires a separate new or empty destination and removes the destination on failure.

## Evidence

- Commit: `d7f4f7e`
- `cargo fmt --manifest-path app/src-tauri/Cargo.toml -- --check`: passed.
- `cargo test --manifest-path app/src-tauri/Cargo.toml --locked`: 23 passed, 0 failed, 1 intentional benchmark ignored.
- Regression test covers an aliased internal link, active HTML escaping, selected-note export, and source-byte preservation.

Remaining publishing work is relative attachment copying/link rewriting, archive packaging, and a polished preview. Those remain separate from this safe link rewrite.

