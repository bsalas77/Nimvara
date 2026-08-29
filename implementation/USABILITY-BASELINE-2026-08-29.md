# Usability baseline — 2026-08-29

The current desktop payload already includes safe rendered Markdown preview, tables,
callouts, tasks, local embeds/transclusion, constrained Mermaid diagrams, mind-map
view with reviewable Markdown proposals, property tables, PDF annotation sidecars,
quick commands, and attachment inventory. The React development surface now also
provides quick switching, recent/favorites navigation, attachment visibility, and a
formatting toolbar.

Validation completed:

- JavaScript safety/integration suite: 49 passed, 0 failed.
- Native Rust tests: 20 passed, 0 failed, 1 ignored benchmark.
- Native clippy with warnings denied: passed.

Still required before calling these workflows production-ready:

- Human usability sessions with consented Obsidian migrations.
- Keyboard-only and screen-reader verification of preview, map, tables, and dialogs.
- Large-workspace performance measurements and native file-watcher validation.
- Cross-platform installed GUI tests on Linux and macOS.
