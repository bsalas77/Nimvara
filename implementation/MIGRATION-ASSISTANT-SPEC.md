# Migration assistant specification

## Safety contract

- Source vault is opened read-only during assessment.
- The assistant creates a compatibility report and a proposed migration manifest before copying anything.
- Copy is additive into a new destination; source files are never renamed, deleted, or rewritten.
- Every copied file is verified by byte hash. Unsupported or lossy formats retain the original attachment.
- Cutover is reversible: the user can stop using Nimvara and continue with the original vault at any time.

## Workflow

1. Select source vault and destination workspace.
2. Run aggregate inventory: notes, attachments, canvases, file types, frontmatter, links, embeds, tags, and path hazards.
3. Present broken/ambiguous links and unsupported files without exposing note contents.
4. Export the report and manifest for review.
5. Copy to a new workspace with a progress meter and cancellation.
6. Verify copied tree hashes and generate a migration log.
7. Open the copied workspace; preserve the source as the rollback reference.

## Remaining implementation gates

- Native recursive copy with cancellation and rollback journal.
- Link rewrite preview for only explicitly approved transformations.
- Attachment reference validation after copy.
- Human migration usability sessions on a disposable vault copy.
