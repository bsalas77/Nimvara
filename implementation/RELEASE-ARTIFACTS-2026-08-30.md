# Release artifact record — 2026-08-30

Fresh local release audit recorded these artifacts:

| Artifact | Bytes | SHA-256 | Local status |
|---|---:|---|---|
| `dist/Nimvara-Setup-0.7.0-dev.exe` | 4,940,288 | `4ed504af51d1e08e626c399fe9b9ae4e79de55677522212aa677297451c1ab13` | Present, unsigned development build |
| `dist/Nimvara-0.7.0-dev.msix` | 4,834,112 | `eec7a6d201d977e68876ff14ebda1f7f42c07c06e297fda1d0c465a8191ad0d7` | Present, unsigned development package |
| `dist/Nimvara_0.7.0_amd64.deb` | 5,688,952 | `1c23e563bdf20116613816d77059301ca1fbf5f8993fa1a5986fe6f91dab0ee1` | Present; native Linux GUI install remains unqualified |
| `dist/nimvara.cdx.json` | regenerated 2026-08-31 | `9cff50a3a5b9948f4a48a99e6530d76522a2dba3bbeededc2373e2023ca85d9a` | Present, 480-component SBOM; npm audit found 0 high-severity vulnerabilities |

The current release checker reports **26/36** checks passing. Authenticode status for the Windows installer is `NotSigned`, as expected for this development artifact. The SBOM is regenerated from locked Cargo/npm manifests; signed provenance and independent review remain open.
