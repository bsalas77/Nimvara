# Strongly recommended backlog tracker

| # | Area | Current state | Next concrete work |
|---|---|---|---|
| 1 | Migration assistant | Compatibility scan, link diagnostics, JSON export, reversible workflow spec; native copy/verify API with manifest and safe rollback | Cancel/progress journal and first-run migration UI |
| 2 | Attachments | Inventory, safe preservation, import preview, native ingestion preservation, drop-path hint, reveal action | Native byte upload/drop adapter and inline attachment previews |
| 3 | Kanban | Markdown task board, persistent filters, drag-to-review status proposals | Saved boards and richer status vocabulary |
| 4 | Canvas/mind map | Read-only Canvas, generated mind map, reviewed branch proposals, SVG export | Full interactive layout editing with proposal model |
| 5 | Property/database views | Frontmatter cards/table, persistent query/view, deterministic sort/group utility | Wire saved sort/group controls into UI and add typed values |
| 6 | Extensions | Read-only MCP/API, permission contract, capability tests | Install/enable UI, signed manifests, adversarial runtime tests |
| 7 | Publishing | Boundary and safety design documented; safe selected-note static HTML export API | In-app preview, relative link rewriting, attachment selection, and export archive packaging |
| 8 | Backup | Verified snapshots and safe restore; persisted bounded scheduler; retention plan plus explicitly confirmed prune API | Retention UI, encryption/key management, provider adapters, and periodic restore drills |
| 9 | Diagnostics | Privacy-safe diagnostics export without note contents | Attach validation logs and add automated redaction tests |
| 10 | Evidence | 62 JS tests, 20 Rust tests, clippy pass; Linux logic 62/62; native Linux .deb build passed | Linux desktop launch, macOS build, human sessions, accessibility, and large-workspace evidence |

Items marked as current state are implemented and validated to the extent stated. The next-work column is intentionally not marked complete until code and evidence exist.
