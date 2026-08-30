# Reliability and data-safety milestone — 2026-08-29

## Completed in this pass

- Scheduled snapshot settings are persisted inside the workspace metadata and restored on the next open.
- The service scheduler prevents overlapping runs, records the last success or failure, and exposes that state through the local API.
- Enabled schedules reject destinations that are the workspace or any path inside it. Snapshot creation performs the same canonical-path check, including existing-ancestor and symlink cases.
- A user can explicitly run an enabled schedule immediately. The desktop command uses the same verified snapshot implementation as manual backups; it never writes into the workspace.
- The desktop UI exposes enable/disable, bounded interval (15 minutes to 7 days), separate destination, last-run status, and a Run backup now action.
- Snapshot writes remain staged in an incomplete directory and are published only after the manifest is complete; restore verifies hashes before publishing and refuses a non-empty target.
- Existing JavaScript safety/ingestion tests and Rust native tests pass without modifying source workspaces.

## Validation evidence

| Gate | Result |
|---|---|
| JavaScript syntax and safety suite | 65 passed, 0 failed |
| Rust formatting | pass |
| Rust locked tests | 20 passed, 0 failed, 1 ignored benchmark |
| Snapshot corruption, unsafe destination, interrupted write, restore correctness | pass |
| Unicode/long paths and conflict refusal | pass where supported by this Windows host |

## Deliberate remaining gates

These are not silently treated as complete: encrypted snapshots with a documented key-management model, cloud/provider adapters, true multi-device synchronization, scheduled execution while the app is fully closed, independent security review, clean-machine Windows install/upgrade/uninstall evidence, and macOS/Linux packaging validation remain release gates. The current implementation is provider-neutral and local; it does not claim encryption or sync.

## Operational rule

Before enabling automatic snapshots, choose a destination on a separate volume or durable backup location. A snapshot is a backup, not synchronization. Keep the workspace and backup destination under separate retention and access policies, and periodically perform a verified restore drill.
