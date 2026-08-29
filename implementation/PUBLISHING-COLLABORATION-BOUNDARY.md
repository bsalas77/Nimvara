# Collaboration and publishing boundary

Nimvara remains local-first and Markdown-authoritative. Collaboration and publishing are additive layers, not prerequisites for opening or editing a workspace.

## Publishing

- Export a selected note or folder as static HTML/Markdown without changing source files.
- Show a preview and exact file list before export.
- Exclude private metadata, credentials, recovery journals, and unselected attachments.
- Preserve source links as relative links where possible and report unresolved links.

## Collaboration

- Never silently merge conflicting Markdown edits.
- Use the existing common-base reconciliation model and preserve both versions when needed.
- Provider adapters must be replaceable; no provider becomes the canonical data store.
- Shared workspaces require explicit user opt-in, identity, authorization, and audit events.
- Real-time collaboration is deferred until offline conflict semantics and encryption are independently reviewed.

## Open implementation

Static export, share preview, provider adapters, identity, permissions, audit logs, encrypted transport, and multi-user testing remain required before public collaboration claims.
