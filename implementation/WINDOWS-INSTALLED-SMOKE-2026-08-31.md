# Windows installed smoke — 2026-08-31

## Result

The rebuilt per-user installer was installed over the previous 0.7.0 installation
and the current binary is present at `%LOCALAPPDATA%\\Programs\\Nimvara\\Nimvara.exe`.

The automated WebView2 smoke harness was corrected to discover the first Markdown
note in small fixtures and to use an isolated WebView2 profile. The harness still
cannot obtain a WebView2 remote-debugging target from the packaged process on this
host (`WebView2 debugging target did not become available`). This leaves automated
installed UI qualification open; it is not evidence that the application workflow
passed. Manual desktop smoke testing remains required.

## Reproduction

```powershell
node tools/windows-installed-ui-smoke.mjs `
  "$env:LOCALAPPDATA\\Programs\\Nimvara\\Nimvara.exe" `
  "sample-workspace"
```

The harness remains source-preserving and cleans its disposable workspace on exit.
