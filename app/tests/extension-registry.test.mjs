import assert from "node:assert/strict";
import { test } from "node:test";
import { listExtensions, registerExtension, setExtensionEnabled, trustExtensionKey } from "../server/extension-registry.mjs";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyExtensionSignature } from "../server/extension-manifest.mjs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sha256 } from "../server/lantern-core.mjs";
import { installVerifiedExtensionPackage, verifyExtensionPackage } from "../server/extension-package.mjs";

test("extension registry requires validation and keeps new extensions disabled", () => {
  const id = `test.reader.${Date.now()}`;
  const record = registerExtension({ id, name: "Test Reader", version: "1.0.0", permissions: ["notes:read"] });
  assert.equal(record.enabled, false);
  assert.equal(listExtensions().some((item) => item.id === id), true);
  assert.equal(setExtensionEnabled(id, true).enabled, true);
  assert.equal(setExtensionEnabled(id, false).enabled, false);
  assert.throws(() => registerExtension({ id: "bad", name: "Bad", version: "1.0.0", permissions: ["notes:write"] }), /Unsupported extension permissions/);
});

test("extension signatures verify only against supplied trusted keys and canonical bytes", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const manifest = { id: "signed.reader", name: "Signed Reader", version: "1.0.0", permissions: ["notes:read"] };
  const canonical = Buffer.from(JSON.stringify(manifest));
  const signature = sign(null, canonical, privateKey).toString("base64");
  const verified = verifyExtensionSignature({ ...manifest, signature }, [publicKey.export({ type: "spki", format: "pem" })]);
  assert.equal(verified.signatureVerified, true);
  assert.equal(verifyExtensionSignature({ ...manifest, signature: `${signature.slice(0, -2)}AA` }, [publicKey.export({ type: "spki", format: "pem" })]).signatureVerified, false);
  assert.equal(verifyExtensionSignature({ ...manifest, signature }, []).signatureVerified, false);
  const record = registerExtension({ ...manifest, signature });
  assert.equal(record.signatureVerified, false);
  trustExtensionKey(publicKey.export({ type: "spki", format: "pem" }));
  assert.equal(listExtensions().find((item) => item.id === manifest.id).signatureVerified, true);
});

test("untrusted signed extensions cannot be enabled", () => {
  const id = `signed.untrusted.${Date.now()}`;
  const record = registerExtension({ id, name: "Untrusted", version: "1.0.0", permissions: ["notes:read"], signature: Buffer.alloc(64, 7).toString("base64") });
  assert.equal(record.signatureVerified, false);
  assert.throws(() => setExtensionEnabled(id, true), /must verify against a trusted key/);
});

test("signed extension package verification is bounded and never extracts files", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const manifest = { id: "package.reader", name: "Package Reader", version: "1.0.0", permissions: ["notes:read"] };
  const signature = sign(null, Buffer.from(JSON.stringify(manifest)), privateKey).toString("base64");
  const content = Buffer.from("safe extension payload");
  const folder = await mkdtemp(path.join(os.tmpdir(), "nimvara-extension-package-"));
  try {
    const packagePath = path.join(folder, "package.json");
    await writeFile(packagePath, JSON.stringify({ manifest: { ...manifest, signature }, files: [{ path: "dist/main.js", bytes: content.length, sha256: sha256(content), data: content.toString("base64") }] }));
    const trusted = publicKey.export({ type: "spki", format: "pem" });
    assert.deepEqual(await verifyExtensionPackage(packagePath, [trusted]), { verified: true, id: manifest.id, version: manifest.version, files: 1, bytes: content.length, extracted: false });
    const installed = await installVerifiedExtensionPackage(packagePath, path.join(folder, "extensions"), [trusted]);
    assert.equal(installed.enabled, false);
    assert.equal(installed.executed, false);
    assert.equal((await readFile(path.join(installed.installPath, "dist", "main.js"), "utf8")), "safe extension payload");
    await assert.rejects(installVerifiedExtensionPackage(packagePath, path.join(folder, "extensions"), [trusted]), /already installed/);
    await assert.rejects(verifyExtensionPackage(packagePath, []), /missing or untrusted/);
    await writeFile(packagePath, JSON.stringify({ manifest: { ...manifest, signature }, files: [{ path: "../escape.js", bytes: content.length, sha256: sha256(content), data: content.toString("base64") }] }));
    await assert.rejects(verifyExtensionPackage(packagePath, [trusted]), /unsafe path/);
    await writeFile(packagePath, JSON.stringify({ manifest: { ...manifest, signature }, files: [{ path: "dist/main.js", bytes: content.length, sha256: "0".repeat(64), data: content.toString("base64") }] }));
    await assert.rejects(verifyExtensionPackage(packagePath, [trusted]), /verification failed/);
    await writeFile(packagePath, JSON.stringify({ manifest: { ...manifest, signature }, files: [{ path: "dist/main.js", bytes: content.length, sha256: sha256(content), data: content.toString("base64") }, { path: "DIST/Main.js", bytes: content.length, sha256: sha256(content), data: content.toString("base64") }] }));
    await assert.rejects(verifyExtensionPackage(packagePath, [trusted]), /duplicate paths/);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
