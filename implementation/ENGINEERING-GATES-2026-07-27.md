# Engineering gate record — 2026-07-27

## Completed on this Windows host

1. Persistent, incremental, disposable workspace search index.
2. Background indexing progress, cancellation, recovery, and stale-generation isolation.
3. Read-only AI Q&A and visible, review-before-write edit proposals using the existing
   checkpointed and expected-hash save boundary.
4. Cross-platform RAM/CPU detection foundation and manifest/hash/size/memory-gated local
   model verification plus atomic managed import.
5. AI endpoint, redirect, private-network, input/output, prompt-injection, and rolling
   session request-budget controls.
6. Session-only credential handling with no plaintext persistence. Optional OS-vault
   persistence remains disabled until native Windows/macOS/Linux integrations have tests.
7. Fresh Windows setup executable and MSIX built. Installed copied-vault qualification
   passed all seven assertions without mutating the source vault.

## Automated evidence

- Rust: 19 passed, 0 failed, 1 measured benchmark ignored.
- Strict Rust Clippy: passed with warnings denied.
- JavaScript safety/compatibility/accessibility/CSP: 26 passed, 0 failed.
- Installed Windows workflow: workspace open, accessible controls, recovery journal,
  crash recovery, search, backup/restore, and external-conflict refusal all passed.
- CycloneDX SBOM regenerated: 480 components.

## Artifact evidence

- `dist/Nimvara-Setup-0.7.0-dev.exe`
  - 4,678,656 bytes
  - SHA-256 `0f609ab25902e6457f8da201a0f0575a46e56885bb09909dea631a5f6d95f715`
- `dist/Nimvara-0.7.0-dev.msix`
  - 4,794,124 bytes
  - SHA-256 `c71fc66ce1a84a534b775953931b2e3319a621df1fa0baecef04b03d1584b2ae`
- `dist/Nimvara_0.7.0_amd64.deb`
  - 5,688,952 bytes
  - SHA-256 `1c23e563bdf20116613816d77059301ca1fbf5f8993fa1a5986fe6f91dab0ee1`
- `dist/nimvara.cdx.json`
  - SHA-256 `a8f689b3292f17944a2174d82c42281d475a4e917a60e2748104753c2ff426d3`

These development packages are unsigned.

## Gates that did not pass

- Current Linux source passed 19 native tests and produced a fresh `.deb`; package metadata
  and dynamic linkage were inspected successfully. The target-specific glib unsoundness is
  now repaired using the reviewed upstream backport. Installed Wayland/X11 GUI qualification
  and the broader GTK3 maintenance debt remain.
- AppImage remains unqualified.
- macOS and iPad builds require Apple hardware/runners, identities, signing, notarization,
  and device testing.
- Production model catalog/download is blocked on model and license selection plus hardware
  measurements. The safe verification/activation path is ready.
- Paid-provider qualification requires real provider test accounts and current pricing/token
  evidence. No paid calls or claimed provider benchmarks occurred.
- Signing, public URLs, license selection, independent security review, human accessibility
  sessions, migration usability sessions, and real two-device synchronization remain
  owner/external gates.

## Next implementation-ready milestone

Run installed-workflow qualification for the Debian package in graphical Ubuntu and Debian
VMs, repair and qualify AppImage/Flatpak packaging, and exercise offline install/uninstall.
In parallel, choose one redistributable local model and obtain an immutable approved manifest
so the guided downloader can be implemented without weakening the completed activation
boundary.
