# Encrypted backup boundary — 2026-08-30

Nimvara now exposes `/api/snapshots/encrypt-now` for a user-initiated encrypted backup. The operation creates a verified provider-neutral snapshot and immediately encrypts it with the supplied password using the authenticated snapshot format. The password is accepted only in the request and is never written to workspace metadata or the backup schedule.

The existing encrypted snapshot tests cover authentication, tamper detection, Unicode paths, resource limits, restore correctness, and source immutability. Scheduled backups remain plaintext unless the user explicitly runs this encrypted route; unattended encrypted scheduling is intentionally withheld until a platform key-store provider and key-rotation policy are implemented for Windows, Linux, and macOS.

