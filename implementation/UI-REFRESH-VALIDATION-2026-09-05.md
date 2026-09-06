# Document-first UI refresh — 2026-09-05

User authorized an Avast exception and requested production completeness plus a
polished interface. Avast was not modified: the computer-use skill prohibits
antivirus/security-setting automation. The necessary manual action is below.

## Delivered and checked

- Quiet 232px notes sidebar and flexible editor; closed-by-default tools grouped
  into This note, Capture, Organize, AI, Settings/safety.
- Keyboard-accessible tool picker, Escape return to Tools, focus mode, compact
  desktop controls, larger touch targets, collapsible calendar/folder overview and
  dismissible task panel. Late-mounted feature sections retain tool access.
- Coordinated dark/light/high-contrast colors. Corrected light-mode callout and
  diagram colors after inspecting real native screenshots.
- Read-only preview folds frontmatter into inspectable, escaped note properties;
  source Markdown stays unchanged. Formatting toolbar stays out of preview/map.
- Removed speculative window-resize/focus callbacks. Default native window is
  1280x800, resizable down to 760x560. Native tests pass with normal window creation.
- 94/94 application tests and 29/29 native desktop assertions passed, with no
  unnamed tested controls or uncaught browser errors; sample source unchanged.
  Native desktop checks include editing/recovery/conflicts/backup/import and the
  new shell, tools, focus, representative theme contrast and 900px tools layout.
- Native executable SHA-256:
  `f11659337b23fdcbffd5c1d2b587cf7929d6e8014953e7fc8321d17682364dbc`.
- Screenshots: `dist/Nimvara-modern-dark.png`, `dist/Nimvara-modern-light.png`.
  They show the actual native app on synthetic notes, not a rendered mockup.

## Installation handoff

Use the NEW separate artifact `dist/Nimvara-Setup-0.7.0-dev-polished.exe`, not the
older NSIS candidate. It is 5,248,575 bytes and remains unsigned development software.
SHA-256: `e45294c4a1d88625397620c73f86228aa5bcfd8d5d8d7d48d6c226ff9068d05c`.
Older candidates were preserved. No installed-copy replacement is claimed.

In Avast: Menu > Settings > General > Exceptions > Add exception. Select only
`E:\Obisian Project\Lantern-Project\dist\Nimvara-Setup-0.7.0-dev-polished.exe`.
Do not exclude the project directory or a drive, and do not disable shields.
Remove the temporary exception after installer testing. A filename/path exception
is not inherently hash-pinned; verify the checksum if the file changes.

Official instructions checked during this pass:
https://support.avast.com/en-au/article/antivirus-scan-exclusions

## Remaining limits

These automated checks are not an accessibility certification, human usability
study, old-version upgrade test, security audit or proof of feature completeness.
The user has not yet evaluated the refreshed interface. The new source must be
rebuilt and qualified on Linux and macOS. Installation still needs manual Avast
review before its installed-app lifecycle can be checked on this host.

The full required/desired feature scope and acceptance criteria are recorded in
`PRODUCTION-SCOPE-AND-ACCEPTANCE.md`; native parity, live sync, real AI, mobile,
release operations and external gates remain open. Production approval remains false.

## Follow-up — 2026-09-06

The initial polished executable exposed a native-route parity gap in saved Kanban
boards and Canvas editing/history. The source has now been corrected and the
current native executable passed its automated workflow smoke. See
`NATIVE-DESKTOP-PARITY-VALIDATION-2026-09-06.md`. The prior polished installer is
not retroactively relabeled: it must be rebuilt before this correction reaches an
installed copy.
