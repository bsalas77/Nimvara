# Windows installed smoke rerun — 2026-08-29

- Installer rebuilt successfully from the current source.
- Smoke harness was run against a disposable copy of the user's vault.
- Result: **blocked**. The harness could not discover a WebView2 remote-debugging page before timeout (`WebView2 debugging target did not become available`).
- This is an instrumentation/launch-observation failure, not evidence that the application flow passed or failed.
- The source vault remained read-only and unchanged.
- A corrected rerun targeted `dist/windows-installer/payload/Nimvara.exe` rather than the setup executable; WebView2 remote-debugging discovery still did not become available. The remaining issue is therefore the packaged app/test-hook observability, not merely the setup filename.

Next action: run the smoke harness on a clean Windows test account with WebView2 debugging availability verified, or add a supported test hook to the installer build.
