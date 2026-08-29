# Rich compatibility milestone — 2026-08-01

## Delivered

- Safe Markdown tables, task controls, footnotes, inline/block math presentation, and existing
  callout/wikilink/embed handling.
- Preview task controls route into the same explicit review, current-hash verification,
  checkpoint, and atomic-save boundary as the task dashboard.
- A constrained local Mermaid flowchart renderer supporting basic `flowchart`/`graph` nodes and
  arrows. Unsupported syntax remains visible source; no Mermaid script runtime is executed.
- User-triggered, read-only note section and block transclusion with resolved workspace links.
- Bounded, read-only Obsidian Canvas JSON loading: 10 MiB, 5,000-node, and 10,000-edge limits;
  Canvas text is assigned as text content and the source `.canvas` file is never rewritten.
- Bases-style table presentation over the existing bounded scalar frontmatter scan.
- Corrected Tauri inventory extension comparisons for `.canvas` and PDF annotation lookup.

## Validation

- Rust: 20 passed, 0 failed, 1 measured benchmark intentionally ignored.
- JavaScript/security/accessibility: 41 passed, 0 failed.
- Rust formatting and strict Clippy: passed.
- Installed copied-vault workflows: 17/17 passed.
- Authorized source Obsidian vault modified: false, verified by aggregate tree hash.

## Deliberate limits

- Math is presented safely as notation text; a full TeX layout engine is not bundled yet.
- Mermaid support is intentionally restricted to basic flowcharts; sequence, class, state,
  Gantt, and plugin directives remain source.
- Canvas is view-only. Editing requires a separately designed JSON round-trip/checkpoint gate.
- YAML table views support bounded scalar properties; nested objects/lists require a reviewed
  YAML parser and round-trip preservation tests before editing.
