# Windows 0.7.1 installer attempt — 2026-09-06

## Scope

This record covers only the locally built unsigned development candidate
`dist/Nimvara-Setup-0.7.1-dev.exe`. It does not certify a production release.

## Verified facts

- Candidate size: 5,259,856 bytes.
- Candidate SHA-256:
  `d3094067fac9dae5f64440373abc478fb01cfb3af408795c5632b4521c6f2708`.
- The user confirmed an Avast exception was added for the 0.7.1 installer path.
- Silent per-user upgrade attempts launched the candidate from that exact path,
  targeted at `%LOCALAPPDATA%\\Programs\\Nimvara`, but did not return an exit
  result or replace `Nimvara.exe`.
- The installed executable remained 14,237,696 bytes with its prior
  2026-09-05 20:09:58 local timestamp.
- Three 0.7.1 setup processes remained hung. Their command lines contained the
  expected source path, `/S`, and the expected per-user target. They were closed
  after inspection. No workspace, backup, settings, or user vault file was read,
  changed, moved, or deleted.

## Conclusion

The 0.7.1 installer bytes and manifest are valid as a candidate, but this host
did not complete installation. The installed-app smoke, clean lifecycle,
upgrade/rollback, and uninstall-retention gates remain open. The evidence is
consistent with security software intercepting setup execution; it is not
evidence that the installer completed or that the new app is defective.

## Safe next qualification

Use a non-sandboxed, ordinary Windows test account or a Windows VM with the
installer's executable path explicitly permitted by the active security product.
Then run `node tools/windows-installed-ui-smoke.mjs` against the installed
`Nimvara.exe` and perform the disposable upgrade/uninstall retention drill. Do
not remove broad antivirus protection or add a broad folder exclusion for a
release candidate.
