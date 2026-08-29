# Reviewed AI edit proposals

Status: implemented and automatically validated.

AI cannot directly write workspace files. For one explicitly open note, Nimvara can request a complete replacement-Markdown proposal and display:

- the current note;
- the exact proposed note;
- an explicit statement that no file has changed;
- Approve and Discard actions.

Approval routes through Nimvara's ordinary `save_note` safety boundary with the hash captured when the proposal was generated. Consequently:

1. an external or user edit made after proposal generation causes `EXTERNAL_CHANGE` and blocks approval;
2. the current bytes are checkpointed before replacement;
3. the new bytes are written atomically and verified;
4. existing History UI can restore the checkpoint, itself checkpointing the current version.

The model receives only the selected note and explicit edit instruction for this operation. It has no raw filesystem tools, delete/move action, multi-file scope, connector authority, or implicit approval. Notes and instructions are labeled untrusted. Inputs and proposals are limited to 2 MiB.

Automated coverage proves proposal generation is read-only, approval produces a checkpoint, the exact proposal is written, and reuse of the stale proposal hash is refused.
