# Owner-controlled release gates

Engineering cannot truthfully complete these gates without the owner's identity, accounts, decisions, or independent participants.

1. Confirm the product name after trademark search and legal review.
2. License selected: Apache-2.0, approved by the owner on 2026-09-06. Preserve
   this license for the public FOSS signing route unless the owner explicitly
   changes the distribution model.
3. Decide whether the publisher is an individual or legal organization.
4. Create and verify the Microsoft Partner Center developer account.
5. Reserve the Store product identity and provide its package identity and publisher values.
6. Final distribution-signing option: after Nimvara is public, fully FOSS under
   an OSI-approved license, and meets its eligibility rules, apply to SignPath
   Foundation for free managed code signing. Azure Artifact Signing remains the
   paid direct-download alternative; Microsoft Store signing remains the
   no-certificate-cost Store alternative.
7. Provide verified public HTTPS privacy, support, security, and product URLs.
8. Configure the GitHub repository, protected branches, release environment, and
   SignPath signing secret/variables. Secret scanning, push protection, and private
   vulnerability reporting were enabled on the public repository on 2026-09-06.
9. Commission an independent security assessment.
10. Recruit consented migration and accessibility-test participants.
11. Enroll in the Apple Developer Program and provide macOS/iPad signing access.

None of these may be marked complete from local code or simulated evidence.

## Current handoff state — 2026-08-31

The local readiness report is **29/39**. The remaining owner-controlled gates are:

- `FORMAL_NAME_CLEARANCE`
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

### Name cross-check (non-legal screening)

An internet screening on 2026-08-30 found no exact Nimvara software result in the
initial search set. It did surface the similar-looking **NIMAVERA** EU filing (EUIPO
application 019412614, software/AI classes) and unrelated near matches such as
Nimvora. This is not trademark clearance: obtain a counsel-led search across the
USPTO, EUIPO/TMview, WIPO, domains, and app stores before reserving a stable identity.

## One-command local qualification

On Windows from the repository root, run:

```powershell
.\tools\run-local-gates.ps1
```

This runs the JavaScript suite, Rust format/tests/clippy, exact release-artifact
verification, and refreshes the readiness evidence. The script returns success
when all locally executable gates pass; the readiness report can still list
owner-controlled or external gates as blocked. Use `-SkipRust` or
`-SkipArtifacts` only for a deliberately narrower diagnostic run.
