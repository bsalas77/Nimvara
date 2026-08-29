# Security policy

Nimvara is pre-release software and must not yet be trusted as the only copy of important data.

Report suspected vulnerabilities privately through GitHub Security Advisories after the repository is published. Do not include private workspace content, credentials, or personal information. Until that channel exists, do not open public issues containing exploit details.

Supported security work currently covers the newest development build only. The application uses a strict CSP, a native Rust command boundary, a minimal frontend event capability allowlist, canonical workspace containment, symlink/reparse-point rejection, conflict-aware atomic writes, verified backup/restore, and guarded single-page capture. A public release remains blocked on code signing, dependency/artifact provenance, platform-host testing, and independent security review.

Nimvara never requires users to submit workspace content for support. Reproduction workspaces should contain synthetic data.
