# Windows installed smoke rerun — 2026-08-29

- Installer rebuilt successfully from the current source.
- Smoke harness was run against a disposable copy of the user's vault.
- Result: **blocked**. The harness could not discover a WebView2 remote-debugging page before timeout (`WebView2 debugging target did not become available`).
- This is an instrumentation/launch-observation failure, not evidence that the application flow passed or failed.
- The source vault remained read-only and unchanged.
- A corrected rerun targeted `dist/windows-installer/payload/Nimvara.exe` rather than the setup executable; WebView2 remote-debugging discovery still did not become available. The remaining issue is therefore the packaged app/test-hook observability, not merely the setup filename.
- Direct launch verification confirms the packaged `Nimvara.exe` remains responsive for at least five seconds. Functional UI smoke assertions still require a supported WebView2 test hook.

Next action: run the smoke harness on a clean Windows test account with WebView2 debugging availability verified, or add a supported test hook to the installer build.

## Latest rerun — 2026-08-31

The same harness was rerun against `dist/Nimvara-Setup-0.7.0-dev.exe` and the read-only Obsidian-vault copy workflow. It again timed out before a WebView2 debugging target appeared. No source-vault files were modified. This confirms the instrumentation gate is repeatable; it does not provide functional UI pass/fail evidence.

## Fresh artifact rerun — 2026-08-31

The harness was run against the freshly rebuilt packaged executable at `dist/windows-installer/payload/Nimvara.exe`. It again ended with `WebView2 debugging target did not become available` after the bounded wait. The read-only source vault was not modified. The setup package and MSIX build checks pass; functional clean-install UI assertions remain unqualified until a supported WebView2 test hook or clean test account is available.
