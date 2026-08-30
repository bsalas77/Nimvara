# Release artifact record — 2026-08-30

Fresh local release audit recorded these artifacts:

| Artifact | Bytes | SHA-256 | Local status |
|---|---:|---|---|
| `dist/Nimvara-Setup-0.7.0-dev.exe` | 4,940,288 | `4ed504af51d1e08e626c399fe9b9ae4e79de55677522212aa677297451c1ab13` | Present, unsigned development build |
| `dist/Nimvara-0.7.0-dev.msix` | 4,834,112 | `eec7a6d201d977e68876ff14ebda1f7f42c07c06e297fda1d0c465a8191ad0d7` | Present, unsigned development package |
| `dist/Nimvara_0.7.0_amd64.deb` | 5,688,952 | `1c23e563bdf20116613816d77059301ca1fbf5f8993fa1a5986fe6f91dab0ee1` | Present; native Linux GUI install remains unqualified |
| `dist/nimvara.cdx.json` | 168,371 | `0a432e1a9bc884ab19c6cc89377194c1d28d96f429d609ab7bfe19aed2bf4185` | Present, 480-component SBOM |

The release checker reports **17/27** checks passing. Authenticode status for the Windows installer is `NotSigned`, as expected for this development artifact.
