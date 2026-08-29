# Phase 0 status, decisions, and exit gate

Last updated: 2026-07-26

## Completed planning artifacts

- Lean Markdown-native Phase 0 repository
- Traceable user, functional, and non-functional requirements
- Five user journeys with 32 acceptance criteria
- Threat model with 12 threats and 14 data-loss hazards
- Native cross-platform and local-AI hardware test matrices
- Fifteen-screen clickable-prototype specification
- Interview/usability templates and evidence integrity rules

“Completed” means the artifact exists and is structurally validated, not that its hypotheses passed user or technical testing.

## Decisions confirmed

| Decision | Status |
|---|---|
| Markdown and attachments are authoritative; cache data is rebuildable | confirmed |
| Local AI is optional and free | confirmed |
| AI starts read-only and writes only through reviewed typed proposals | confirmed |
| Every approved AI change gets a pre-change checkpoint and undo | confirmed |
| Backup uses versioned, integrity-verified destination-folder snapshots | confirmed |
| Provider transports backup files; Nimvara owns snapshot integrity | confirmed |
| Windows, macOS, and Linux remain required families | confirmed |
| File-integrity and recovery risk reduction precede production breadth | confirmed |

## Evidence gaps

See the [evidence register](research/evidence-register.md). Major open gates are user sessions, observed workflows, prototype usability, native filesystem behavior, measured model/hardware performance, accessibility, recovery-key comprehension, and licensing.

## Roadmap exit gate status

| Exit condition | Status | Evidence |
|---|---|---|
| 8–12 target-user sessions | unmet | 0 completed |
| At least five observed workflows | unmet | 0 observed |
| ≥70% complete first note, first search, and backup without help | not measurable | 0 sessions |
| ≥6 of 8 identify cited/reviewed AI as meaningfully better | not measurable | 0 sessions |
| Representative hardware benchmark | unmet | 0 measured runs |
| Native filesystem testing on three OS families | unmet | 0 native runs |
| No unresolved architecture-level data-loss risk | unmet | hazards specified, not experimentally closed |

Phase 0 is active, not complete. A Windows-host file-safety vertical slice now supplies preliminary implementation evidence, but it does not close native Tauri, macOS, Linux, OneDrive, accessibility, or real-vault rehearsal gates.

The current Windows development installer removes terminal/manual-browser launch friction and the capture/ingestion slice is runnable. These do not satisfy public-release signing or production-native security gates.

## Next implementation-ready milestone

Build two bounded validation assets, not the full application:

1. **Clickable research prototype:** implement P-01–P-15, rehearse the script, then conduct target-user sessions.
2. **File-safety technical spike:** a minimal Tauri/Rust harness with no production editor or AI that tests read-only fixture opening, canonical paths, atomic save/recovery, external-change conflicts, snapshot manifests, corruption detection, and restore-to-new-folder on native OS targets.

Exit requires versioned test artifacts and actual result records. Only then should Phase 1 application scaffolding and architecture estimates be committed.
