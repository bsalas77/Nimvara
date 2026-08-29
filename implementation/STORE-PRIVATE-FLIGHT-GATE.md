# Microsoft Store private-flight gate

Verdict on 2026-07-27: **not ready for a public production listing**. The current build is suitable for continued development and, after the items below, a limited private Store flight.

## Must pass before private flight

- select the product license and complete naming/publisher-identity review;
- produce a release-version MSIX with the final Partner Center identity and publisher values;
- remove development labels and reconcile package/app versioning;
- complete clean Windows 10 and Windows 11 install, launch, upgrade, uninstall, and workspace-retention tests;
- add crash diagnostics that are local by default and never capture note content;
- complete manual keyboard, Narrator/NVDA, high-contrast, zoom, and reduced-motion checks;
- publish accurate privacy, support, and vulnerability-reporting URLs;
- generate SBOM, checksums, and build provenance from a clean CI runner;
- resolve or formally accept all dependency security advisories;
- complete the AI production controls listed in `AI-PROVIDER-FOUNDATION.md` if AI is included in the flight.

## Must pass before public production

All private-flight gates, plus independent security review, real two-device sync/conflict testing, true interrupted-power recovery testing, measured performance budgets, migration usability sessions, signed update/rollback design, Store policy review, and final release acceptance.

Microsoft Store signing removes the need to buy a certificate for a Store-delivered MSIX, but Store signing does not establish application quality or safety.
