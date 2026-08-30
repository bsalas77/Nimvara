# Static export archive validation — 2026-08-30

`tools/package-static-export.mjs` packages an already-created static export folder into a new ZIP using the host `tar` implementation (`tar.exe` on Windows, `tar` elsewhere). It refuses missing/non-directory sources, archives inside the source folder, existing archive targets, and empty outputs. It never reads or modifies the Markdown workspace.

Evidence on this Windows host:

- A temporary export containing `index.html` produced a 343-byte ZIP successfully with host permission.
- The normal sandbox correctly reports `EXPORT_ARCHIVE_UNAVAILABLE` when child-process launch is restricted.
- The utility is intentionally separate from export generation so packaging failure cannot corrupt or roll back the source workspace.

