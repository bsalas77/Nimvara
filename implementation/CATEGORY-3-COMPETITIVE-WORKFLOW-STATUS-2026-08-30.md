# Category 3 competitive workflow status — 2026-08-30

## Completed or substantially implemented

- Attachment import accepts a dropped local path and immediately opens the read-only ingestion preview. The original source remains untouched until explicit import approval.
- Compatibility scans distinguish broken note links from missing embedded attachments.
- Missing note links can prepare a safe target filename for user review before creating a note.
- Backlinks, outgoing links, outlines, aliases, embeds, block/heading transclusion, URL/local ingestion, provenance, duplicate detection, and conflict-safe writes are implemented.
- Tabs, quick switching, command palette, favorites, recent notes, daily notes, templates, tasks, properties, saved property views, Kanban filtering, mind-map review, canvas viewing, and static export are implemented.
- Migration is copy-and-verify and never modifies the source vault.

## Remaining depth work

These are parity and validation expansions, not silently claimed as complete:

1. Native drag/drop path access on every packaged platform and a full missing-attachment repair UI.
2. Block-reference edge cases, URL-decoding parity between web and native paths, unlinked-reference discovery, and link autocomplete.
3. A CodeMirror-class editor with syntax-aware selection, tables, slash commands, and unknown-syntax preservation tests.
4. Kanban swimlanes, grouping, saved board views, and richer Markdown status-property conventions.
5. Interactive graph/canvas editing with explicit review and rollback for every mutation.
6. Rich Markdown parity for footnotes, math, Mermaid, embeds, tables, and large-document responsiveness.
7. A guided migration/cutover checklist with attachment/link reports, reversible staging, and consented real-vault validation.

All changes in this milestone preserve Markdown as the authority and require explicit review before changing user files.
