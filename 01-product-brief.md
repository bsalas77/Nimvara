# Product brief

## Problem

Obsidian gives users strong file ownership and flexibility, but useful workflows often require discovering, trusting, configuring, and maintaining plugins. Syncing configuration can be confusing, search quality can degrade with scale, and AI behavior varies across third-party extensions. Competing local-first products often introduce proprietary object models, collaboration complexity, hosted accounts, or a heavier interface.

Users need a tool that works before they develop a personal knowledge-management methodology.

## Initial audience

The first audience is privacy-conscious knowledge workers who turn source material into decisions and deliverables:

- cybersecurity, risk, compliance, and AI-governance professionals;
- consultants and independent advisors;
- researchers and technical writers;
- experienced note-app users tired of maintaining their tools.

The product must remain approachable for a new note-taking user. Domain-specific professional features come later.

## Core jobs

1. Capture information without deciding where everything belongs.
2. Find a known note quickly.
3. Ask questions across notes and verify the answer.
4. Turn source notes into a useful work product.
5. Improve organization without surrendering control to automation.
6. Recover from mistakes, device loss, or AI-generated changes.
7. Move to or from another Markdown application without lock-in.

## Experience principles

### Ready immediately

The installer includes everything required for writing, linking, searching, and backup. No account, command line, plugin selection, or AI configuration is required to use the core application.

### Progressive AI

The product works without AI. “Enable private AI” performs a hardware check, recommends a suitable model, explains disk and memory requirements, and downloads it only with consent.

### Safe by default

AI starts read-only. Writing actions are proposed as diffs. Bulk changes, deletion, external transmission, and overwrites always require explicit approval.

### Ordinary files

Markdown and attachments are authoritative. The index and embeddings are disposable and rebuildable. Nimvara metadata lives in a clearly named hidden folder and never contaminates note content unnecessarily.

### Defaults over configuration

Nimvara ships one coherent workflow. Advanced controls are disclosed gradually. The MVP has no general third-party plugin execution.

### Fast at human scale

Opening the application, creating a note, and searching should feel immediate. Indexing and AI work happen in the background and remain interruptible.

## Free MVP

### Included

- Windows, macOS, and Linux desktop installers
- new workspace and “open existing folder”
- Markdown editor with preview, outline, tabs, wikilinks, backlinks, tags, attachments, and command palette
- full-text search and quick-open
- inbox, recent, favorites, and project views
- Obsidian-compatible links and common frontmatter preservation
- local snapshots and restore
- backup to any selected local or cloud-synced destination
- local AI setup, cited question answering, summarization, and proposed edits
- no account, advertising, telemetry by default, or proprietary file format

### Explicitly excluded

- mobile applications
- multi-user real-time editing
- proprietary cross-device sync
- public plugin marketplace
- web publishing
- canvas/whiteboard
- databases comparable to Notion or Obsidian Bases
- autonomous background agents

## AI packaging recommendation

Local AI belongs in the free version because privacy is the defining promise. Charging for it would weaken the product story and produce a weak free experience.

Do not bundle a multi-gigabyte model inside the installer. Bundle the inference capability, then offer a one-click, resumable model download after a hardware check. Users can also connect an existing compatible local model service.

Potential future revenue:

- optional hosted AI for machines that cannot run a useful local model;
- encrypted multi-device sync;
- professional workflow packs and governance evidence exports;
- priority support;
- team policy and deployment controls.

Essential safety, backup, local AI, export, and file ownership remain free.

## Product metrics

Privacy-preserving, opt-in metrics only:

- installation-to-first-note completion;
- installation-to-first-successful-search;
- percentage of users who enable local AI;
- time to first cited AI answer;
- proposed-edit acceptance, rejection, and undo rates;
- successful backup and test-restore rate;
- weekly active use after four weeks;
- support incidents involving data loss: target zero.

## Release hypothesis

Users will adopt Nimvara if it removes setup work while preserving Markdown ownership. They will continue using it if cited AI answers and safe organization turn stored notes into useful work. A subset will later pay for convenience, sync, or professional workflows.
