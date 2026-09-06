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

## Follow-up

The native startup path now explicitly calls `show`, `set_focus`, `set_size`, and
`set_position`. The rebuilt binary still reports a 50×50 restored frame under the
current Windows desktop session, so this is now isolated to window-state restoration
or WebView2/Tauri initialization rather than installer payload extraction. Do not
mark the packaged UI gate complete until a clean profile or manual desktop check
confirms the window opens at the configured size.

## Recheck — 2026-09-06

The unsigned current candidate
`dist/Nimvara-Setup-0.7.0-dev-desktop-safety.exe` was installed per-user over the
existing copy after the user explicitly authorized stopping Nimvara. The installed
payload is present at `%LOCALAPPDATA%\\Programs\\Nimvara`, including `Nimvara.exe`,
`uninstall.exe`, and the Start Menu shortcut. The installed executable SHA-256 is
`df0cc0f6c1cd0267811e39d89711ac6686ed22ed51c687aa5bb86de8f5cae8e0`.

The installed process launched but never exposed its WebView2 debugging target to
the automation harness and remained at a minimal process footprint. The test was
stopped; no workspace was opened or edited. This is an installed-runtime failure
to investigate, not a successful installed workflow qualification. The harness
now has a one-second timeout on every local debugging probe so this condition
fails promptly rather than hanging the release check.

## Root cause confirmed — 2026-09-06

The local Avast AutoSandbox log confirms the installed executable was sandboxed
on every failed smoke attempt, while the source-built executable was explicitly
recorded as not sandboxed. The installed process therefore never initialized its
native window or WebView2 debugging target. This is an antivirus reputation/
unsigned-code condition, not evidence of a Nimvara window lifecycle defect.

For this local development qualification only, the owner may add one narrow,
temporary Avast exception for the exact installed executable:

`C:\\Users\\Kogu\\AppData\\Local\\Programs\\Nimvara\\Nimvara.exe`

Do not exclude the enclosing Programs directory, the project directory, a drive,
or disable shields. The exception must be removed after the smoke test. A public
release must instead be Authenticode-signed and timestamped so it does not rely
on an antivirus exception.

Direct Win32 enumeration found two visible Nimvara-owned top-level windows, both
blank-titled and approximately 50×50 at the same off-screen edge. This indicates a
native window lifecycle/state problem rather than a missing WebView2 runtime.
