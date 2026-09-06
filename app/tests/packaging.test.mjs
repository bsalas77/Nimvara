import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..", "..");

test("Windows packaging is per-user and preserves user data on uninstall", async () => {
  const installer = await readFile(path.join(root, "packaging", "windows", "NimvaraSetup.cs"), "utf8");
  const uninstaller = await readFile(path.join(root, "packaging", "windows", "NimvaraUninstall.cs"), "utf8");
  assert.match(installer, /CurrentUser|currentUser/i);
  assert.match(installer, /NimvaraUninstall\.exe/);
  assert.match(uninstaller, /workspaces.*backups.*not be deleted/i);
  assert.doesNotMatch(uninstaller, /SpecialFolder\.MyDocuments|OneDrive|\.md|\.canvas/i);
});

test("Windows package metadata uses explicit development identity", async () => {
  const manifest = await readFile(path.join(root, "packaging", "windows", "AppxManifest.template.xml"), "utf8");
  const config = await readFile(path.join(root, "app", "src-tauri", "tauri.conf.json"), "utf8");
  assert.match(manifest, /Identity Name="\{\{IDENTITY\}\}" Publisher="\{\{PUBLISHER\}\}"/);
  assert.match(config, /"identifier":\s*"com\.nimvara\.desktop"/);
  assert.match(config, /"installMode":\s*"currentUser"/);
});

test("standard NSIS build entry point uses locked native dependencies and explicit unsigned packaging", async () => {
  const script = await readFile(path.join(root, "packaging/windows/build-nsis.ps1"), "utf8");
  assert.match(script, /build --release --locked --offline/);
  assert.match(script, /tauri bundle --bundles nsis --ci --no-sign/);
  assert.match(script, /Push-Location \$tauriRoot/);
  assert.match(script, /Nimvara-Setup-0\.7\.0-dev-nsis\.exe/);
});
