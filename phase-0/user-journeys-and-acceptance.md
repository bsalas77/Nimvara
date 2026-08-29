# User journeys and acceptance criteria

Status: prototype-ready; tests not run

## J-01 — first run without AI

**Actor:** new privacy-conscious user  
**Goal:** start safely without an account or configuration project  
**Flow:** launch → understand local-file promise → create/open workspace → see sample guidance → dismiss AI setup → reach editor

- AC-001: No account, telemetry consent, plugin selection, model download, or command line is required.
- AC-002: The first-run screen states where notes live and that ordinary Markdown remains usable without Nimvara.
- AC-003: Before opening, the user can identify the workspace path and that access is limited to approved paths.
- AC-004: Skipping AI still leads to a fully usable editor, search, and backup entry point.

## J-02 — capture and find a note

**Actor:** user with a new or existing Markdown folder  
**Goal:** write and retrieve information without unintended file changes  
**Flow:** create/open → write note → attach file → save → search vague phrase → open result → observe external-change warning

- AC-005: A note can be created and saved with a predictable `.md` filename.
- AC-006: Search returns matching title/body content before optional AI is enabled.
- AC-007: Opening an existing workspace changes no content bytes.
- AC-008: Frontmatter, wikilinks, standard links, Unicode filenames, attachments, code fences, and unknown Markdown are preserved.
- AC-009: If a file changes externally, Nimvara does not silently overwrite it and offers reload/compare/save-copy choices.
- AC-010: Deleting `.lantern` cache data does not delete authoritative content and the cache can be rebuilt.

## J-03 — enable local AI and verify an answer

**Actor:** user who opts into local AI  
**Goal:** install an appropriate model and verify a note-grounded response  
**Flow:** enable private AI → hardware explanation → model choice → consent/download → ask question → inspect citations → open source

- AC-011: Hardware results distinguish detected facts from estimates and show a no-model path.
- AC-012: Every AI screen clearly labels processing as local, external-local, or remote.
- AC-013: The recommendation shows download size, expected storage/memory, license, source, and capability band.
- AC-014: No download starts without confirmation; cancel/resume and deletion controls are visible.
- AC-015: A hash or source/license verification failure blocks model activation.
- AC-016: Each displayed citation resolves to a supplied file and section; fabricated identifiers are rejected.
- AC-017: When support is insufficient, the UI says so and does not manufacture certainty.

## J-04 — review and recover an AI-proposed change

**Actor:** user organizing or synthesizing notes  
**Goal:** approve only intended changes and undo them  
**Flow:** request work product → inspect typed proposal → review per-file diff → approve subset → checkpoint → apply → undo

- AC-018: AI output alone cannot invoke raw filesystem or network operations.
- AC-019: The proposal identifies action type, target file, reason, and current-version precondition.
- AC-020: Invalid/out-of-scope paths, stale versions, unsupported actions, and excessive file counts are blocked.
- AC-021: The user can accept or reject each proposed file change independently.
- AC-022: Rejection changes no authoritative file.
- AC-023: Approval creates a recoverable pre-change checkpoint before mutation.
- AC-024: Undo restores the exact pre-change bytes and reports any conflict instead of overwriting silently.

## J-05 — create and restore a provider-neutral backup

**Actor:** user protecting a workspace  
**Goal:** recover a prior version through any folder-based provider  
**Flow:** select destination → create snapshot → verify → browse versions → choose snapshot → restore to new folder → optionally replace

- AC-025: Destination selection works with a normal writable local path and does not require provider credentials.
- AC-026: A destination inside the workspace is rejected with an explanation.
- AC-027: Snapshot naming/version metadata is understandable and includes a manifest, hashes, timestamps, schema, and app version.
- AC-028: Interrupted or corrupt snapshots remain incomplete/invalid and are never shown as successful.
- AC-029: A user can browse snapshot contents before restore.
- AC-030: Restore defaults to a new empty folder.
- AC-031: Verification compares restored content with the manifest before success is reported.
- AC-032: Replacing existing content requires a second explicit confirmation that identifies the target and recovery checkpoint.

## Prototype research gate

For each session record completion, time, hesitation, errors, assistance, confidence, and whether the participant correctly understood storage and AI location. The roadmap percentage gates remain unmet until actual records exist.

## J-06 — capture and ingest an untrusted source

**Actor:** user collecting a public page or local source file  
**Goal:** review readable material, retain provenance/originals, and import without risking the workspace  
**Flow:** select URL/file → capability and safety checks → preview → duplicate warning → destination/name → commit or cancel → search

- ING-001: Preview creates no note, attachment, or authoritative workspace change.
- ING-002: Only user-initiated public HTTP/HTTPS pages are fetched; local/private/special-use targets and unsafe redirects are blocked.
- ING-003: HTML preview contains no executable scripts, macros, handlers, forms, frames, objects, or executable URLs.
- ING-004: Markdown, TXT, and HTML show readable previews before writing.
- ING-005: PDF/DOCX explicitly report text extraction unavailable in this build.
- ING-006: Lossy, partial, and unavailable extraction preserves and hashes the original file.
- ING-007: Source files have identical before/after hashes.
- ING-008: Destination folder and note name are editable before commit.
- ING-009: Committed notes contain complete provenance fields and preserved-original links when applicable.
- ING-010: Canonical URL or content-hash matches display the existing note and require explicit override.
- ING-011: Cancel writes nothing.
- ING-012: Source change after preview rejects commit and requests retry.
- ING-013: Injected commit failure leaves no new note or newly created orphan attachment.
- ING-014: Committed extracted text is returned by normal search.
- ING-015: Every extractor reports `complete`, `partial`, `lossy`, or `preserved-only`.
- ING-016: Future connector/extension adapters cannot bypass preview, bounds, provenance, or user approval.

## J-07 — install and maintain Nimvara on Windows

**Actor:** non-technical Windows user  
**Goal:** install and launch a conventional application without runtime setup or terminal commands  
**Flow:** run Setup.exe → per-user installation → Start Menu/app window → upgrade → uninstall

- WIN-001: Setup is a conventional executable, not a batch/script handoff.
- WIN-002: Default installation requires no administrator rights.
- WIN-003: Required runtime components are bundled or runtime-managed.
- WIN-004: Start Menu launch opens an application window without manual localhost navigation.
- WIN-005: Interactive setup offers an optional desktop shortcut.
- WIN-006: First run shows workspace chooser and application version.
- WIN-007: Installed-app registration includes version, publisher, location, and uninstall command.
- WIN-008: Reinstall/upgrade stages replacement and rolls back if replacement fails.
- WIN-009: Upgrade preserves `%LOCALAPPDATA%\Nimvara\UserData`.
- WIN-010: Uninstall removes installed binaries, shortcuts, and registration.
- WIN-011: Uninstall retains workspaces, backups, settings, and future model storage.
- WIN-012: Unsigned development builds state SmartScreen/signing limitations and are not represented as trusted public releases.
