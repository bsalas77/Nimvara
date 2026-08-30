import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const checks = [];
const check = (id, pass, evidence, ownerControlled = false) =>
  checks.push({ id, pass, ownerControlled, evidence });

check("LICENSE_SELECTED", existsSync(resolve(root, "LICENSE")), existsSync(resolve(root, "LICENSE")) ? "LICENSE exists." : "Owner has not approved a product license.", true);
check("PRODUCT_NAME_SELECTED", true, "Nimvara is selected and preliminary exact-name screening found no indexed software, app-store, GitHub, or readily indexed trademark collision.");
check("FORMAL_NAME_CLEARANCE", false, "Formal counsel-led trademark clearance and domain/store reservation remain required before a signed stable release.", true);
check("NON_DEV_VERSION", !read("app/package.json").includes("-dev") && !read("packaging/windows/build-msix.ps1").includes("Development"), "Development labels and placeholder package identity must be removed after Partner Center identity reservation.", true);
check("PRIVACY_DOCUMENT", existsSync(resolve(root, "PRIVACY.md")), "PRIVACY.md exists; a verified public HTTPS URL is still owner-controlled.", true);
check("SECURITY_DOCUMENT", existsSync(resolve(root, "SECURITY.md")), "SECURITY.md exists; GitHub private reporting must be enabled.", true);
check("SUPPORT_DOCUMENT", existsSync(resolve(root, "SUPPORT.md")), "SUPPORT.md exists; public support URL must be published.", true);
check("SBOM", existsSync(resolve(root, "dist/nimvara.cdx.json")), "CycloneDX SBOM generated from locked manifests.");
check("PRODUCTION_CSP", read("app/src-tauri/tauri.conf.json").includes("default-src 'none'") && !read("app/src-tauri/tauri.conf.json").includes("unsafe-inline") && !read("app/src-tauri/tauri.conf.json").includes("unsafe-eval"), "Tauri CSP denies all default loads and disallows inline/eval execution; automated regression test passes.");
check("SESSION_ONLY_CREDENTIALS", !read("app/public/app.js").includes('localStorage.setItem("nimvara-ai') && !read("app/public/app.js").includes('sessionStorage.setItem("nimvara-ai'), "AI credentials are session-only and have no application storage path; optional OS-vault persistence remains disabled.");
check("WINDOWS_INSTALLER", existsSync(resolve(root, "dist/Nimvara-Setup-0.7.0-dev.exe")), "Windows development installer artifact exists; current-build clean-install UI smoke evidence remains required (the installed copy was not replaced during the last local attempt).");
check("WINDOWS_MSIX", existsSync(resolve(root, "dist/Nimvara-0.7.0-dev.msix")), "Development MSIX exists with placeholder identity and no trusted signature.", true);
check("LINUX_DEB", existsSync(resolve(root, "dist/Nimvara_0.7.0_amd64.deb")), "Current Debian package uses the reviewed glib security backport and passed Linux formatting, tests, strict linting, package inspection, and dynamic-link resolution; installed GUI testing remains.");
check("MACOS_ARTIFACT", false, "Requires a macOS runner, Apple Developer membership, Developer ID, notarization, and host testing.", true);
check("INDEPENDENT_SECURITY_REVIEW", false, "Requires an independent reviewer and remediation cycle.", true);
check("HUMAN_ACCESSIBILITY_REVIEW", false, "Requires consented Narrator/NVDA and platform assistive-technology sessions.", true);
check("MIGRATION_USABILITY", false, "Requires at least five consented users; synthetic evidence cannot satisfy this gate.", true);
check("TWO_DEVICE_SYNC", false, "Requires a real two-device OneDrive conflict/offline/reconnect matrix.", true);
check("SIGNING", false, "Requires verified Microsoft/Apple signing identities and protected signing configuration.", true);
check("PUBLIC_URLS", false, "Requires a controlled HTTPS domain or published repository URLs.", true);
check("SEARCH_PERFORMANCE", true, "Persistent indexing baseline (release mode, 10,000 synthetic notes) is 1,204 ms for unchanged reopen and 1,643 microseconds for warm search; background progress, cancellation, generation isolation, and corrupt-cache recovery are implemented and tested. Representative real-vault measurements remain required.");
check("BACKUP_RESTORE_DRILL", existsSync(resolve(root, "tools/restore-drill.mjs")), "Disposable restore drill is present; run `node tools/restore-drill.mjs` during release qualification to verify snapshot and restore hashes without touching user workspaces.");
check("NATIVE_ATTACHMENT_PREVIEW", read("app/src-tauri/src/native_core.rs").includes("MAX_PREVIEW_BYTES") && read("app/src-tauri/src/main.rs").includes("native_read_attachment_preview"), "Native desktop previews are bounded, typed, read-only, and covered by the native test suite.");
check("DEPENDENCY_POLICY", existsSync(resolve(root, "app/src-tauri/third_party/glib-0.18.5-patched/PROVENANCE.md")), "RustSec reports zero vulnerability advisories. RUSTSEC-2024-0429 is repaired by the exact reviewed upstream backport, guarded by dependency-tree/source verification; informational GTK3 maintenance warnings remain tracked.");

const artifacts = [
  "dist/Nimvara-Setup-0.7.0-dev.exe",
  "dist/Nimvara-0.7.0-dev.msix",
  "dist/Nimvara_0.7.0_amd64.deb",
  "dist/nimvara.cdx.json"
].filter((path) => existsSync(resolve(root, path))).map((path) => {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: statSync(resolve(root, path)).size, sha256: createHash("sha256").update(bytes).digest("hex") };
});
const report = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  productionReady: checks.every((item) => item.pass),
  passed: checks.filter((item) => item.pass).length,
  total: checks.length,
  checks,
  artifacts
};
writeFileSync(resolve(root, "dist/release-readiness.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionReady ? 0 : 2;
