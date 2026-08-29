# Backup scheduling and retention roadmap

## Safe defaults

- Backups are provider-neutral versioned snapshots outside the workspace.
- Scheduling is opt-in and paused while a workspace is busy or a conflict is unresolved.
- Retention never deletes the newest verified snapshot or the last known-good snapshot.
- Pruning is preview-first, reports exact snapshot IDs and hashes, and requires explicit approval.
- Restore always targets a new or empty directory; overwrite restore is not a default.

## Implementation sequence

1. Add a local scheduler with daily/weekly cadence and visible next-run status.
2. Add retention preview (keep last N, keep daily/weekly pins) without deletion.
3. Add explicit prune approval and an audit log.
4. Add optional encryption using an OS-protected key, never a vault-stored secret.
5. Add failure notifications and a support-diagnostics entry.

Current implementation already provides verified snapshots, corruption detection, and safe restore. Scheduling, pruning, encryption, and failure notifications remain open work.
