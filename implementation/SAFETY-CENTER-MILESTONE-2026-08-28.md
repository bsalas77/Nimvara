# Workspace Safety Center milestone

**Status:** implemented and validated on Windows development host  
**Backlog item:** NIM-001  
**Date:** 2026-08-28

## Delivered

- Local `/api/safety` endpoint reports a fact-based safety state for the selected workspace/note.
- Desktop inspector now shows local save verification, external-change monitoring, sync configuration, backup verification, checkpoint count, and watcher mode.
- Safety state is refreshed when a workspace opens, a note loads, and a save completes.
- The UI copy explicitly separates synchronization from backup and states that external edits are never silently overwritten.
- `safetyState()` derives from local filesystem facts and does not pretend that remote sync or backup exists when it has not been configured or verified.

## Validation

- Existing safety, ingestion, compatibility, accessibility, mind-map, productivity, and UI tests: **43 passed, 0 failed**.
- MCP capability tests: **passed**.
- MCP stdio smoke test: initialize, list tools, and list notes returned valid JSON-RPC responses.
- No workspace or sample note content was modified by the smoke test.

## Deliberate limits

The current safety endpoint reports `not-configured`, `not-verified`, or `not-checked` where the local service cannot prove a stronger state. It does not claim two-device synchronization, remote acknowledgement, or verified backup merely because a destination field exists.

## Next gate

Pair this UI with NIM-002's two-device fault-injection harness: OneDrive placeholders, simultaneous edits, offline/reconnect, rename/delete races, clock skew, interrupted transfer, and deterministic conflict copies. Only then should the sync row move from `not-configured` to a more specific verified state.

