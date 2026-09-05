# Engineering status — 2026-09-04

This record supersedes earlier conclusions that all local engineering gates were
closed or that the Windows runtime was proven broken. The 29/39 report counts
many source-file-presence checks; it is not a percentage of product completion.

## Verified this session

- Installed Windows build reached WebView2 outside the execution sandbox.
- Corrected the smoke harness to wait for event handlers before clicking Open.
- Reused one isolated WebView2 profile across crash/restart so recovery tests
  preserve session preferences. Earlier tests used different profiles per launch.
- 16 of 17 installed smoke assertions passed: workspace open, tree, tasks, safe
  preview, transclusion, commands, properties, views, daily notes, compatibility,
  Canvas viewing, draft journaling, recovery, search, backup/restore and conflicts.
- Source fixture unchanged. No user vault was used.
- Remaining automated accessibility assertion identified the saved-view-name input.
  Its accessible name is fixed in source but not yet validated in a rebuilt package.
- Linux existing DEB installed, reinstalled, resolved dependencies and uninstalled
  in a disposable container. External synthetic notes and backups retained hashes.
  Reproduce with `tools/linux-package-smoke.sh` in the existing Linux builder image.
- macOS packaging now changes to the Tauri directory before invoking the build CLI.
- UI preference reads now tolerate malformed JSON and wrong-shaped tabs, settings
  and saved Kanban views. Denied/full preference storage retains changes in memory
  with a visible warning, without changing authoritative note storage.
- Application suite: 91/91 passed, including four preference-failure regressions.
  These source tests do not replace native packaged application qualification.
- Release checker now includes 11 explicit open engineering acceptance gates, in
  addition to the older presence checks. Its totals must not be read as percent ready.

## Current blocker

Windows rebuild stalled in build-script-build.exe, including outside the sandbox.
The stalled build was cancelled. No newly built installer is claimed in this pass.
Existing release artifacts remain at their previously recorded versions. No runtime,
Windows profile, user settings or security configuration was removed or reset.
Direct execution of the generated helper also stalled without output. Recent
Code Integrity events inspected did not identify this helper; root cause remains
unresolved. All three retry processes from this investigation were cancelled.

## Required engineering queue

1. Finish rebuild; pass 17/17 installed checks including accessible saved-view name.
2. Remove speculative forced sizing/focus callbacks after normal-window behavior is
   verified; inspect actual Tauri main window, not arbitrary helper windows.
3. Qualify Windows install/upgrade/rollback/uninstall with an ordinary user and
   WebView2 bootstrap prerequisites on clean Windows targets.
4. Rebuild Linux from current source; test X11/Wayland GUI and watcher behavior.
5. Build/test on the user's Mac once architecture, OS and access are known.
6. Implement and test persistent OS credential protection, AI cancellation and real
   model/provider evaluation; no model download or thermal measurement is claimed.
7. Audit and implement native route parity: several extensions, migration and
   encrypted-backup functions currently exist in the Node service only.
8. Complete isolated extension execution and explicit connector/browser-capture flows.
9. Complete Markdown rendering parity, migration diagnostics and large-vault evidence.
10. Implement mobile clients and validate offline/document-provider lifecycle.
11. Complete update verification/rollback tests and release identity integration.

Independent security, accessibility, usability and live two-device sync testing
remain required. License, publisher identity, signing and public URLs remain owner
decisions. They cannot be replaced by these engineering tests.
