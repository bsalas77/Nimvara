# Local qualification record — 2026-08-30

## Scope

This record covers the reproducible Windows qualification command added in
commit `1c20290`:

```powershell
.\tools\run-local-gates.ps1
```

The command runs the JavaScript suite, Rust formatting/tests/clippy, a cached
RustSec audit without network access, exact release-artifact verification, and
the release-readiness evidence generator.

## Observed result

- JavaScript: **84/84 passed**.
- Rust: formatting, **26 tests passed**, and clippy with `-D warnings` passed.
- RustSec: **0 unignored vulnerabilities**; 16 allowed maintenance/yank warnings
  remain tracked by the dependency policy.
- Release artifacts: all four manifest entries passed exact byte and SHA-256
  verification.
- Readiness: **29/39 checks passed**. The command returns success after local
  gates pass even when the readiness report correctly records owner-controlled
  or external gates as incomplete.

## Environment limits

The managed Windows sandbox blocks Node's multi-process `node --test` launcher
with `spawn EPERM`; the repository's in-process `node tests/run-all.mjs` suite
is the authoritative local JavaScript run. Docker's Linux engine was also
unavailable on this host, so no new Linux-container or native Linux GUI result
is claimed here.

This record does not satisfy macOS, two-device sync, human accessibility,
independent security review, signing, licensing, legal name clearance, or public
URL gates.
