# Nimvara daily-driver vertical slice

Status: installable Windows-host development slice  
Last engineering validation: 2026-08-29

Release-readiness was regenerated on 2026-08-29. The current development distribution
set remains intentionally pre-production: 12 of 22 automated/owner gates pass; the
remaining gates are documented in `dist/release-readiness.json` and are not being
papered over by synthetic evidence.

## Architecture decision

The desktop shell is now Tauri 2 with a Rust privileged core and a bundled static client.
Rust/Cargo and the Windows build prerequisites are installed on this host. The earlier
loopback Node service remains only as a developer/test fallback and is not the installed
desktop security boundary.

- Tauri 2 application window;
- typed Rust filesystem, search, backup, ingestion, and AI commands;
- reduced Tauri capability allowlist;
- zero runtime dependency on Node or a manually opened localhost page.

## Implemented

- first-run open/create folder flow and sample workspace;
- recursive Markdown navigation;
- plain-text Markdown editor;
- quick case-insensitive full-text search;
- expected-hash external-change detection;
- durable temporary write plus atomic rename and byte verification;
- pre-save local checkpoints and checkpoint restore;
- provider-neutral versioned snapshot directories;
- snapshot manifests with SHA-256 and byte counts;
- corruption detection and restore into a new/empty folder;
- path traversal, metadata-path, and non-Markdown edit rejection;
- workspace/backup separation;
- preview-first public URL capture and local file ingestion;
- provenance and duplicate detection;
- safe preservation-only PDF/DOCX imports;
- conventional per-user Windows installer and application-mode window.

Optional AI now has a read-only OpenAI-compatible native adapter and review-before-write
edit proposals. Local mode is loopback-only; external paid mode uses a reviewed HTTPS host
allowlist. Model imports require a complete manifest and two successful integrity checks
before atomic activation. See `AI-PROVIDER-FOUNDATION.md`,
`AI-REVIEWED-EDITS.md`, `LOCAL-MODEL-SETUP.md`, and `AI-PROVIDER-CONTROLS.md`.

## Install on this Windows host

Run:

```text
E:\Obisian Project\Lantern-Project\Nimvara-Setup.exe
```

Choose whether to create the optional desktop shortcut. Launch Nimvara from the Start Menu. No terminal, separate Node installation, or manual localhost navigation is required.

This is an unsigned development installer; SmartScreen warnings are expected. See [Windows installer validation](WINDOWS-INSTALLER.md).

## Developer fallback

From PowerShell:

```powershell
cd 'E:\Obisian Project\Lantern-Project\app'
node server\index.mjs
```

Open `http://127.0.0.1:4317` in a browser. The first-run field defaults to:

```text
E:\Obisian Project\Lantern-Project\sample-workspace
```

Stop with `Ctrl+C`.

No npm installation is required for either the installed zero-dependency client or developer fallback.

## Run tests

```powershell
cd 'E:\Obisian Project\Lantern-Project\app'
node tests\run-all.mjs
```

The package shortcut is:

```powershell
npm.cmd test
```

## Native engineering validation

```powershell
cd 'E:\Obisian Project\Lantern-Project\app'
C:\Users\Kogu\.cargo\bin\cargo.exe test --manifest-path src-tauri\Cargo.toml
C:\Users\Kogu\.cargo\bin\cargo.exe clippy --manifest-path src-tauri\Cargo.toml --all-targets -- -D warnings
npm.cmd test
```

### Linux status

The Ubuntu 25.04 VirtualBox guest `Ububtu1` is running and its NAT SSH forward is
configured (`127.0.0.1:2222` → guest port 22). The guest SSH service was enabled,
but authenticated access for `Barry` is not yet configured, so Linux-side tests are
blocked. See `LINUX-VM-VALIDATION-2026-08-29.md` for the evidence and the one-time
key authorization step. No Linux pass is claimed until the qualification harness
has run in the guest.

## Safety limitations

- Evaluate with copies or backups of important vaults.
- Atomic replacement behavior is validated on this Windows filesystem only.
- Checkpoint metadata/content writes are not yet transactional as a group.
- File watching and expected-hash save checks both protect against external changes.
- Search uses a disposable persistent incremental index with cancellation and progress.
- Snapshot retention, encryption, exclusion rules, and overwrite restore are absent.
- Symlinks are skipped during backup/navigation but realpath/TOCTOU hardening belongs in Rust.
- The development installer exists, but code signing, a signed updater, optional OS credential-vault persistence, release-grade CSP review, and native accessibility audit remain open.
- Live public-Internet capture was not exercised by automated tests on this network-restricted host; URL security and extraction were tested with deterministic fixtures.

## Integration boundaries

See `EXTENSION-CAPABILITIES.md` for the loopback HTTP API, read-only MCP stdio bridge,
and guarded AI/plugin adapter contract. Neither integration surface bypasses the
checkpointed save path.

The provider-neutral sync qualification contract is in `SYNC-QUALIFICATION-MILESTONE-2026-08-28.md`.
It is a deterministic safety harness; live two-device provider qualification remains open.
