import { NimvaraError } from "./lantern-core.mjs";

const ALLOWED_PERMISSIONS = new Set(["notes:read", "search:read", "attachments:read", "ingestion:preview"]);

export function validateExtensionManifest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new NimvaraError("INVALID_EXTENSION", "Extension manifest must be an object.");
  const id = String(input.id ?? "").trim();
  const name = String(input.name ?? "").trim();
  const version = String(input.version ?? "").trim();
  if (!/^[a-z][a-z0-9._-]{2,63}$/.test(id) || !name || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) throw new NimvaraError("INVALID_EXTENSION", "Manifest id, name, or semantic version is invalid.");
  const permissions = Array.isArray(input.permissions) ? [...new Set(input.permissions.map(String))] : [];
  const denied = permissions.filter((permission) => !ALLOWED_PERMISSIONS.has(permission));
  if (denied.length) throw new NimvaraError("EXTENSION_PERMISSION", `Unsupported extension permissions: ${denied.join(", ")}.`);
  return { id, name: name.slice(0, 120), version, permissions, signed: Boolean(input.signature), status: input.signature ? "signed-pending-verification" : "unsigned-development" };
}
