import { NimvaraError } from "./lantern-core.mjs";
import { createHash, createPublicKey } from "node:crypto";
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
  if (enabled && record.signature && !record.signatureVerified) throw new NimvaraError("EXTENSION_SIGNATURE", "A signed extension must verify against a trusted key before it can be enabled.");
  record.enabled = Boolean(enabled);
  return { ...record };
}

export function trustExtensionKey(publicKey) {
  const key = String(publicKey || "").trim();
  if (key.length > 16_384) throw new NimvaraError("EXTENSION_KEY", "The public key is too large.");
  if (!key.includes("BEGIN PUBLIC KEY") || key.includes("PRIVATE KEY")) throw new NimvaraError("EXTENSION_KEY", "An Ed25519 PEM public key is required.");
  try {
    const parsed = createPublicKey(key);
    if (parsed.asymmetricKeyType !== "ed25519") throw new Error("wrong key type");
  } catch {
    throw new NimvaraError("EXTENSION_KEY", "An Ed25519 PEM public key is required.");
  }
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
