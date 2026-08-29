# MVP roadmap

This roadmap uses evidence gates rather than fixed promises. Estimates follow prototype validation.

## Phase 0 — discovery and risk reduction

Deliverables:

- interview 8–12 users across target segments;
- observe at least five existing Obsidian workflows;
- analyze anonymized configuration/plugin inventories with permission;
- prototype install, first-run, search, local-AI setup, cited answer, change approval, and restore;
- benchmark local inference across a representative hardware matrix;
- test Tauri filesystem behavior on all three operating systems;
- publish threat model and data-loss hazard analysis.

Exit gate:

- at least 70% of participants complete first note, first search, and backup without assistance;
- at least 6 of 8 target users identify cited AI or reviewed AI changes as meaningfully better than their current workflow;
- no unresolved architecture-level data-loss risk.

## Phase 1 — trustworthy file foundation

Build:

- installers and first-run flow;
- create/open workspace;
- editor, file navigation, outline, tabs, attachments, links, and tags;
- atomic saves, external-change handling, file history, and crash recovery;
- SQLite indexing and full-text search;
- Obsidian compatibility fixture suite;
- local snapshot creation, validation, browsing, and restore.

Exit gate:

- 30-day dogfood test without unrecoverable data loss;
- successful restore tests across Windows, macOS, and two Linux distributions;
- opening a compatibility fixture makes zero unintended content changes.

## Phase 2 — local AI

Build:

- hardware assessment;
- guided model selection and verified download;
- llama.cpp provider and existing-local-server adapter;
- cancellable inference;
- hybrid retrieval and source display;
- read-only Q&A and summarization;
- structured edit proposals and diff approval;
- automatic checkpoint and undo.

Exit gate:

- citation validator rejects invented source identifiers;
- prompt-injection test corpus cannot trigger unapproved file or network actions;
- every accepted AI mutation is recoverable;
- usability participants understand whether AI is local or remote.

## Phase 3 — free public preview

Build:

- signed release pipeline and updates;
- onboarding sample workspace;
- in-app diagnostics export with private content excluded;
- accessibility review;
- concise privacy and security documentation;
- opt-in feedback channel;
- public issue triage and release process.

Exit gate:

- installation success on supported platform matrix;
- restore drill included in release qualification;
- no open critical security or data-integrity defects;
- four-week retention signal strong enough to justify continued development.

## Phase 4 — product-market validation

Do not add a paid tier immediately.

Measure:

- repeat cited-AI use;
- backup setup and restore confidence;
- replacement of plugin-heavy workflows;
- usage by people with modest hardware;
- support volume by platform;
- demand for encrypted sync, hosted AI, professional packs, and support.

Only monetize after the free product demonstrates durable weekly use.

## Suggested first backlog

### P0

- cross-platform project skeleton;
- workspace path permission model;
- lossless Markdown read/write tests;
- atomic save and recovery journal;
- file watcher conflict model;
- full-text index;
- snapshot manifest and restore;
- threat model.

### P1

- editor shell and command palette;
- wikilinks and backlinks;
- attachments;
- import compatibility report;
- AI provider abstraction;
- model hardware probe;
- cited-answer prototype;
- proposed-edit diff.

### P2

- themes beyond system/light/dark;
- advanced frontmatter UI;
- graph visualization;
- direct cloud provider APIs;
- extension system;
- professional templates.

## Launch non-goals

The launch is not delayed for feature parity with Obsidian. It is delayed for data-integrity, recovery, installation, or security failures.
