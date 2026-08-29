# Usability hardening — 2026-08-01

## Delivered

- Replaced sequential browser-side note reads for tasks and property views with a bounded native
  scan: at most 50,000 Markdown notes and 128 MiB per request.
- Added task completion/reopen review showing the exact checkbox change.
- Task approval re-reads the source, verifies its hash, checkpoints prior bytes, and uses the
  existing atomic Save boundary; stale source text or line positions are refused.
- Added reviewed scalar frontmatter edits. Approval changes only the unsaved editor draft and the
  user must still Save to commit.
- Added previous/next-day calendar navigation.
- Expanded installed UI automation to cover native dashboards, task review/checkpoint/save,
  property review/save, calendar daily creation, recovery, search, verified backup/restore, and
  external-conflict refusal.

## Validation evidence

- Rust: 20 passed, 0 failed, 1 measured benchmark intentionally ignored.
- JavaScript/integrity/accessibility: 35 passed, 0 failed.
- Rust formatting and strict Clippy: passed.
- Installed copied-vault workflow: 10/10 passed.
- Authorized source Obsidian vault modified: false, verified by aggregate tree hash.
- Windows installer and development MSIX rebuilt successfully.

This remains an unsigned development build. Native dashboard results are deliberately uncached in
this milestone so external changes are visible on every refresh. A later measured optimization may
reuse the disposable search-index metadata while preserving that freshness guarantee.
