import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..", "..");

test("Windows packaging uses Tauri's per-user NSIS installer", async () => {
  const config = await readFile(path.join(root, "app", "src-tauri", "tauri.conf.json"), "utf8");
  const script = await readFile(path.join(root, "packaging/windows/build-nsis.ps1"), "utf8");
  assert.match(config, /"installMode":\s*"currentUser"/);
  assert.match(config, /"targets":\s*\["nsis"\]/);
  assert.match(script, /Nimvara-Setup-\$\(\$version\)-dev\.exe/);
  assert.doesNotMatch(script, /build-installer\.ps1/);
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
  assert.match(script, /Nimvara-Setup-\$\(\$version\)-dev\.exe/);
});
