import { NimvaraError } from "./lantern-core.mjs";
import { validateExtensionManifest } from "./extension-manifest.mjs";

const registry = new Map();

export function registerExtension(input) {
  const manifest = validateExtensionManifest(input);
  const existing = registry.get(manifest.id);
  const record = { ...manifest, enabled: existing?.enabled ?? false, installedAt: existing?.installedAt ?? new Date().toISOString() };
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

