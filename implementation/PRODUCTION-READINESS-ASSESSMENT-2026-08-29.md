# Nimvara production-readiness assessment

## Current value

Nimvara already has a credible trust-first foundation for a free early-access distribution: Markdown remains authoritative; saves are atomic and conflict-aware; checkpoints and verified snapshots are available; imports are previewed, provenance-tagged, duplicate-aware, and SSRF-constrained; migration copies are hash-verified; Kanban changes are reviewable; and selected notes can be exported safely.

The current product value is strongest for privacy-conscious individual knowledge workers who want ordinary files, safe recovery, local-first operation, and a simpler alternative to plugin-dependent workflows.

## Release confidence

**Early-access / technical preview: suitable.** The JavaScript suite passes 66/66, Rust tests pass 20/20, and strict clippy passes. Windows installer and native application work have been exercised, but installed WebView2 automation and Linux/macOS qualification remain incomplete.

**Broad public production release: not yet.** The remaining blockers are complete attachment repair and preview workflows, a complete interactive canvas editor, extension installation and signature verification, polished publishing, encrypted backups/key management, app-closed scheduling, diagnostic redaction evidence, and human/platform validation. Bounded persisted scheduling and explicit run-now snapshots are implemented; they do not constitute encrypted backup or multi-device sync.

## Recommended distribution posture

Publish only as a clearly labeled unsigned Windows early-access build with sample workspace and backups enabled. Do not claim full Obsidian replacement, cross-platform readiness, signed updates, or production collaboration until the remaining gates are evidenced.

## Value and pricing hypothesis

The free core should include Markdown editing, local search, import/capture, recovery, verified backup/restore, migration, and local AI adapters. A future paid tier can reasonably charge for managed sync, hosted collaboration, support, encrypted backup service, and curated connectors—never for the user's ability to open, export, recover, or leave their files.
