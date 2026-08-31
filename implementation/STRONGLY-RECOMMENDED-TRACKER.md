# Strongly recommended backlog tracker

| # | Area | Current state | Next concrete work |
|---|---|---|---|
| 1 | Migration assistant | Compatibility scan, link diagnostics, JSON export, reversible copy/verify API, progress journal, status endpoint, cancel/rollback, and first-run progress/cancel/retry UI | Real-vault usability sessions and automatic resume design |
| 2 | Attachments | Inventory, safe preservation, import preview, native ingestion preservation, drop-path hint, reveal action, bounded native inline previews, reviewed repair application with expected-hash conflict refusal, and deterministic ranked repair candidates | Native byte upload/drop adapter and richer content-aware matching |
| 3 | Kanban | Markdown task board, persistent filters, saved views, durable workspace-scoped boards, safe custom statuses, and drag-to-review proposals | Render durable board columns directly in the task board and add richer card metadata |
| 4 | Canvas/mind map | Generated mind map, reviewed branch proposals, mouse/keyboard movement, and approved Canvas edits through a conflict-safe native save path with hash refusal, schema/size limits, and post-write verification | Add checkpoint/history UI for Canvas edits and richer edge/node editing |
| 5 | Property/database views | Frontmatter cards/table, persistent saved views, deterministic sort/group, and conservative boolean/finite-number typed values | Richer typed values and database editing workflows |
| 6 | Extensions | Read-only MCP/API, narrow permission contract, validation, local disabled-by-default registry with enable/disable endpoints, visible local management UI, Ed25519 verification, session-scoped trusted-key registry, refusal to enable untrusted signed extensions, bounded signed-package verification, and safe versioned installation without execution | Protected persistent key storage and adversarial runtime tests |
| 7 | Publishing | Native safe selected/all-note HTML export, internal link rewriting, referenced attachment copying, ZIP packaging utility, and no-write preflight preview | Signed/polished release publishing workflow and broader Markdown rendering parity |
| 8 | Backup | Verified snapshots/restore, bounded scheduler, retention confirmation, authenticated encrypted snapshots, user-initiated encrypt-now route, and in-memory encrypted snapshot password rotation | Native key-store integration, unattended encrypted scheduling, provider adapters, and periodic restore drills |
| 9 | Diagnostics | Privacy-safe diagnostics export without note contents | Attach validation logs and add automated redaction tests |
| 10 | Evidence | 72 JS tests, 23 Rust tests, reproducible performance/sync qualification, dependency audit, and Windows/Linux artifact evidence | Linux desktop launch, macOS build, human sessions, accessibility, independent review, live two-device sync, and representative-vault evidence |

Items marked as current state are implemented and validated to the extent stated. The next-work column is intentionally not marked complete until code and evidence exist.
