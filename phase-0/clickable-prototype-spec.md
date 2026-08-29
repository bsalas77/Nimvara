# Clickable-prototype specification

Status: ready for design implementation; no usability sessions completed

## Objective

Build a high-fidelity but non-production prototype that tests comprehension and decision points across first run, retrieval, local-AI setup, cited answers, reviewed AI changes, and backup/restore. The prototype may simulate filesystem, model, and backup operations but must label simulations in the research build and must never imply measured performance.

## Format

- Desktop-first at 1440×900; verify usable reflow at 1280×720.
- Specify keyboard focus order and visible focus states.
- Use realistic sanitized fixtures with three linked notes, one attachment, one external-edit conflict, and two backup versions.

## Global shell

Persistent regions: workspace rail; file/search panel; editor/task area; contextual inspector for sources, diffs, or backup details; and a status strip showing path, save/index state, and AI mode (`Off`, `Local`, `External local`, `Remote`).

## Screen inventory

| ID | Screen/state | Required content | Exit |
|---|---|---|---|
| P-01 | Welcome | Create; Open folder; Try sample; local-file/no-account promise | P-02 |
| P-02 | Workspace permission | exact path, access scope, cancel, open; no import language | P-03 |
| P-03 | Main editor | files, search, note, inspector, status, Backup and Private AI entries | P-04/P-05/P-11 |
| P-04 | Search | query, title/snippet/path results, index-in-progress state | P-03 |
| P-05 | Enable local AI | detected facts vs estimates, bands, Not now, existing local server | P-06/P-03 |
| P-06 | Model consent/download | source/license/hash, size/memory, confirm/cancel/resume | P-07 |
| P-07 | Cited answer | local badge, answer, source chips, unsupported/limited state | P-08/P-03 |
| P-08 | Proposed change | typed actions, affected files, diffs, stale/out-of-scope state | P-09/P-03 |
| P-09 | Approval | per-file approve/reject, checkpoint notice, apply, cancel | P-10/P-03 |
| P-10 | Applied/undo | applied list, checkpoint, Undo, conflict state | P-03 |
| P-11 | Backup setup | source, destination, separation warning, retention, key warning | P-12 |
| P-12 | Snapshot result | progress/cancel, verified manifest, failure/incomplete state | P-13/P-03 |
| P-13 | Snapshot browser | versions, verification, files/manifest, Restore | P-14 |
| P-14 | Restore | default new folder, verification, high-friction replace path | P-15 |
| P-15 | Restore result | restored path, hash verification; corruption/failure state | P-03 |

## Required paths

### Path A — first value without AI

P-01 → P-02 → P-03 → create/save note → P-04 → result. Test AC-001–AC-010.

### Path B — private cited AI

P-03 → P-05 → P-06 → P-07 → open source. Alternate branches: decline; inadequate hardware; bad hash; no supporting note. Test AC-011–AC-017.

### Path C — reviewed change

P-07 → P-08 → approve one file/reject one → P-09 → P-10 → undo. Alternate branches: stale file; traversal target; unsupported deletion; cancel. Test AC-018–AC-024.

### Path D — backup and safe restore

P-03 → P-11 → P-12 → P-13 → P-14 → P-15. Alternate branches: destination inside workspace; low space; interruption; corrupt archive; replace confirmation. Test AC-025–AC-032.

## Content rules

- State whether AI processing leaves the device; “private” alone is insufficient.
- Distinguish backup snapshots from synchronization.
- Never report backup or restore success before integrity verification.
- Never imply that citations prove correctness; show supplied passages and limitations.
- Diffs show full path, action type, additions/deletions, and proposal reason.
- Destructive or broad AI actions are unavailable, not merely discouraged.

## Fixture

```text
Nimvara Research/
  Inbox.md
  Project-Aurora.md
  Meeting-Notes.md
  Attachments/
    architecture-sketch.png
```

The cited-answer task asks, “What risks were identified for Project Aurora?” Supplied passages support two risks; a third claim is deliberately unsupported.

The change task proposes:

1. create `Aurora-Risk-Brief.md`;
2. add a link to `Project-Aurora.md`;
3. attempt `..\private.md`, which must be blocked before approval.

## Session instrumentation

Record manually: session ID, screen/path, task timing, clicks/backtracks, errors, assistance, completion, confidence, and the participant’s explanation of storage location, AI location, approval effect, and backup verification. No prototype telemetry is required.

## Completion gate

- P-01–P-15 and all four paths are clickable.
- Every alternate safety branch can be demonstrated.
- Each screen maps to an acceptance criterion.
- A researcher can run the task script without explaining the UI.
- Internal review finds no contradiction with requirements or safety invariants.

