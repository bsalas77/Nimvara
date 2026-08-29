# Windows validation record

Date: 2026-07-26  
Host: Windows, Node.js v24.18.0  
Rust/Tauri: unavailable

## Automated results

| Test | Result |
|---|---|
| Lossless UTF-8/CRLF read | pass |
| Unicode filename/content | pass |
| Long nested path supported by host | pass |
| Full-text search | pass |
| Stale-hash conflict blocks write | pass |
| Simulated interruption before atomic rename preserves old bytes | pass |
| Temporary file cleanup after interruption | pass |
| Pre-save checkpoint and byte-correct restore | pass |
| Snapshot includes Markdown and binary attachment | pass |
| Snapshot and restored-byte verification | pass |
| Corruption detection | pass |
| Unsafe in-workspace backup rejection | pass |
| Traversal/reserved/non-Markdown edit rejection | pass |
| Server JavaScript syntax checks | pass |
| Local HTTP UI and status endpoint | HTTP 200 |
| Sample workspace open through API | pass; 4 Markdown files |

Result: 16 automated test cases passed, 0 failed: 8 file-safety/recovery cases and 8 ingestion/security cases.

## Capture and ingestion results

| Test | Result |
|---|---|
| SSRF scheme/host/address policy | pass |
| HTML/script/form/executable-URL sanitization | pass |
| URL preview, canonical provenance, commit, search | pass with deterministic fetch fixture |
| Canonical URL/content-hash duplicate detection | pass |
| PDF/DOCX preservation-only import | pass |
| Malformed UTF-8 and oversized/unsupported input handling | pass |
| Cancel and fresh retry | pass |
| Commit rollback and unchanged source | pass |

Live public-Internet capture was not exercised on this network-restricted host.

## Installer drill

See [Windows installer validation](WINDOWS-INSTALLER.md). Install, app-window launch, save/search/ingestion/snapshot/restore smoke flow, upgrade retention, and uninstall retention passed.

## Host constraints

- Node’s multi-process test-runner mode was blocked by the managed sandbox (`spawn EPERM`); the same `node:test` suite passed in-process.
- Two approved npm dependency-install attempts timed out and produced no dependency tree.
- React/TypeScript source is present but could not be compiled on this host.
- The zero-dependency UI and filesystem core remain runnable without npm packages.

## Gates not satisfied

- Native macOS APFS behavior, case variants, file coordination, signing/notarization
- Native Linux ext4/Btrfs behavior, AppImage/Debian packaging, permissions
- Windows installer, WebView2/Tauri capability model, code signing
- Physical power-loss testing and filesystem/disk-full/antivirus injection
- OneDrive placeholder/conflict testing
- Assistive-technology and keyboard-only audit
- Actual-vault migration rehearsal on a copied vault
