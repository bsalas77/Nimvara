# Indexing progress, cancellation, and recovery

Status: implemented and automatically validated.

When a workspace opens, indexing runs on a background worker rather than the UI thread. Nimvara exposes:

- state: idle, indexing, cancelling, ready, cancelled, failed, or cleared;
- completed and total note counts;
- a live status message;
- a native cancellation command and visible cancel button;
- generation isolation so an older workspace job cannot publish into a newer workspace;
- workspace signatures before and after indexing, preventing publication of an index built across concurrent changes.

Cancellation is checked between notes. A cancelled build does not publish a partial in-memory index and does not replace the last complete persistent cache. A malformed cache is rebuilt. The UI remains available while the worker runs and receives progress through a lightweight status command.

Automated tests confirm cancellation preserves the prior cache, corruption recovery leaves Markdown unchanged, and progress controls have accessible labels. The 10,000-note release benchmark measures the index and query costs separately.
