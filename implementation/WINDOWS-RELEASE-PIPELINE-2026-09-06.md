# Windows release pipeline correction — 2026-09-06

## Decision

The only supported Windows release artifact is the Tauri-generated NSIS setup
executable:

`dist/Nimvara-Setup-<version>-dev.exe`

The earlier custom C# setup utility is retained only as historical engineering
material and is not a release path. It is no longer built under the canonical
installer filename.

## Corrected candidate

- Version: `0.7.2-dev`
- Artifact: `dist/Nimvara-Setup-0.7.2-dev.exe`
- Bytes: `5,263,360`
- SHA-256:
  `45f822019bd08746c4ad4eda5c47023633aa8fb4c87888a739a1a01b7fe22e5f`
- Installer model: Tauri 2 NSIS, per-user (`currentUser`), with WebView2
  bootstrap support.

## Local evidence

The host has Microsoft Edge WebView2 Runtime `152.0.4191.62`, so a missing
WebView2 runtime is not the observed cause of installation failure.

The corrected 0.7.2 NSIS setup was launched for the existing per-user target.
It remained running without an exit result and did not change the installed
`Nimvara.exe`. This repeats the endpoint-security interception pattern observed
for earlier candidate filenames. It is not evidence of a malformed NSIS package.

## Release consequence

An unsigned, low-reputation executable cannot be made reliably installable across
ordinary protected Windows systems through application code alone. The distribution
gate requires a trusted signing/reputation route:

1. Public fully-FOSS release with an OSI-approved license, then SignPath
   Foundation eligibility and protected CI signing; or
2. A paid Microsoft/Azure code-signing route; or
3. Microsoft Store distribution with its package-signing route.

Until one route is completed, the installer remains a development candidate and
the normal-installation gate remains open. This conclusion does not require users
to disable or broadly exclude endpoint protection.
