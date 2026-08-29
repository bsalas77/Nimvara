# AI provider and credential controls

Status: development foundation validated; paid-provider production qualification pending.

## Enforced controls

- Local processing connects only to explicit loopback endpoints.
- Paid processing requires HTTPS and an exact reviewed host allowlist.
- URL credentials, query strings, fragments, private resolution, and redirects are blocked.
- Questions and instructions are bounded to 8 KiB; edit inputs and outputs are bounded to
  2 MiB.
- Workspace excerpts are labeled untrusted and the system prompt forbids treating note
  content as instructions or claiming actions.
- Answers expose source-note paths. Edit output is only a proposal until the user reviews
  and approves it through the conflict-safe, checkpointed save path.
- A session budget permits at most 20 AI calls in any rolling 10-minute window.
- API keys exist only in the input control and command request for the current session.
  They are not written to Nimvara settings, logs, notes, backups, or snapshots.

## Credential-store decision

Persisting credentials is not enabled. Session-only entry is the safest cross-platform
baseline and avoids creating a plaintext fallback. Optional persistence may be added only
through Windows Credential Manager, macOS Keychain, and Linux Secret Service, with explicit
opt-in, deletion controls, locked-store behavior, and platform tests. Nimvara must never
fall back to a file when the OS vault is unavailable.

## Cost and compatibility evidence still required

The current generic OpenAI-compatible adapter cannot truthfully predict provider charges:
prices and token accounting differ by provider and model. Before production enablement,
each provider profile needs immutable endpoint rules, response/schema tests, timeout and
429 retry behavior, token usage display, a user-set monetary/request ceiling, and current
pricing links. These controls must be verified with provider sandbox accounts; no such paid
calls were made in this engineering pass.

Adversarial qualification must include prompt injection in note text, hostile Markdown,
oversized responses, malformed JSON, redirects, DNS changes, timeouts, 401/403/429/5xx,
connection loss, and proof that failures leave workspace bytes unchanged.

