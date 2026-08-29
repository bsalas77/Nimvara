# Optional AI provider foundation

Status: runnable development integration; not a production release claim.

Nimvara now exposes one read-only, OpenAI-compatible chat boundary:

- **Local/free:** connects only to `localhost` or loopback, suitable for Ollama, LM Studio, llama.cpp servers, and compatible self-hosted runtimes.
- **Paid/external:** requires an HTTPS public endpoint and explicit confirmation before each request.

The provider receives the question and up to eight matching search excerpts. The system instruction labels workspace text as untrusted data and requires `[S1]`-style citations. Returned answers display the actual note paths selected by Nimvara. The command has no file-writing capability.

API keys are accepted only for the current request from the password field. Nimvara does not persist them. Production credential storage must use the operating-system credential vault, never workspace files, browser storage, logs, or command-line arguments.

## Enforced controls

- AI remains optional and off by default.
- Local mode cannot contact a non-loopback host.
- External mode requires HTTPS and rejects hosts resolving to private, loopback, link-local, documentation, broadcast, or unspecified addresses.
- Redirects are disabled.
- Questions and model identifiers have size limits.
- Requests have a 90-second timeout.
- External transmission requires a visible confirmation.
- The initial AI command is read-only and cannot mutate notes.

## Production gates

Before public release:

1. replace snippet matching with a measured local retrieval index and stable chunk citations;
2. add operating-system credential-vault storage;
3. add provider-specific compatibility tests and privacy disclosures;
4. add cancellation, streaming, rate-limit, retry, and cost controls;
5. pin and verify approved local model downloads, licenses, and hashes;
6. run prompt-injection and data-exfiltration adversarial testing;
7. expand the implemented single-note reviewed replacement flow with structured line diffs and bounded multi-note typed actions;
8. measure answer quality and citation correctness without claiming unperformed benchmarks.

No model is bundled, downloaded, or silently selected in this milestone.
