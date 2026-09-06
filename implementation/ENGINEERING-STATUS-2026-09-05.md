# Engineering status — 2026-09-05

Later this day: see `UI-REFRESH-VALIDATION-2026-09-05.md` for the newer polished
installer, 29-check native UI result and manual Avast handoff. Earlier candidates
and checks below remain historical evidence, not the latest interface build.

Supersedes the Windows build-blocker section of the September 4 record. Production
approval remains false; all unrelated open gates in that record remain open.

## Verified

- Recompiled the build helper with start/end resource-preparation markers. The
  Windows release build now succeeds. This does not establish the earlier helper's
  root cause; no security settings or caches were removed.
- Rebuilt the custom setup and produced a standard Tauri NSIS setup. The latter
  bundles Microsoft's WebView2 bootstrapper and requests current-user installation.
  Reproduce with `packaging/windows/build-nsis.ps1`.
- Rebuilt native executable passed 22/22 desktop checks: the prior 17 plus read-only
  import preview, source/provenance integrity, imported-content search, duplicate
  prevention and cancellation. Synthetic copied workspace only; source unchanged.
  These are automated interactions, not usability certification or installed-upgrade
  evidence. The existing installed executable was not replaced successfully.
- Native release tests completed: 26 passed, 2 explicitly ignored benchmarks.
- Application tests: 92 passed. Final native desktop run had no unnamed controls
  and no uncaught browser errors. Tested executable SHA-256:
  `3a327011dcfbaeb1fc830b6a45bf96093ce289636557a3f52e8b2f0131443a67`.
- Linux packaging now changes into the Tauri directory before invoking its CLI.
  No new Linux GUI or macOS qualification is claimed.

## Exact installation blocker

Registered security products include Avast. Its local `autosandbox.log` records
`Result: Sandboxing` for the custom setup at 19:37/19:38 and NSIS setup at
19:40/19:41 on September 5. The same log records `Not sandboxing (dev mode)` for
the rebuilt application and native test executable. This explains the installer
holds observed during this session; it is not evidence of a malware detection.

Installer attempts were cancelled. No antivirus exclusion, shield disablement or
trust-policy change was performed. Installation requires an owner-reviewed Avast
decision for the exact unsigned candidate, or qualification on a separate clean
Windows target. Do not exclude the entire repository, drive or Downloads folder.

Preferred standard-installer candidate:
`dist/Nimvara-Setup-0.7.0-dev-nsis.exe` (5,247,215 bytes)

SHA-256: `98ad307b50e1fc90d38105c55db26befc5d1cb59b0d2ff015c0b6209b59199e2`

New checksums are recorded in `RELEASE-ARTIFACT-MANIFEST-2026-09-05.json`.
The historical August manifest is preserved; existing MSIX, DEB and SBOM remain
historical artifacts, not current-source builds. Neither setup is approved for
public production distribution. No public upload occurred.

## Next actions

1. Owner-reviewed exact-file Avast approval or separate clean Windows target;
   install, verify installed executable hash, rerun the 22 desktop assertions.
2. Qualify NSIS upgrade/settings retention/uninstall on a disposable Windows user
   profile, including migration from the old custom installer. Do not uninstall the
   user's application merely to simulate this check.
3. Rebuild current Linux source and run GUI/watcher tests; obtain Mac access details.
4. Resume native security/feature parity, real AI/provider tests and remaining
   engineering gates in the September 4 checklist.
