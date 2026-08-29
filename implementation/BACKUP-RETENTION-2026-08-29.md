# Backup retention slice

Snapshot retention now has a read-only prune plan and an explicit-confirmation prune API. Plans retain the newest verified snapshots and identify older verified snapshots for removal. Pruning refuses to run without `confirm: true`, never touches the workspace, and leaves invalid snapshots for investigation rather than deleting them.

Scheduling, encryption, and restore drills remain release gates.
