# Project Nimvara

Project Nimvara is a pre-release, local-first knowledge application for Windows, macOS, and Linux. It opens ordinary Markdown folders and now includes a development-stage, read-only optional AI adapter with visible source paths. Public production readiness has not yet been established.

Nimvara is licensed under the [Apache License 2.0](LICENSE). The current release
focus is Windows and Linux; macOS/iPad qualification is intentionally deferred.

The current Windows development build also includes a Markdown-native mind-map view. It
projects headings, nested lists, and wikilinks into an interactive visual map while keeping
the note as the authoritative source and performing no implicit file writes.

Nimvara is the selected product name, replacing the internal Lantern codename. Preliminary
exact-name screening found no indexed software, app-store, GitHub, or readily indexed
trademark collision. Formal legal clearance and domain/store reservation remain required
before a signed stable release. See [the naming decision](implementation/NAME-SCREEN-SKY-WRITER-2026-07-27.md).

## Product promise

> Your knowledge stays in ordinary files. AI shows its sources. You approve every meaningful change.

## Current decision

Proceed with a free desktop MVP. Local AI is part of the free product, not a paid gate. Users may optionally install a recommended model through a guided setup. Future paid features should fund convenience and professional workflows—not privacy, data ownership, export, backup, or essential AI safety.

## Project documents

- [01-product-brief.md](01-product-brief.md) — vision, target users, scope, and product principles
- [02-research-findings.md](02-research-findings.md) — market and user-needs research
- [03-technical-architecture.md](03-technical-architecture.md) — cross-platform, AI, storage, backup, and security design
- [04-mvp-roadmap.md](04-mvp-roadmap.md) — staged implementation and release gates
- [05-user-research-plan.md](05-user-research-plan.md) — how user requests will drive the product
- [06-decision-register.md](06-decision-register.md) — decisions, assumptions, and unresolved questions

## MVP success definition

A new user can:

1. Install Nimvara without developer tools.
2. Create a new workspace or open an existing Obsidian-compatible folder.
3. Write and find notes immediately.
4. turn on local AI through a guided hardware check and model download;
5. ask a question and see supporting note citations;
6. review and approve an AI-proposed edit;
7. create and restore a versioned backup;
8. uninstall Nimvara without losing access to their Markdown files.

## Phase 0 repository

- [Phase 0 index](phase-0/README.md) — active research, requirements, safety, test, and prototype repository
- [Transfer validation](TRANSFER-VALIDATION.md) — source-package provenance and checksums

## Runnable vertical slice

- [Install Nimvara for Windows](Nimvara-Setup.exe)
- [Unsigned Windows Store development package](dist/Nimvara-0.7.0-dev.msix)
- [Implementation and run instructions](implementation/README.md)
- [Windows validation](implementation/WINDOWS-VALIDATION.md)
- [Anonymized Obsidian compatibility report](implementation/OBSIDIAN-COMPATIBILITY-REPORT.md)
- [Prioritized daily-driver gaps](implementation/PRIORITIZED-GAPS.md)
- [Capture and ingestion capabilities](implementation/CAPTURE-INGESTION.md)
- [Windows installer validation](implementation/WINDOWS-INSTALLER.md)
- [Security validation](implementation/SECURITY-VALIDATION-0.7.md)
- [Linux, macOS, iPad, and Android plan](implementation/CROSS-PLATFORM-DISTRIBUTION.md)

## Immediate next milestone

Complete the release blockers in [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md). The 0.7 development build adds a reduced Tauri capability allowlist, portable-path/NTFS-stream defenses, case-collision-safe restores, indexed warm search, read-only local/paid AI provider boundaries, clean static analysis, an SBOM, and cross-platform build definitions. Windows and Debian development artifacts exist; macOS/mobile and public signing remain platform/account-gated.

Competitive evidence, differentiation, and pricing hypotheses are recorded in [implementation/COMPETITIVE-VALIDATION-2026-07.md](implementation/COMPETITIVE-VALIDATION-2026-07.md). They are hypotheses pending real interviews and measured tests.
