# Phase 0 — discovery and risk reduction

Status: active  
Started: 2026-07-26

## Purpose

Phase 0 converts the product promise into testable requirements, prototypes, safety analysis, and evidence plans before production application development.

## Authoritative artifacts

- [Research repository](research/README.md)
- [Traceable requirements](requirements.md)
- [User journeys and acceptance criteria](user-journeys-and-acceptance.md)
- [Threat model and data-loss hazard analysis](threat-model-and-data-loss.md)
- [Cross-platform and local-AI test matrices](test-matrices.md)
- [Clickable-prototype specification](clickable-prototype-spec.md)
- [Phase 0 status, decisions, and gaps](status-and-exit-gate.md)
- [Artifact validation](VALIDATION.md)

## Traceability convention

- `SRC-nnn`: source or evidence record
- `UR-nnn`: user request or user-need requirement
- `FR-nnn`: functional requirement
- `NFR-nnn`: quality, security, compatibility, or operational requirement
- `J-nn`: user journey
- `AC-nnn`: acceptance criterion
- `T-nnn`: threat
- `H-nnn`: data-loss hazard
- `XP-nnn`: cross-platform test
- `AIH-nnn`: local-AI hardware test
- `P-nn`: prototype screen

An artifact is not evidence of validation merely because it is documented. Results stay `not run` until an actual session or test produces a dated record.

## Working rules

1. Markdown and attachments are authoritative; caches are disposable.
2. Local AI remains a free, optional capability.
3. AI is read-only unless a user reviews and approves a typed change.
4. Backups are versioned, integrity-checked, and provider-neutral.
5. Research records contain no participant names, contact information, employer-sensitive data, or private vault contents.
6. Claims distinguish source evidence, user statements, observations, measured tests, assumptions, and decisions.
