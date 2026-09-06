# Nimvara production scope and acceptance

Updated 2026-09-05. This is a completion contract for the user's requested product,
not a claim of universal feature parity or a numerical readiness score. Existing
competitive research in `COMPETITIVE-FUNCTION-MATRIX-2026-08-29.md` supplies the
planning context; its vendor claims have not been re-researched in this UI pass.

## Prioritized release gates

| Priority | Workstream | Acceptance required before claiming complete |
| --- | --- | --- |
| P0 | File safety | Native and installed save/conflict/crash/restore tests; Unicode, long paths, symlinks/reparse points, stale previews, partial failures; no source-vault mutation. Service tests alone do not qualify native commands. |
| P0 | Windows delivery | Exact packaged executable tested after per-user install; WebView2 bootstrap on clean host; old-installer transition; upgrade/rollback/settings retention; uninstall preserves workspaces. Antivirus hold resolved without broad exclusions. |
| P0 | Honest capabilities | Audit each visible control through the native route; unsupported migration, encryption, extension or attachment actions must be implemented or explicitly unavailable. No source-presence completion claims. |
| P0 | Daily-use interface | Quiet default shell; reachable on-demand tools; readable editor; consistent themes; keyboard focus/commands; compact desktop and larger touch controls; narrow windows; visible conflict/recovery states. Native visual review plus human accessibility/usability evidence. |
| P0 | Backups and sync | Verified versioned provider-neutral restores and cleanup; live two-device offline/reconnect/conflict/rename/delete/placeholder qualification. Never infer sync safety from synthetic reconciliation alone. |
| P0 | Platform qualification | Current-source Linux build and graphical X11/Wayland watcher tests; Mac build and native lifecycle tests on the user's hardware. |
| P1 | Editor and navigation | Markdown ownership, mature editing/table tools, tabs/switcher, links/backlinks/block references, embeds, frontmatter, templates/daily notes, favorites, search ranking and large-vault timings. Preserve unknown syntax. |
| P1 | Capture and attachments | URL and local-file preview/provenance/duplicates/cancel/retry; reviewed PDF/DOCX extractors and preservation; safe drag/drop, missing-link diagnostics; actual extension capture flow. |
| P1 | Visual and structured work | Editable mind maps/canvas, Markdown-backed Kanban/custom statuses/saved views, property tables, safe review before writes, import/export fidelity. Viewing and proposal generation are not editing parity. |
| P1 | Local and optional paid AI | Free local operation, protected provider credentials, clear outbound consent, cancellation, real-model quality/citations, measured resource use, prompt-injection containment, review/checkpointed edits. No model starts or downloads silently. |
| P1 | API, MCP and plugins | Versioned native API contract; explicit read-only MCP limits; permission-isolated extension execution, signatures/trusted keys, connector authorization and adversarial tests. Package validation is not sandboxing. |
| P1 | Migration and mobile | Reversible real-vault migration; native iOS/iPadOS/Android capture/read/edit/offline/document-provider lifecycle, packaging and device tests. Contract files are not clients. |
| P1 | Release operations | Security/privacy documentation, dependency licensing/SBOM, independent review, supported versions, staged signed update and rollback, support/diagnostics, owner-approved identity/license/distribution. |

## Interface refresh delivered in this pass

- Reading/writing space is primary; tools are closed by default, grouped into note,
  capture, organize, AI and workspace categories, and remain accessible by keyboard.
- Focus mode, compact toolbar/tabs, collapsible calendar/folder overview, dismissible
  task panel, dark/light/high-contrast tokens, folded inspectable note properties.
- Removed forced native window resizing/repositioning on every page load.
- No notes migrated, no model installed, no external provider configured, no public
  release or security exception performed.

Completion evidence belongs in dated engineering records. Missing evidence stays
open; it must not be replaced by optimistic percentages or broad “all done” statements.
