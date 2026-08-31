import { readFile } from "node:fs/promises";
import path from "node:path";
import { sha256, NimvaraError } from "./lantern-core.mjs";
import { verifyExtensionSignature } from "./extension-manifest.mjs";

const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 1_000;

function safePackagePath(value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)) throw new NimvaraError("EXTENSION_PACKAGE_PATH", "Package contains an unsafe path.");
  const normalized = value.replaceAll("\\", "/");
  if (normalized.split("/").some((part) => !part || part === "." || part === "..")) throw new NimvaraError("EXTENSION_PACKAGE_PATH", "Package contains an unsafe path.");
  return normalized;
}

export async function verifyExtensionPackage(packagePath, trustedPublicKeys = []) {
  const absolute = path.resolve(String(packagePath || ""));
  const bytes = await readFile(absolute);
  if (bytes.length > MAX_PACKAGE_BYTES) throw new NimvaraError("EXTENSION_PACKAGE_SIZE", "Extension package exceeds 25 MiB.");
  let decoded;
  try { decoded = JSON.parse(bytes.toString("utf8")); } catch { throw new NimvaraError("EXTENSION_PACKAGE_FORMAT", "Extension package is not valid JSON."); }
  if (!decoded || typeof decoded !== "object" || !Array.isArray(decoded.files) || decoded.files.length > MAX_FILES) throw new NimvaraError("EXTENSION_PACKAGE_FORMAT", "Extension package manifest is invalid or too large.");
  const signature = verifyExtensionSignature(decoded.manifest, trustedPublicKeys);
  if (!signature.signatureVerified) throw new NimvaraError("EXTENSION_PACKAGE_SIGNATURE", "Extension package signature is missing or untrusted.");
  const seen = new Set();
  let total = 0;
  for (const entry of decoded.files) {
    const filePath = safePackagePath(entry?.path);
    if (seen.has(filePath.toLocaleLowerCase())) throw new NimvaraError("EXTENSION_PACKAGE_PATH", "Extension package contains duplicate paths.");
    seen.add(filePath);
    const content = Buffer.from(String(entry?.data || ""), "base64");
    total += content.length;
    if (content.length > 5 * 1024 * 1024 || total > MAX_PACKAGE_BYTES || Number(entry?.bytes) !== content.length || sha256(content) !== String(entry?.sha256 || "").toLowerCase()) throw new NimvaraError("EXTENSION_PACKAGE_HASH", `Extension package verification failed for ${filePath}.`);
  }
  return { verified: true, id: signature.id, version: signature.version, files: decoded.files.length, bytes: total, extracted: false };
}
