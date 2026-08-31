# Release artifact record — 2026-08-30

Fresh local release audit recorded these artifacts:

| Artifact | Bytes | SHA-256 | Local status |
|---|---:|---|---|
| `dist/Nimvara-Setup-0.7.0-dev.exe` | 4,982,272 | `16000ceaeef92a770b9a684378d96528583a20499eacdece9238df6658350ac9` | Rebuilt 2026-08-30 from current UI source; unsigned development build |
| `dist/Nimvara-0.7.0-dev.msix` | 4,886,916 | `a56a34d32fec105ff0f173e353dfb52ded050d9f9aa805822bf18ad31d6f0714` | Rebuilt 2026-08-30 from current UI source; unsigned development package |
| `dist/Nimvara_0.7.0_amd64.deb` | 5,688,952 | `1c23e563bdf20116613816d77059301ca1fbf5f8993fa1a5986fe6f91dab0ee1` | Present; native Linux GUI install remains unqualified |
| `dist/nimvara.cdx.json` | 168,371 | `6cf2b2820cd70493c34ef9b521f70e295f7189bf66ac4388c7c344edbe701c4f` | Present, 480-component SBOM; npm audit found 0 high-severity vulnerabilities |

This artifact record preserves the 2026-08-31 build evidence. Its embedded release-count sentence below is historical and is superseded by the current report in `dist/release-readiness.json` (29/39) and `implementation/LOCAL-GATE-VALIDATION-2026-08-30.md`. Authenticode status for the Windows installer is `NotSigned`, as expected for this development artifact. The SBOM is regenerated from locked Cargo/npm manifests; signed provenance and independent review remain open.

The optimized native test profile was rerun on 2026-08-31: 26 tests passed and 2 benchmark tests were intentionally ignored. The resulting `app/src-tauri/target/release/nimvara.exe` was used to rebuild the Windows installer and MSIX above.

The committed verifiers `node tools/verify-release-artifacts.mjs` and
`node tools/verify-sbom.mjs` were rerun after the rebuild. Both returned
`verified: true`; the SBOM contains 480 unique package components with valid
CycloneDX 1.5 metadata and SHA-256 fields.
