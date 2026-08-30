import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NimvaraError, sha256, verifySnapshot } from "./lantern-core.mjs";

const FORMAT = "nimvara-encrypted-snapshot-v1";
const MAX_PASSWORD = 4096;
const MAX_PAYLOAD_BYTES = 512 * 1024 * 1024;

function passwordBytes(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > MAX_PASSWORD) throw new NimvaraError("INVALID_PASSWORD", "Use a password between 12 and 4096 characters.");
  return Buffer.from(password, "utf8");
}

export async function encryptSnapshot(snapshotPath, outputPath, password) {
  const snapshot = await verifySnapshot(snapshotPath);
  const files = [];
  for (const entry of snapshot.files) {
    const bytes = await readFile(path.join(snapshot.path, "files", ...entry.path.split("/")));
    files.push({ ...entry, data: bytes.toString("base64") });
  }
  const payload = Buffer.from(JSON.stringify({ schema: 1, manifest: { ...snapshot, path: undefined }, files }), "utf8");
  if (payload.length > MAX_PAYLOAD_BYTES) throw new NimvaraError("ENCRYPTED_PAYLOAD_TOO_LARGE", "Encrypted snapshot payload exceeds the 512 MiB safety limit.");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const aad = Buffer.from(`${FORMAT}\0${snapshot.id}`, "utf8");
  const cipher = createCipheriv("aes-256-gcm", scryptSync(passwordBytes(password), salt, 32), iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const envelope = { format: FORMAT, snapshotId: snapshot.id, kdf: "scrypt", salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
  const target = path.resolve(outputPath);
  const temporary = `${target}.partial-${randomBytes(6).toString("hex")}`;
  await mkdir(path.dirname(target), { recursive: true });
  try { await writeFile(temporary, `${JSON.stringify(envelope)}\n`, { flag: "wx" }); await rename(temporary, target); } catch (error) { await rm(temporary, { force: true }); throw new NimvaraError("ENCRYPTED_WRITE", error.message); }
  return { path: target, snapshotId: snapshot.id, files: snapshot.files.length, bytes: (await readFile(target)).length, format: FORMAT };
}

export async function restoreEncryptedSnapshot(encryptedPath, destination, password) {
  const envelope = JSON.parse(await readFile(path.resolve(encryptedPath), "utf8"));
  if (envelope.format !== FORMAT || typeof envelope.snapshotId !== "string") throw new NimvaraError("ENCRYPTED_FORMAT", "Unsupported encrypted snapshot format.");
  const aad = Buffer.from(`${FORMAT}\0${envelope.snapshotId}`, "utf8");
  let payload;
  try {
    const decipher = createDecipheriv("aes-256-gcm", scryptSync(passwordBytes(password), Buffer.from(envelope.salt, "base64"), 32), Buffer.from(envelope.iv, "base64"));
    decipher.setAAD(aad); decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    payload = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
  } catch { throw new NimvaraError("ENCRYPTED_AUTH", "Password or encrypted snapshot authentication failed."); }
  if (payload.length > MAX_PAYLOAD_BYTES) throw new NimvaraError("ENCRYPTED_PAYLOAD_TOO_LARGE", "Encrypted snapshot payload exceeds the 512 MiB safety limit.");
  const decoded = JSON.parse(payload.toString("utf8"));
  if (!decoded?.manifest || !Array.isArray(decoded.files) || decoded.manifest.id !== envelope.snapshotId) throw new NimvaraError("ENCRYPTED_MANIFEST", "Encrypted snapshot manifest is invalid.");
  for (const entry of decoded.files) {
    const bytes = Buffer.from(entry.data, "base64");
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new NimvaraError("ENCRYPTED_CORRUPT", `Encrypted snapshot verification failed for ${entry.path}.`);
  }
  const target = path.resolve(destination);
  if ((await readdir(target).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error))).length) throw new NimvaraError("RESTORE_NOT_EMPTY", "Restore destination must be a new or empty folder.");
  const staging = `${target}.partial-${randomBytes(6).toString("hex")}`;
  await mkdir(staging, { recursive: true });
  try {
    for (const entry of decoded.files) { const output = path.join(staging, ...entry.path.split("/")); await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, Buffer.from(entry.data, "base64"), { flag: "wx" }); }
    await rename(staging, target);
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw new NimvaraError("ENCRYPTED_RESTORE", error.message); }
  return { destination: target, files: decoded.files.length, verified: true };
}
