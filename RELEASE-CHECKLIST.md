# Public release checklist

The current installer is a development artifact, not a public-ready release.

## Blocking

- [ ] Owner selects a source/binary license and completes naming/trademark review.
- [x] Replace transitional Node/Edge shell with a supported native desktop runtime and strict capability policy.
- [ ] Complete realpath/symlink/TOCTOU hardening and independent security review.
- [ ] Complete copied-vault zero-mutation, restore, OneDrive, upgrade, and uninstall retention rehearsals. Copied-vault, OneDrive-managed reads, deterministic conflict, upgrade, and uninstall retention pass; live two-device sync remains.
- [ ] Complete keyboard, screen-reader, contrast, and reduced-motion testing. Automated labels, landmarks, keyboard save, representative AA contrast, and reduced-motion support pass; human assistive-technology sessions remain.
- [ ] Purchase organization-validated code-signing credentials (or approved cloud signing), sign installer and binaries, timestamp, and verify on a clean Windows machine.
- [ ] Add signed update metadata with rollback protection.
- [ ] Publish privacy, security, support, contribution, and responsible-disclosure channels.

## Supply chain

- [x] Cross-platform core-test workflow defined.
- [x] Pull-request dependency review defined.
- [ ] Pin GitHub Actions to audited commit SHAs.
- [ ] Generate and publish SBOM, checksums, and artifact attestations.
- [ ] Configure protected branches, required review, GitHub Environments, least-privilege release permissions, and secret scanning.
- [ ] Build on a clean hosted runner and reproduce the expected artifact.

## Release evidence

- [ ] Windows 10/11 x64 clean install, launch, upgrade, uninstall, and data-retention matrix passes.
- [ ] macOS and Linux packages pass equivalent host tests before cross-platform claims.
- [ ] Crash/recovery and forced-power-loss tests pass. Forced process termination and restart recovery pass; true power-loss/VM interruption remains.
- [ ] Performance budgets are measured on small, medium, and large synthetic/copy-authorized workspaces.
- [ ] At least five consented migration usability sessions completed; no fabricated interview or benchmark claims.
