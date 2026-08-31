# Release artifact record — 2026-08-30

Fresh local release audit recorded these artifacts:

| Artifact | Bytes | SHA-256 | Local status |
|---|---:|---|---|
| `dist/Nimvara-Setup-0.7.0-dev.exe` | 4,770,816 | `13fc0e1b6ec9ee7ebd6d992352940349eea32a648cf9a968e6c37239aa78e191` | Rebuilt 2026-08-31 from current source; unsigned development build |
| `dist/Nimvara-0.7.0-dev.msix` | 4,882,925 | `c1ac8e71cd44e17ea4410fbda081baf2612852cc289d6364fb14b50a5b03e2f4` | Rebuilt 2026-08-31 from current source; unsigned development package |
| `dist/Nimvara_0.7.0_amd64.deb` | 5,688,952 | `1c23e563bdf20116613816d77059301ca1fbf5f8993fa1a5986fe6f91dab0ee1` | Present; native Linux GUI install remains unqualified |
| `dist/nimvara.cdx.json` | regenerated 2026-08-31 | `9cff50a3a5b9948f4a48a99e6530d76522a2dba3bbeededc2373e2023ca85d9a` | Present, 480-component SBOM; npm audit found 0 high-severity vulnerabilities |

This artifact record preserves the 2026-08-31 build evidence. Its embedded release-count sentence below is historical and is superseded by the current report in `dist/release-readiness.json` (29/39) and `implementation/LOCAL-GATE-VALIDATION-2026-08-30.md`. Authenticode status for the Windows installer is `NotSigned`, as expected for this development artifact. The SBOM is regenerated from locked Cargo/npm manifests; signed provenance and independent review remain open.

The optimized native test profile was rerun on 2026-08-31: 26 tests passed and 2 benchmark tests were intentionally ignored. The resulting `app/src-tauri/target/release/nimvara.exe` was used to rebuild the Windows installer and MSIX above.

The committed verifier `node tools/verify-release-artifacts.mjs` was rerun after the rebuild and returned `verified: true` for all four listed artifacts.
