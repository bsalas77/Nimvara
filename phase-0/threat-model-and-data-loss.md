# Threat model and data-loss hazard analysis

Status: Phase 0 design analysis; controls require implementation verification

## Assets and trust boundaries

Assets: Markdown/attachments, version history, backup snapshots and keys, model binaries, credentials, user decisions, indexes, and release/update integrity.

Trust boundaries:

1. untrusted workspace and imported content → renderer/parser/indexer;
2. untrusted note chunks and model output → AI proposal layer;
3. webview/UI → privileged Rust core;
4. approved workspace/backup roots → rest of filesystem;
5. Nimvara → model/update/provider networks;
6. workspace → backup destination/provider transport;
7. installed application → dependency, model, and update supply chains.

## Threats

| ID | Threat/scenario | Impact | Required controls | Verification | Residual question |
|---|---|---|---|---|---|
| T-001 | Script/active content in Markdown executes in webview | credential/file compromise | sanitize HTML; strict CSP; no remote scripts; narrow commands | malicious fixture suite | renderer choice/config |
| T-002 | Prompt injection asks AI to exfiltrate or alter files | disclosure/integrity loss | content treated as data; no raw tools; typed proposals; explicit network/write approval | injection corpus | corpus coverage |
| T-003 | Path traversal, symlink, junction, or case confusion escapes approved root | arbitrary file access | canonicalize; root checks; platform-specific link policy; TOCTOU defense | XP-008–XP-010 | exact symlink policy |
| T-004 | Compromised webview invokes privileged command | arbitrary operation | per-window capability allowlist; input schemas; authorization in core | command-fuzz tests | Tauri configuration |
| T-005 | Malicious or substituted model/runtime download | code execution/unsafe output | allowlist; HTTPS; publisher/license/size/hash verification; signed runtime | tamper tests | model distribution terms |
| T-006 | Update/dependency compromise | systemic compromise | signing/notarization; locked dependencies; SBOM; provenance; audit; staged rollback | release-pipeline test | reproducibility level |
| T-007 | Secrets or note text enter logs/diagnostics | disclosure | structured metadata-only logs; golden redaction tests; explicit export preview | log inspection | diagnostic schema |
| T-008 | Remote provider enabled without clear consent | disclosure | network off by default; per-provider consent; persistent mode indicator | network capture/usability | hosted fallback later |
| T-009 | AI proposal exceeds stated scope or uses stale content | integrity loss | action/file limits; diff; version preconditions; partial approval; checkpoint | J-04 tests | default bulk limit |
| T-010 | Backup snapshot is read/tampered with | disclosure/false recovery | optional authenticated encryption; manifest hashes; verification; clear key warning | corrupt/tamper tests | encryption default |
| T-011 | Backup destination is hostile/unavailable/placeholder-only | incomplete backup | free-space/availability checks; temp artifact; read-back verification; never trust listing alone | XP-011–XP-013 | cloud placeholder handling |
| T-012 | Extension/plugin executes arbitrary code | broad compromise | no arbitrary plugins in MVP | package inspection | future extension model |
| T-013 | URL capture reaches localhost, cloud metadata, private networks, or rebinding target | SSRF/disclosure | scheme/host/IP policy; connection-time DNS vetting; manual redirects; mixed-answer rejection | SSRF corpus | proxy and IPv6 corpus breadth |
| T-014 | Oversized, slow, redirecting, or decompression-heavy source exhausts resources | denial of service | byte/time/redirect/type limits; bounded extractors | malformed/limit tests | compressed HTTP handling |
| T-015 | Imported HTML executes script, macros, active URLs, or embedded objects | compromise | text-only sanitizer; never execute document content/macros | malicious corpus | sanitizer replacement for production |
| T-016 | Access-controlled, paywalled, CAPTCHA, or robots-disallowed content is bypassed | policy/legal harm | no credentials/circumvention; explicit refusal statuses; robots check; single page only | adapter tests | standards-complete robots parser |
| T-017 | Connector/extension credentials or broad authority bypass preview | disclosure/integrity loss | separate adapter contracts; least privilege; revoke; preview/commit invariant | contract/security tests | authenticated connectors not implemented |
| T-018 | Unsigned installer/update is substituted or triggers unsafe bypass behavior | code execution/trust failure | explicit unsigned warning; production certificate, signed manifest/package, hash, timestamp, rollback | release qualification | signing certificate unavailable |

## Data-loss hazards

Severity: `C` catastrophic, `H` high, `M` moderate. Phase 0 cannot close a hazard with documentation alone.

| ID | Hazard | Sev. | Prevention | Recovery/detection | Gate |
|---|---|---:|---|---|---|
| H-001 | Opening/importing rewrites valid Markdown | C | read-only open; lossless parser; no normalization | before/after hashes; restore original | zero mutation fixtures |
| H-002 | Crash/power loss during save leaves truncated file | C | temp write, flush, atomic replace where supported | journal/checkpoint; validate on recovery | fault injection per OS/filesystem |
| H-003 | External editor and Nimvara overwrite each other | H | watcher plus version/precondition checks | compare, save copy, checkpoint | concurrency scenarios |
| H-004 | Rename/move breaks links or overwrites target | H | collision checks; transaction plan; preview | journal and rollback | fixture link graph |
| H-005 | AI modifies wrong/stale/more files | C | typed bounded proposals; diff; version checks; approval | checkpoint and byte-exact undo | J-04 plus injection corpus |
| H-006 | Snapshot is marked complete before durable verification | C | temp archive; manifest/hash read-back; atomic finalize | invalid/incomplete state | interruption tests |
| H-007 | Backup stored inside workspace recurses or fills disk | H | canonical destination separation | preflight and clear failure | path tests |
| H-008 | Cloud placeholder or provider sync creates incomplete snapshot | C | hydrate/read each source; record failures; never finalize partial set | manifest reconciliation | provider-neutral fixtures |
| H-009 | Restore overwrites newer workspace | C | default new-folder restore; distinct replace confirmation | pre-restore checkpoint | J-05 |
| H-010 | Corrupt/tampered snapshot restores silently | C | authenticated encryption when used; hashes always | verify before and after restore | corrupt archive corpus |
| H-011 | Encryption key lost | H | explicit warning; export/verification flow; no recovery promise | unencrypted option; key test | user comprehension |
| H-012 | Disk full/permissions/antivirus blocks operation | H | preflight; bounded temp space; explicit error handling | preserve old file; retry/save elsewhere | XP matrix |
| H-013 | Index/cache corruption is mistaken for content loss | M | cache separated and disposable | rebuild command/status | cache deletion test |
| H-014 | Retention deletes last known-good snapshot | C | verified-snapshot protection; policy preview; minimum safe set | deletion log/manual pin | retention simulation |
| H-015 | Partial import writes note without required original/provenance | H | preview token; source rehash; staged attachment; provenance-required commit | rollback fault injection | multi-file transaction in Rust |
| H-016 | Source changes during preview/commit | H | hash before/after copy; reject and retry | `SOURCE_CHANGED` result | OS-level file identity |
| H-017 | Duplicate import silently forks provenance | M | canonical URL/content-hash detection; explicit override | duplicate fixtures | index rebuild tool |
| H-018 | Upgrade/uninstall removes user data | C | code/settings separation; staged upgrade rollback; explicit retention rules | install/upgrade/uninstall drill | production updater |

## Safety invariants

- No read/open operation mutates authoritative content.
- No model output is authority to access files or network.
- No write is committed without path, version, and scope validation.
- Every AI write and destructive restore has a recoverable pre-change checkpoint.
- No backup is “successful” until its manifest and content have been read back and verified.
- No restore is “successful” until restored output matches the selected snapshot.
- No ingestion preview writes authoritative content.
- No lossy/unavailable extraction discards the original source bytes.
- No installer or uninstaller treats workspaces, backups, settings, or models as application binaries.

## Current risk decision

Architecture-level hazards are identified but not closed. Phase 1 implementation must begin with executable lossless-I/O, atomic-save, concurrency, snapshot, and restore spikes before editor breadth or production AI.
