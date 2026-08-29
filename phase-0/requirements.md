# Traceable requirements

Status: baseline for prototype validation  
Sources: [evidence register](research/evidence-register.md)

## User requirements

| ID | Requirement | Source | Validation |
|---|---|---|---|
| UR-001 | Users retain ownership through ordinary Markdown files and attachments readable without Nimvara. | SRC-001, SRC-002 | J-02; AC-007–AC-010 |
| UR-002 | Users can begin writing, finding, and backing up notes without an account, model, plugin, or developer tool. | SRC-002 | J-01, J-02; AC-001–AC-006 |
| UR-003 | Opening or viewing an existing workspace never silently changes user content. | SRC-002–SRC-004 | AC-007, XP-006 |
| UR-004 | Users may enable free local AI after an understandable hardware and privacy check and can verify answer sources. | SRC-001–SRC-004 | J-03; AC-011–AC-017; AIH matrix |
| UR-005 | AI-originated changes remain proposals until reviewed and explicitly approved, and accepted changes are recoverable. | SRC-001, SRC-004 | J-04; AC-018–AC-024 |
| UR-006 | Users can create, verify, browse, and restore versioned provider-neutral backups. | SRC-001–SRC-004 | J-05; AC-025–AC-032 |
| UR-007 | Core workflows behave consistently on supported Windows, macOS, and Linux targets. | SRC-001–SRC-004 | XP matrix |
| UR-008 | Users can tell whether AI processing is local, external-local, or remote and whether content leaves the device. | SRC-002–SRC-004 | AC-012, AC-016, AC-017 |
| UR-009 | Users can preview and safely capture one public web page or import supported local files into searchable Markdown. | Project-owner capture requirement | ING-001–ING-016 |
| UR-010 | Users retain provenance and original source bytes whenever extraction is unavailable or lossy. | Project-owner capture requirement | ING-006–ING-012 |
| UR-011 | Windows users can install, launch, upgrade, and uninstall Nimvara without installing Node, using a terminal, or manually opening localhost. | Project-owner release requirement | WIN-001–WIN-012 |

## Functional requirements

| ID | Shall statement | Traces to | Acceptance |
|---|---|---|---|
| FR-001 | Nimvara shall create or open a user-approved workspace without importing it into a proprietary store. | UR-001–UR-003 | AC-003, AC-007 |
| FR-002 | Nimvara shall preserve Markdown, frontmatter, links, attachments, filenames, Unicode, and line endings unless the user edits them. | UR-001, UR-003 | AC-007–AC-010 |
| FR-003 | Nimvara shall treat indexes, embeddings, and derived metadata as rebuildable cache data. | UR-001 | AC-010 |
| FR-004 | Nimvara shall provide create, edit, save, navigation, quick-open, and full-text search without AI. | UR-002 | AC-004–AC-006 |
| FR-005 | Nimvara shall detect external file changes and prevent silent overwrite. | UR-003 | AC-009 |
| FR-006 | Nimvara shall expose the workspace path and granted filesystem scope. | UR-001, UR-008 | AC-003 |
| FR-007 | Nimvara shall remain useful while indexing or model setup is incomplete. | UR-002 | AC-004–AC-006 |
| FR-008 | Nimvara shall classify hardware and recommend no-model, light, or standard local-AI options without silently installing a model. | UR-004 | AC-011–AC-014 |
| FR-009 | Nimvara shall verify model source, license metadata, expected size, and hash before activation. | UR-004 | AC-015 |
| FR-010 | Nimvara shall return source identifiers with cited answers and reject identifiers outside retrieved context. | UR-004 | AC-016 |
| FR-011 | Nimvara shall show retrieval limitations and permit “no supporting note found.” | UR-004 | AC-017 |
| FR-012 | Nimvara shall constrain AI writes to typed proposals validated against approved paths, current file versions, and action limits. | UR-005 | AC-018–AC-020 |
| FR-013 | Nimvara shall show per-file diffs and support approve, reject, and partial approval before mutation. | UR-005 | AC-020–AC-022 |
| FR-014 | Nimvara shall create a pre-change checkpoint and provide undo for every approved AI mutation. | UR-005 | AC-023–AC-024 |
| FR-015 | Nimvara shall create immutable versioned snapshot archives at a user-selected destination outside the workspace. | UR-006 | AC-025–AC-027 |
| FR-016 | Each snapshot shall contain a versioned manifest and file-integrity hashes and shall be finalized only after verification. | UR-006 | AC-027–AC-028 |
| FR-017 | Nimvara shall allow snapshot browsing and default restoration into a new folder. | UR-006 | AC-029–AC-031 |
| FR-018 | Nimvara shall require a distinct high-friction confirmation before replacing existing workspace content. | UR-006 | AC-032 |
| FR-019 | Nimvara shall provide preview-only URL and local-file extraction that writes nothing before approval. | UR-009 | ING-001, ING-004 |
| FR-020 | Nimvara shall import Markdown, TXT, and sanitized HTML and shall preserve PDF/DOCX originals when extraction is unavailable. | UR-009, UR-010 | ING-002–ING-007 |
| FR-021 | Nimvara shall allow destination folder and note-name selection before commit. | UR-009 | ING-008 |
| FR-022 | Nimvara shall record source, canonical URL, capture time, content/original hashes, extractor identity/status, and attachment path. | UR-010 | ING-009 |
| FR-023 | Nimvara shall detect duplicate canonical URLs and extracted-content hashes and require explicit override. | UR-009 | ING-010 |
| FR-024 | Nimvara shall cancel without writes, support a fresh retry, and roll back partial commits. | UR-009, UR-010 | ING-011–ING-013 |
| FR-025 | Nimvara shall make committed extracted text available to normal workspace search. | UR-009 | ING-014 |
| FR-026 | Nimvara shall expose extraction capability/status without implying PDF/DOCX text extraction when unavailable. | UR-009, UR-010 | ING-015 |
| FR-027 | Nimvara shall expose adapter boundaries for future authenticated connectors and browser extensions without bypassing preview/commit invariants. | UR-009 | ING-016 |
| FR-028 | The Windows package shall bundle/manage its runtime and launch an application window from Start Menu/optional desktop shortcuts. | UR-011 | WIN-001–WIN-006 |
| FR-029 | Windows setup shall install per-user where feasible and upgrades shall preserve settings. | UR-011 | WIN-007–WIN-009 |
| FR-030 | Uninstall shall remove application registration/binaries without deleting workspaces, backups, settings, or models. | UR-011 | WIN-010–WIN-012 |

## Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-001 | Opening a fixture workspace causes zero content-byte changes. | Hash before/after across XP matrix |
| NFR-002 | Saves use atomic replace where supported; interruption leaves the old or new valid file, never a partial file. | Fault-injection test |
| NFR-003 | Paths are canonicalized and constrained to user-approved workspace/backup roots. | Traversal, symlink, case, and junction tests |
| NFR-004 | Rendered Markdown and note content cannot execute scripts or broaden application capabilities. | Malicious fixture suite |
| NFR-005 | Network access is off by default and limited to explicit model download, update, or configured provider actions. | Network capture and permission tests |
| NFR-006 | Secrets are excluded from notes and logs and stored in the OS credential store when needed. | Inspection and platform integration tests |
| NFR-007 | Security and diagnostic logs exclude note bodies and retrieved chunks. | Golden log tests |
| NFR-008 | Untrusted note/model content cannot trigger file or network actions without explicit approval. | Prompt-injection corpus |
| NFR-009 | Backup creation never targets a path inside the source workspace. | Path validation tests |
| NFR-010 | Interrupted backup never appears as a completed snapshot. | Fault-injection test |
| NFR-011 | Restore verification checks manifest and hashes before presenting success. | Corruption/tamper tests |
| NFR-012 | Native tests cover supported Windows, macOS, and Linux packages. | XP matrix |
| NFR-013 | Core workflows support keyboard-only operation with visible focus. | Manual accessibility audit |
| NFR-014 | WCAG 2.2 AA is the interface design target; conformance is not claimed until audited. | Automated and manual audit |
| NFR-015 | UI remains responsive and cancellable during indexing, backup, and inference. | Interaction and load tests |
| NFR-016 | Initial performance numbers in the architecture remain targets until measured on named reference hardware. | Versioned benchmark results |
| NFR-017 | URL capture permits only public HTTP/HTTPS and blocks local/private/link-local/special-use/DNS-rebinding targets at connection time. | SSRF unit and integration tests |
| NFR-018 | URL capture enforces redirect, timeout, response-size, media-type, robots, and access-control boundaries. | Deterministic network-adapter tests |
| NFR-019 | HTML extraction removes active content, event handlers, forms, executable URLs, and embedded execution surfaces. | Malicious HTML corpus |
| NFR-020 | Local imports are size-bounded and never modify the source file. | Before/after hashes and oversized fixtures |
| NFR-021 | Ingestion commit is rollback-safe and never leaves a false-success note or newly copied orphan after failure. | Fault-injection tests |
| NFR-022 | Imported content remains untrusted and cannot invoke connectors, filesystem actions, network calls, or future AI actions. | API/action boundary tests |
| NFR-023 | Windows development setup is clearly identified as unsigned; public release requires signed binaries, package, manifest, and timestamp. | Signature/release qualification |
| NFR-024 | Installer upgrade is side-by-side/rollback-capable and uninstall data retention is verified. | Install-upgrade-uninstall drill |

## Scope boundaries

Mobile, real-time collaboration, proprietary sync, autonomous agents, arbitrary plugins, direct cloud-provider APIs, and AI deletion/bulk movement are outside the MVP baseline.
# Visual knowledge requirements (added 2026-08-01)

- **REQ-VIS-001 — Markdown-authoritative mind map:** The application shall derive a mind map
  from an open Markdown note without requiring or creating a proprietary source format.
- **REQ-VIS-002 — Traceability:** Each generated non-link node shall retain its source line;
  activating it shall return the user to that Markdown location.
- **REQ-VIS-003 — Linked-note navigation:** Resolved wikilink nodes shall open their workspace
  note; unresolved links shall be reported without creating or changing a file.
- **REQ-VIS-004 — Safe preview:** Rendering a mind map, including from an unsaved draft, shall
  perform no workspace write.
- **REQ-VIS-005 — Accessibility:** View switching and node activation shall be keyboard
  operable and expose meaningful accessible names.
- **REQ-VIS-006 — Determinism:** Identical Markdown input shall produce identical map structure
  and layout.

## Daily-driver productivity requirements (added 2026-08-01)

- **REQ-PROD-001:** Daily and calendar notes shall be ordinary `Daily/YYYY-MM-DD.md` files.
- **REQ-PROD-002:** `Templates/Daily.md`, when present, shall support visible `{{date}}` and
  `{{title}}` substitution without executing template code.
- **REQ-PROD-003:** Workspace task aggregation shall recognize Markdown checkboxes, retain note
  and line provenance, ignore fenced examples, and perform no implicit write.
- **REQ-PROD-004:** Folder notes shall use a visible `_index.md` file with ordinary wikilinks.
- **REQ-PROD-005:** Property views shall read scalar YAML frontmatter and shall not require a
  proprietary database.
- **REQ-PROD-006:** Visual map edits shall be previewed and applied only to an unsaved Markdown
  draft; the existing checkpointed Save boundary remains the only commit path.
- **REQ-PROD-007:** PDF annotations shall be stored in a Markdown sidecar and never mutate the PDF.
