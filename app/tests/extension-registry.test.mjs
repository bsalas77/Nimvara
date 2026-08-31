import assert from "node:assert/strict";
import { test } from "node:test";
import { listExtensions, registerExtension, setExtensionEnabled, trustExtensionKey } from "../server/extension-registry.mjs";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyExtensionSignature } from "../server/extension-manifest.mjs";

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
