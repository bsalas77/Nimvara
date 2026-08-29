# Two-device sync qualification milestone

**Status:** deterministic provider-neutral harness implemented  
**Backlog item:** NIM-002  
**Date:** 2026-08-28

## Delivered

`app/server/sync-core.mjs` defines the first sync contract without coupling Nimvara to OneDrive, WebDAV, a hosted service, or a proprietary database:

- reconcile local and remote states against a common base;
- accept one-sided changes without using wall-clock last-writer-wins;
- preserve simultaneous edits as explicit conflicts;
- treat delete-versus-edit as a conflict;
- defer decisions when a cloud placeholder has no bytes;
- detect content-preserving renames by hash;
- discard interrupted or failed transfers rather than publishing partial state;
- apply only unambiguous decisions to a derived state.

## Qualification scenarios now automated

- one-sided edits converge;
- simultaneous Markdown edits preserve both versions;
- delete-versus-edit refuses silent deletion;
- placeholders defer until content is available;
- rename detection is hash-based;
- interrupted and failed transfers publish nothing.

`tools/run-sync-qualification.mjs` runs these scenarios against disposable real folders and emits a machine-readable result. It does not open, modify, or delete the user's Obsidian vault.

## Safety contract

The simulator intentionally does not attempt a text merge. A future merge view may offer a three-way, line-level proposal, but the default behavior must remain: preserve both bytes, show the user what happened, and route any selected result through the expected-hash checkpointed Save path.

This is a qualification harness, not evidence that a real provider is production-ready. The remaining gate is a live two-device matrix using a copied workspace and OneDrive-managed files, including Files On-Demand, simultaneous edits, offline/reconnect, rename/delete races, clock skew, and real interruption/retry behavior.

## Host qualification record — 2026-08-28

- Disposable two-device folder run: **5 scenarios passed, 0 failed**.
- OneDrive root detected at `C:\Users\Kogu\OneDrive`, but the OneDrive client process was not running. The real cloud-provider matrix therefore remains unexecuted.
- Docker is installed but its service was stopped; no container was required for this host-level contract.
- VirtualBox is installed and its service is running. The `Ububtu1` guest was session-locked and was not forcibly manipulated. No VM run was required for the deterministic sync contract.
- The authorized Obsidian vault was not opened or modified during this qualification.

## Follow-up host check — 2026-08-28

- OneDrive client process detected at `C:\Program Files\Microsoft OneDrive\OneDrive.exe`.
- A disposable folder and sentinel file were created under `C:\Users\Kogu\OneDrive\Nimvara-Sync-Qualification-2026-08-28` and then removed after inspection. The local file was present with normal archive attributes.
- This host exposed no reliable second-device/cloud acknowledgement signal for that sentinel, so this is **not** a real two-device sync pass.
- Docker Desktop client is installed, but the Linux engine pipe returned `permission denied`; no container result is claimed.
- VirtualBox has active headless guests, but the requested Ubuntu guest remains session-locked; it was not forcibly interrupted.

The later check confirmed `Ububtu1` is running with NAT forwards for SSH (2222) and HTTP (8080), but no Guest Additions IP/user properties were available. Port 8080 serves an unrelated QuellOps application, not Nimvara. Guest credentials or an explicit shared folder are required before Linux-side execution can be claimed.
