import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { createSnapshot } from "../server/lantern-core.mjs";
import { encryptSnapshot, restoreEncryptedSnapshot, rotateEncryptedSnapshot, safePayloadPath } from "../server/encrypted-snapshot.mjs";

test("encrypted restore path policy rejects traversal and absolute aliases", () => {
  for (const value of ["../escape.md", "C:\\escape.md", "/escape.md", "folder/../escape.md", "folder//file.md"]) {
    assert.throws(() => safePayloadPath(value), /unsafe path/);
  }
  assert.equal(safePayloadPath("Résumé/日本語.md"), "Résumé/日本語.md");
});

test("encrypted snapshot authenticates, restores losslessly, and preserves source", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-encrypted-root-"));
  const backups = await mkdtemp(path.join(os.tmpdir(), "nimvara-encrypted-backups-"));
  const output = path.join(backups, "snapshot.nvenc");
  const restored = path.join(backups, "restored");
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(backups, { recursive: true, force: true })]));
  await writeFile(path.join(root, "Résumé 日本語.md"), "# Safe 🏮\n");
  const before = await readFile(path.join(root, "Résumé 日本語.md"));
  const snapshot = await createSnapshot(root, backups);
  const encrypted = await encryptSnapshot(snapshot.path, output, "correct horse battery staple");
  assert.equal(encrypted.files, 1);
  await assert.rejects(restoreEncryptedSnapshot(output, restored, "wrong password"), (error) => error.code === "ENCRYPTED_AUTH");
  await restoreEncryptedSnapshot(output, restored, "correct horse battery staple");
  assert.deepEqual(await readFile(path.join(restored, "Résumé 日本語.md")), before);
  assert.deepEqual(await readFile(path.join(root, "Résumé 日本語.md")), before);
  const rotated = path.join(backups, "rotated.nvenc");
  await rotateEncryptedSnapshot(output, rotated, "correct horse battery staple", "new password with rotation");
  await restoreEncryptedSnapshot(rotated, path.join(backups, "rotated-restore"), "new password with rotation");
  await assert.rejects(restoreEncryptedSnapshot(rotated, path.join(backups, "bad-rotation"), "correct horse battery staple"), (error) => error.code === "ENCRYPTED_AUTH");
  const tampered = JSON.parse(await readFile(output, "utf8")); tampered.ciphertext = `${tampered.ciphertext.slice(0, -2)}AA`;
  await writeFile(output, `${JSON.stringify(tampered)}\n`);
  await assert.rejects(restoreEncryptedSnapshot(output, path.join(backups, "tampered"), "correct horse battery staple"), (error) => error.code === "ENCRYPTED_AUTH");
});
