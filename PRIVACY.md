# Privacy promise

Nimvara is designed to operate locally. Workspaces remain ordinary user-controlled files. The current build has no telemetry, advertising, account requirement, or background cloud upload.

URL capture makes a network request only after the user submits a public URL. It blocks local, private, link-local, credential-bearing, and unsupported destinations and treats returned content as untrusted.

Optional AI is off by default. Local AI connects only to a loopback service on the user's computer. If the user selects a paid provider, Nimvara displays a confirmation before sending the question and selected note excerpts to the configured reviewed provider. The provider's terms and privacy policy then apply. API keys are held only for the active request and are not stored by this build. AI has no file-writing command.

Local AI must remain usable without an account or subscription. Any future sync, crash reporting, credential persistence, or hosted service will be opt-in, documented separately, and must not silently change this local-first default.
