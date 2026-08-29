# Prioritized daily-driver gaps

## P0 — block real-vault replacement

### Newly delivered

- Workspace Safety Center UI and `/api/safety` fact-based state endpoint are implemented and covered by the 43-test suite. See `SAFETY-CENTER-MILESTONE-2026-08-28.md`.
- Provider-neutral sync reconciliation and fault-injection harness are implemented and covered by the 49-test suite. See `SYNC-QUALIFICATION-MILESTONE-2026-08-28.md`.

1. Run a live two-device OneDrive matrix covering Files On-Demand, simultaneous edits, generated conflict copies, offline/reconnect, and rename/delete races. Copied-vault, OneDrive-managed-file reads, deterministic conflict refusal, and verified restore now pass.
2. Extend installed UI automation to link navigation, URL/local ingestion controls, update/rollback, and Windows 10/11 clean virtual machines. Workspace, recovery, search, backup/restore, and conflict refusal now pass.
3. Complete human accessibility testing with Narrator/NVDA, keyboard-only workflows, 200–400% zoom, Windows High Contrast, and reduced motion. Automated semantics and representative AA contrast now pass.
4. Validate native recursive watching and packaging on macOS/Linux. Ubuntu VM is running, but authenticated SSH access is still blocked; see `LINUX-VM-VALIDATION-2026-08-29.md`.
5. Expand wikilinks with block references, URL encoding, rename updates, and link creation.
6. Complete quick switcher, tabs, command palette, and attachment drag/drop.
7. Add snapshot scheduling, retention/pinning, restore browsing, exclusions, and failure notifications.
8. Add production PDF/DOCX extractors with malicious-document, license, and resource-limit validation.

## P1 — block comfortable daily use

1. CodeMirror 6 editor with Markdown conveniences while preserving unknown syntax.
2. Indexed search with title/path weighting and incremental updates.
3. Templates, daily notes, favorites/bookmarks, recent notes, and word count.
4. Crash journal and startup recovery UI.
5. Attachment drag/drop and missing-link/attachment report.
6. Keyboard command palette, accessible focus model, and screen-reader audit.
7. Import/coexistence/cutover guide for Obsidian and Obsidian Sync.
8. Standards-reviewed robots handling, capture readability evaluation, and authenticated connector/extension implementations.

## P2 — validate before adding

Graph, canvas, audio recording, tag pane, advanced frontmatter, web clipping, PDFs/OCR, mobile, sync, and plugins. The inspected vault provides limited content evidence for these despite several enabled core identifiers.

## AI foundation now present, production work remains

A read-only OpenAI-compatible adapter now supports loopback-only local providers and explicitly confirmed HTTPS paid providers. It displays selected source paths and has no file-writing command. This is a development foundation, not production-ready AI. Credential-vault integration, measured retrieval, verified model downloads, provider compatibility, adversarial testing, and reviewed checkpointed edit proposals remain gated. See `AI-PROVIDER-FOUNDATION.md`.
