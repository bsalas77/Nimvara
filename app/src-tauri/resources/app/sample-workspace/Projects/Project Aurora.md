# Project Aurora

## Decision

Markdown remains authoritative. Derived indexes are rebuildable.

## Risks

- Interrupted writes must leave either the old or new valid file.
- External edits must never be overwritten silently.
- Every meaningful change needs a recovery checkpoint.

See [[Welcome to Nimvara]].
