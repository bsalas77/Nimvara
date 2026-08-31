# Owner-controlled release gates

Engineering cannot truthfully complete these gates without the owner's identity, accounts, decisions, or independent participants.

1. Confirm the product name after trademark search and legal review.
2. Select and approve the source and binary license.
3. Decide whether the publisher is an individual or legal organization.
4. Create and verify the Microsoft Partner Center developer account.
5. Reserve the Store product identity and provide its package identity and publisher values.
6. Create Azure Artifact Signing credentials if direct signed downloads will be offered.
7. Provide verified public HTTPS privacy, support, security, and product URLs.
8. Configure the GitHub repository, protected branches, release environment, secret scanning, and signing secrets.
9. Commission an independent security assessment.
10. Recruit consented migration and accessibility-test participants.
11. Enroll in the Apple Developer Program and provide macOS/iPad signing access.

None of these may be marked complete from local code or simulated evidence.

## Current handoff state — 2026-08-31

The local readiness report is **29/39**. The remaining owner-controlled gates are:

- `LICENSE_SELECTED` and `FORMAL_NAME_CLEARANCE`
- `NON_DEV_VERSION` and Windows Store publisher identity
- `MACOS_ARTIFACT`
- `INDEPENDENT_SECURITY_REVIEW`
- `HUMAN_ACCESSIBILITY_REVIEW`
- `MIGRATION_USABILITY`
- `TWO_DEVICE_SYNC`
- `SIGNING` and `PUBLIC_URLS`

The local evidence is reproducible with `node tools/release-readiness.mjs` and
`node tools/verify-release-artifacts.mjs`. These commands report evidence; they do
not bypass any owner-controlled gate.
