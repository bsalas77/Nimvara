# Competitive workflow milestone — 2026-08-30

## Delivered

Nimvara now has a persistent favorites workflow for daily navigation. Favorites are stored in application-local settings, are limited to existing workspace paths, and never modify Markdown or other vault files. Users can favorite the open note from the editor, use `Ctrl+Shift+B`, or invoke **Toggle favorite note** from the command palette. Favorites appear above the file tree and remain available after restarting the app.

This complements the existing quick switcher, recent open tabs, backlinks/outlines, daily notes, task dashboard, properties views, Kanban board, and review-before-write actions.

## Validation

- JavaScript safety and workflow suite: 65 passed, 0 failed.
- Desktop/native reliability suite remains green: 20 Rust tests passed, strict Clippy passed.
- Favorites are UI-local and therefore cannot overwrite user files.

## Next competitive workflow priorities

1. Make quick switching rank favorites, open tabs, and recent notes while retaining full-path search.
2. Add attachment drag/drop and a missing-link/attachment report.
3. Upgrade the Markdown editor with CodeMirror 6 conveniences without rewriting unknown syntax.
4. Expand link handling to block references, URL-encoded paths, link creation, and unlinked-reference review.
5. Validate these workflows against a consented copy of the user's vault and human keyboard/accessibility testing.
