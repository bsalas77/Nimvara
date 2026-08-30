# Strongly recommended backlog tracker

| # | Area | Current state | Next concrete work |
|---|---|---|---|
| 1 | Migration assistant | Compatibility scan, link diagnostics, JSON export, reversible workflow spec; native copy/verify API with manifest and safe rollback | Cancel/progress journal and first-run migration UI |
| 2 | Attachments | Inventory, safe preservation, import preview, native ingestion preservation, drop-path hint, reveal action, bounded native inline previews | Native byte upload/drop adapter and missing-attachment repair workflow |
| 3 | Kanban | Markdown task board, persistent filters, drag-to-review status proposals | Saved boards and richer status vocabulary |
| 4 | Canvas/mind map | Read-only Canvas, generated mind map, reviewed branch proposals, SVG export | Full interactive layout editing with proposal model |
| 5 | Property/database views | Frontmatter cards/table, persistent query/view, deterministic sort/group utility | Wire saved sort/group controls into UI and add typed values |
| 6 | Extensions | Read-only MCP/API, permission contract, capability tests | Install/enable UI, signed manifests, adversarial runtime tests |
| 7 | Publishing | Boundary and safety design, native safe selected-note/all-note static HTML export, and desktop UI | Relative link/attachment rewriting, archive packaging, and polished preview |
| 8 | Backup | Verified snapshots and restore; bounded scheduler; preview-first confirmed retention UI; authenticated encrypted snapshot service proof of concept | Native key-store integration, scheduled encrypted backups, provider adapters, key rotation, and periodic restore drills |
| 9 | Diagnostics | Privacy-safe diagnostics export without note contents | Attach validation logs and add automated redaction tests |
| 10 | Evidence | 68 JS tests, 23 Rust tests, reproducible performance and sync qualification, dependency audit with warnings tracked | Linux desktop launch, macOS build, human sessions, accessibility, independent review, and representative-vault evidence |

Items marked as current state are implemented and validated to the extent stated. The next-work column is intentionally not marked complete until code and evidence exist.
