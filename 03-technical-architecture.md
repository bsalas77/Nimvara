# Technical architecture

Status: proposed for prototype validation

## Architecture goals

- one codebase for Windows, macOS, and Linux;
- installer-ready desktop application with no account requirement;
- normal Markdown files remain readable without Nimvara;
- safe local AI that adapts to available hardware;
- recoverable writes and backups;
- narrow, auditable operating-system permissions;
- responsive use while indexing or inference is active.

## Proposed stack

### Desktop shell

Tauri 2 with a Rust core and a TypeScript/React interface.

Reasons:

- native packages across the three required desktop platforms;
- smaller application footprint than bundling a full browser runtime;
- explicit capability and filesystem permission boundaries;
- good fit for filesystem, hashing, indexing, and local-process integration in Rust.

Risk: behavior depends on each operating system’s webview. A native test matrix is mandatory.

### Editor

CodeMirror 6 with a constrained Markdown extension set.

Required behaviors:

- source editing with lightweight live rendering;
- Obsidian-style `[[wikilinks]]`;
- standard Markdown links, headings, tasks, code fences, tables, and callouts where practical;
- frontmatter preservation even when Nimvara does not understand every property;
- deterministic saving and external-change detection.

The editor must never rewrite an entire document merely by opening it.

### Storage

Workspace:

```text
Workspace/
  Notes and user folders...
  Attachments/
  .lantern/
    index.sqlite
    settings.json
    history/
```

- Markdown and attachments are authoritative.
- SQLite stores full-text search, backlinks, parsed metadata, AI chunks, and job state.
- The database can be deleted and rebuilt.
- AI-generated embeddings are local cache data and excluded from provider-neutral backups by default.
- File operations use atomic temporary-write-and-rename behavior when supported.
- External changes are watched, debounced, and reconciled without assuming Nimvara is the only editor.

### Local AI runtime

Use a small adapter interface rather than binding product behavior to one runtime:

```text
LocalAIProvider
  detect()
  listModels()
  installModel()
  embed()
  generate()
  cancel()
  health()
```

Prototype with llama.cpp because it supports CPU, Metal, CUDA, HIP, Vulkan, SYCL, and multiple operating systems. Also support connection to an existing Ollama-compatible local endpoint.

Distribution approach:

- application works without a model;
- ship or acquire the appropriate signed inference component;
- guided setup downloads an approved GGUF model;
- verify publisher, license metadata, expected size, and SHA-256 hash;
- store models outside the workspace and exclude them from backup;
- permit deletion and replacement from the UI.

Do not silently choose the largest model a device appears able to run. Preserve memory for the editor and operating system.

### Retrieval

The cited-answer pipeline:

1. Parse and chunk supported local documents.
2. Retrieve candidates using full-text search.
3. Optionally rerank with local embeddings.
4. Send only selected chunks to the model.
5. Require structured citations mapping output statements to file and section identifiers.
6. Validate that cited identifiers were actually supplied.
7. Display answer, sources, and retrieval limitations.

“No supporting note found” is a valid response. The UI must not imply that citations make a generated answer correct.

### AI actions

AI cannot call raw filesystem tools.

It may return typed proposals:

- create note;
- patch selected text;
- add link;
- move note;
- rename note;
- add metadata;
- create work product.

The Rust core validates paths, scope, preconditions, file versions, and limits. The UI displays the proposed change. Approved changes create a recovery checkpoint before execution.

Deletion and bulk movement are excluded from the first AI release.

## Backup design

### MVP: destination-folder snapshots

The user selects a writable destination. Nimvara creates encrypted or unencrypted snapshot archives containing:

- Markdown and attachments;
- workspace settings required for recovery;
- manifest with schema version, timestamps, file hashes, and application version.

Requirements:

- never write backup archives inside the source workspace;
- verify destination free space before starting;
- write to a temporary archive, verify it, then rename atomically;
- show last successful backup and last verified restore;
- permit browsing a snapshot before restoration;
- restore into a new folder by default;
- require an additional confirmation to replace an existing workspace;
- offer encryption with a recovery-key warning and no false promise that lost keys can be recovered.

Users may choose a OneDrive, Google Drive, Box, Dropbox, NAS, or removable-drive folder. The provider transports the snapshot; Nimvara owns backup integrity.

### Later: direct cloud destinations

Evaluate provider APIs only after demand is demonstrated. Direct connections introduce OAuth token custody, provider-review requirements, Linux-specific value, API changes, support burden, and recurring security work.

## Security architecture

### Trust boundaries

- notes and imported content are untrusted data;
- rendered Markdown cannot execute scripts;
- the webview receives only narrowly scoped commands;
- local model output is untrusted;
- remote providers, if enabled, are separate trust zones;
- backup destinations may be unavailable, slow, or maliciously modified.

### Required controls

- strict Tauri capability configuration per window;
- strict CSP with bundled assets and no remote script execution;
- sanitized Markdown/HTML rendering;
- canonicalized paths constrained to approved roots;
- OS credential store for API credentials;
- network disabled unless the user enables model download, update checks, or a provider;
- visible offline/local/remote AI indicator on every AI interaction;
- update signatures and platform code signing;
- dependency lockfiles, SBOM, automated audit, and release provenance;
- structured security event log without note contents;
- no telemetry until a separate, explicit opt-in design is reviewed.

### Encryption

Nimvara should not claim that ordinary local Markdown is encrypted. It inherits device and filesystem protections such as BitLocker, FileVault, or LUKS.

MVP backup archives may offer authenticated encryption. Whole-workspace application encryption should not be added casually because it conflicts with plain-file interoperability, external editors, indexing, cloud placeholders, and recoverability.

## Quality targets

Initial targets to validate, not marketing promises:

- usable shell shown within 1.5 seconds on reference hardware;
- new-note interaction available before background index completion;
- search result update within 150 ms for a 10,000-note reference workspace;
- no data mutation during import/open;
- interrupted save leaves either old or new valid content, never a partial file;
- every AI write has a pre-change checkpoint and visible diff;
- tested restore succeeds from every supported backup format;
- keyboard-only operation for all core workflows;
- WCAG 2.2 AA design intent for the interface.

## Build and release

- native CI runners for Windows, macOS, and Linux;
- signed Windows packages;
- signed and notarized macOS packages;
- AppImage and Debian packages first on Linux;
- automated updater with signature validation and a staged rollout;
- release health check and retained previous installer;
- unit, property, integration, migration, recovery, accessibility, and end-to-end tests;
- fixture workspaces including Unicode paths, long paths, symlinks, cloud placeholders, large files, and malformed Markdown.
