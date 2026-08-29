# Disposable persistent search index

Status: implemented and validated.

Nimvara stores its search cache under the operating system's application cache directory, keyed by a hash of the canonical workspace path. It does not write the index into the Markdown workspace. The index is:

- disposable and user-clearable;
- excluded from provider-neutral workspace snapshots;
- never authoritative over Markdown;
- reconciled against the current Markdown file inventory before reuse;
- incremental by file byte length and modification time;
- invalidated in memory after Nimvara writes or external filesystem events;
- rebuilt safely if the cache is missing or malformed.

Deleting a note removes it from the next reconciled index. Changed notes are reread through the same canonical containment and symlink protections used by normal note reads. Corrupt cache bytes trigger a rebuild and never alter workspace files.

The UI includes **Clear disposable search cache**. Clearing removes only the cache; Markdown remains untouched.

## Measured Windows-host result

Synthetic workspace: 10,000 Markdown notes.

| Operation | Measured result |
|---|---:|
| Cold safe index and cache creation | 7,965 ms |
| Incremental reopen, 10,000 unchanged notes | 515 ms |
| Warm full-text query | 816 microseconds |

These are measurements from this host, not generalized product guarantees. Detailed progress, cancellation, and responsiveness-under-load remain the next gate.
