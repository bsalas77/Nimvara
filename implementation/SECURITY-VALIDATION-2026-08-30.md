# Security validation update — 2026-08-30

The locked Rust audit was rerun after the encrypted snapshot and native publishing changes with elevated access to the Cargo cache. The reviewed `glib` backport resolved correctly and `cargo-audit` completed with no unignored vulnerability advisories.

The audit reported 17 allowed maintenance/yank warnings: GTK3-family crates, `proc-macro-error`, Unicode helper crates, and yanked `chacha20`. These are not silently treated as zero risk. They remain tracked dependency risks; Linux release qualification must review the reachable GTK graph and the project must replace or formally accept each warning before a stable release.

The first attempt failed only because the sandbox could not create the local Cargo registry directory (`Access is denied`); the elevated retry completed the audit. This is an environment limitation, not a code-level finding.

This remains an internal dependency audit, not an independent penetration test, fuzzing campaign, or certification.
