import { NimvaraError } from "./lantern-core.mjs";
import { createHash } from "node:crypto";
import { validateExtensionManifest, verifyExtensionSignature } from "./extension-manifest.mjs";

const registry = new Map();
const trustedKeys = new Set();

export function registerExtension(input) {
  const manifest = validateExtensionManifest(input);
  const existing = registry.get(manifest.id);
  const verification = verifyExtensionSignature(input, [...trustedKeys]);
  const record = { ...manifest, signature: typeof input.signature === "string" ? input.signature : undefined, signatureVerified: verification.signatureVerified, verification: verification.verification, enabled: existing?.enabled ?? false, installedAt: existing?.installedAt ?? new Date().toISOString() };
  registry.set(manifest.id, record);
  return { ...record };
}

export function listExtensions() { return [...registry.values()].map((item) => ({ ...item })).sort((a, b) => a.id.localeCompare(b.id)); }

export function setExtensionEnabled(extensionId, enabled) {
  const id = String(extensionId || "").trim();
  const record = registry.get(id);
  if (!record) throw new NimvaraError("EXTENSION_NOT_FOUND", "Extension is not registered.");
  record.enabled = Boolean(enabled);
  return { ...record };
}

export function trustExtensionKey(publicKey) {
  const key = String(publicKey || "").trim();
  if (!key.includes("PUBLIC KEY")) throw new NimvaraError("EXTENSION_KEY", "A PEM public key is required.");
  trustedKeys.add(key);
  for (const [id, record] of registry) {
    const verification = verifyExtensionSignature(record, [...trustedKeys]);
    registry.set(id, { ...record, signatureVerified: verification.signatureVerified, verification: verification.verification });
  }
  return { trusted: true, fingerprint: createHash("sha256").update(key).digest("hex").slice(0, 16), keyCount: trustedKeys.size };
}

export function listTrustedExtensionKeys() {
  return [...trustedKeys].map((key) => ({ fingerprint: createHash("sha256").update(key).digest("hex").slice(0, 16) }));
}
