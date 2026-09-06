# Managed Windows signing onboarding

The repository contains `.github/workflows/windows-signed-release.yml`. It builds
and verifies the canonical NSIS artifact on a GitHub-hosted Windows runner, uploads
that exact artifact, generates a GitHub build-provenance attestation, and submits
it for managed signing only after a protected
`signing` environment approval and an explicit manual dispatch choice.

No signing secret is committed.

The public `bsalas77/Nimvara` repository has a `signing` GitHub environment,
created on 2026-09-06, with `bsalas77` as its required reviewer. A workflow
cannot enter the managed-signing submission step until that reviewer approves
the environment deployment.

## SignPath Foundation route

For a qualifying fully-FOSS public project, configure these repository values after
SignPath accepts the project:

- repository secret: `SIGNPATH_API_TOKEN`;
- repository variables: `SIGNPATH_ORGANIZATION_ID` and `SIGNPATH_PROJECT_SLUG`;
- a protected GitHub environment named `signing` with required reviewer approval;
- SignPath project policy slug `release-signing` and an artifact configuration for
  the unarchived NSIS `.exe` artifact.

The SignPath GitHub integration verifies that the artifact came from a GitHub
workflow and, for OSS projects, that preceding jobs used GitHub-hosted runners.
Its workflow action is intentionally called only when `submit_for_signing` is true.

## Required owner/external gates

This configuration does not apply for signing automatically. The owner must still:

1. approve an OSI-compatible license and publish the qualifying source repository;
2. complete SignPath eligibility/onboarding or choose a paid signing service;
3. configure protected branches, code review, and the `signing` environment;
4. approve the signing request and run installed lifecycle tests on the signed file.

The same pipeline can support a paid managed certificate service by replacing only
the managed-signing submission step; the build, SBOM, hash, approval, and signed
artifact verification steps stay the same.
