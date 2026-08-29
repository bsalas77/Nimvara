# Decision register

## Accepted for planning

| ID | Decision | Reason |
|---|---|---|
| D-001 | Desktop-first on Windows, macOS, and Linux | Required scope; avoids premature mobile complexity |
| D-002 | Markdown files are authoritative | Ownership, migration, recoverability, and Obsidian compatibility |
| D-003 | Free first iteration | Adoption and evidence before monetization |
| D-004 | Local AI is free | Privacy and AI usefulness are central, not premium extras |
| D-005 | Model downloaded after installation | Keeps installer manageable and allows hardware-appropriate choice |
| D-006 | AI is read-only until a user approves a typed proposal | Limits prompt-injection and accidental-change risk |
| D-007 | Backup uses versioned destination-folder snapshots in MVP | Works with many providers without OAuth/API burden |
| D-008 | Backup and synchronization are distinct | Provider sync can propagate conflicts and deletion |
| D-009 | No arbitrary third-party plugins in MVP | Simplicity, consistency, performance, and supply-chain security |
| D-010 | Tauri 2 is the prototype shell | Cross-platform packaging with explicit capability boundaries |
| D-011 | SQLite is a rebuildable index, not the note store | Avoids lock-in and lowers corruption impact |
| D-012 | Phase 0 uses stable source, requirement, acceptance, threat, hazard, and test IDs | Makes requests and evidence traceable |
| D-013 | Phase 0 separates clickable interaction validation from a bounded file-safety spike | Tests usability and architecture risk without full application development |
| D-014 | A documented hazard remains open until verified by an executable test or observation | Prevents paper controls from being treated as proof |
| D-015 | Use a localhost Node vertical-slice fallback while Rust/Tauri prerequisites are unavailable | Preserves a runnable file-safety milestone without misrepresenting the production security boundary |
| D-016 | Inspect the standard vault read-only and require a copied-vault rehearsal before migration | Derives real compatibility needs without risking authoritative notes |
| D-017 | Ingestion is preview-first and preserves originals whenever extraction is lossy, partial, or unavailable | Prevents irreversible capture loss and makes provenance auditable |
| D-018 | PDF/DOCX are preservation-only until bounded, cross-platform extractors pass hostile-document tests | Avoids false capability and unsafe document parsing |
| D-019 | Produce an unsigned per-user Windows development installer with a bundled runtime and app-mode window | Removes terminal/browser friction using only present toolchains |
| D-020 | Replace the transitional bundled-Node/Edge shell before a trusted public release | Local HTTP and unsigned binaries are not the intended production boundary |

## Open decisions requiring evidence

| ID | Question | Evidence needed |
|---|---|---|
| O-001 | Public product name | Naming workshop, domain and trademark search |
| O-002 | Minimum supported OS versions | target-user inventory and CI/support cost |
| O-003 | Default approved local model(s) | license review, quality tests, hardware benchmarks |
| O-004 | Embedding model and index | retrieval evaluation on real, consented workspaces |
| O-005 | Backup encryption default | usability and recovery-key loss testing |
| O-006 | Windows ARM64 at first preview | participant demand and inference validation |
| O-007 | Flatpak/Snap priority | Linux participant distribution usage |
| O-008 | Optional anonymous metrics | privacy review and explicit-user preference research |
| O-009 | Earliest paid capability | retention and willingness-to-pay evidence |
| O-010 | Direct provider backup APIs | Linux demand and support/security cost |

## Product gaps the user may still care about

These are intentionally not assumed:

- mobile quick capture and read-only access;
- web clipper;
- OCR for images and scanned PDFs;
- voice capture and transcription;
- PDF annotation and citation management;
- calendar/tasks integration;
- shared family or team workspaces;
- end-to-end encrypted device sync;
- accessibility and language requirements;
- portable installation for managed or locked-down computers;
- enterprise deployment, policy, audit, and data-loss-prevention controls.

User research should determine which represent immediate jobs and which would distract from the first release.

## Key risks

| Risk | Early mitigation |
|---|---|
| Cross-platform behavior diverges | Native CI and physical-device test matrix |
| “Simple” local AI becomes a large support burden | Hardware bands, one-click recommended models, non-AI core |
| Model licensing prevents redistribution | Model allowlist and legal/license review |
| Cloud folders cause conflicts or placeholders | Snapshot destinations, local authoritative workspace, validation |
| Markdown compatibility silently rewrites files | Golden fixtures and zero-mutation open/import tests |
| AI produces unsupported or harmful changes | cited retrieval, typed proposals, validation, preview, checkpoints |
| Broad scope delays usefulness | enforce launch non-goals and evidence gates |
| Users confuse local storage with encryption | precise language and OS-encryption guidance |
