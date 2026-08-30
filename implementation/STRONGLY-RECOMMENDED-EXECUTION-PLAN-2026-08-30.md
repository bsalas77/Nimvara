# Strongly recommended production workstreams

This is the execution order for the 13 workstreams requested by the product owner. A workstream is only marked complete when implementation, automated validation, and required external evidence exist.

| # | Workstream | Current state | Exit evidence |
|---:|---|---|---|
| 1 | Attachments, link diagnostics, migration validation | In progress; safe preview, preservation, diagnostics, and copy/verify exist | Repair workflow, regression fixtures, consented vault-copy report |
| 2 | Editor and keyboard workflow | Partial; textarea and Markdown shortcuts exist | Syntax-preserving editor, large-note tests, keyboard audit |
| 3 | Kanban and graph/canvas workflows | Partial; reviewable Kanban, mind map, read-only canvas | Saved views, interactive navigation/edit proposals, rollback tests |
| 4 | Encrypted backup and restore drills | Partial; verified snapshots and bounded scheduler exist | Key-management design, encryption tests, periodic restore evidence |
| 5 | Large-vault performance | Benchmark fixture exists but is not a release gate | Measured startup/index/search/save budgets |
| 6 | Two-device sync | Reconciliation harness exists | Live OneDrive/device matrix |
| 7 | Windows clean-machine release | Hosted installer exists | Install/upgrade/rollback/uninstall retention on clean Windows 10/11 |
| 8 | Linux/macOS packaging | Not fully qualified | Native package install/runtime evidence |
| 9 | Human accessibility | Automated semantics/contrast exist | Narrator/NVDA, keyboard-only, zoom, high-contrast, reduced-motion evidence |
| 10 | Independent security review | Internal tests exist | External review and remediation record |
| 11 | Signed updates, SBOM, provenance | Unsigned development distribution | Signing, update rollback, SBOM, reproducible provenance |
| 12 | Mobile capture/read/edit | Architecture/planning only | Mobile offline queue and conflict-review validation |
| 13 | Local-AI onboarding/evaluation | Adapter foundation exists | Guided install, resource controls, retrieval/citation/adversarial evaluation |

The free core remains Markdown-owned, recoverable, exportable, and usable without a paid AI or sync service.
