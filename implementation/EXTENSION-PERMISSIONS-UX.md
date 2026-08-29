# Extension and plugin permissions UX

Nimvara extensions must declare capabilities before installation. The user sees a plain-language summary and can deny any capability.

| Permission | Default | Scope |
|---|---|---|
| Read selected notes | Off | User-selected paths only |
| Search workspace | Off | Read-only indexed search |
| Create review proposal | Off | Draft output only; never writes |
| Write approved change | Off | Requires explicit approval and checkpoint |
| Network access | Off | Explicit host allowlist; localhost/private ranges blocked |
| Read attachments | Off | Selected files only; no execution |

Rules:

- No extension can bypass the native save/checkpoint path.
- Permission changes are versioned in application settings, never stored in the vault.
- MCP remains read-only by default.
- AI adapters can propose changes but cannot apply them without the review surface.
- Uninstalling an extension never deletes notes, attachments, backups, or models.

Open work: implement the install/enable/disable UI, signed extension metadata, compatibility checks, and adversarial permission tests.
