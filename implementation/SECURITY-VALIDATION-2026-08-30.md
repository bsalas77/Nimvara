# Security validation update — 2026-08-30

The locked Rust audit was rerun after the encrypted snapshot and native publishing changes with elevated access to the Cargo cache. The reviewed `glib` backport resolved correctly and `cargo-audit` completed with no unignored vulnerability advisories.

The earlier audit snapshot reported 17 allowed maintenance/yank warnings: GTK3-family crates, `proc-macro-error`, Unicode helper crates, and yanked `chacha20`. A later cached advisory run reports 16; the count can change as the advisory database changes. These are not silently treated as zero risk. They remain tracked dependency risks; Linux release qualification must review the reachable GTK graph and the project must replace or formally accept each warning before a stable release.

The first attempt failed only because the sandbox could not create the local Cargo registry directory (`Access is denied`); the elevated retry completed the audit. This is an environment limitation, not a code-level finding.

This remains an internal dependency audit, not an independent penetration test, fuzzing campaign, or certification.

## Revalidation — 2026-08-31

`cargo audit --no-fetch --json` was rerun against the 480-package lockfile using the locally available advisory database. It reported `vulnerabilities.found: false` and `count: 0`. Informational unmaintained/yank warnings remain as described above. A normal database-refresh run could not obtain the Cargo advisory-db lock in the restricted environment, so this is a no-refresh revalidation rather than a current-advisory guarantee.
