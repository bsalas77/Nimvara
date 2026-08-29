import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  NimvaraError,
  atomicWriteForTest,
  canonicalRoot,
  createSnapshot,
  exportStatic,
  listHistory,
  migrateWorkspace,
  readMarkdown,
  restoreHistory,
  restoreSnapshot,
  saveMarkdown,
  sha256,
  searchMarkdown,
  verifySnapshot
} from "../server/lantern-core.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "lantern-test-"));
  const workspace = path.join(root, "Workspace");
  const backups = path.join(root, "Backups");
  await mkdir(workspace);
  await mkdir(backups);
  return { root, workspace, backups };
}

test("opening and reading is byte-lossless", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const bytes = Buffer.from("---\r\nunknown: [one, two]\r\n---\r\n# Café 🏮\r\n\r\n[[Linked note|Alias]]\r\n", "utf8");
  await writeFile(path.join(f.workspace, "Résumé 日本語.md"), bytes);
  const note = await readMarkdown(f.workspace, "Résumé 日本語.md");
  assert.equal(note.content, bytes.toString("utf8"));
  assert.deepEqual(await readFile(path.join(f.workspace, "Résumé 日本語.md")), bytes);
});

test("Unicode and long nested Markdown paths save and search", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const relative = `${"Long folder name ".repeat(4).trim()}/研究 notes/Very long daily-driver note name.md`;
  const saved = await saveMarkdown(f.workspace, relative, "# Résumé\n\nNeedle phrase 🏮\n", null);
  assert.match(saved.hash, /^[a-f0-9]{64}$/);
  assert.equal((await searchMarkdown(f.workspace, "needle phrase"))[0].path, relative);
});

test("stale expected hash blocks conflicting writes and preserves external bytes", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "Conflict.md"), "original");
  const opened = await readMarkdown(f.workspace, "Conflict.md");
  await writeFile(path.join(f.workspace, "Conflict.md"), "external edit");
  await assert.rejects(
    saveMarkdown(f.workspace, "Conflict.md", "lantern edit", opened.hash),
    (error) => error instanceof NimvaraError && error.code === "EXTERNAL_CHANGE"
  );
  assert.equal(await readFile(path.join(f.workspace, "Conflict.md"), "utf8"), "external edit");
});

test("interruption before atomic rename preserves old file and removes temporary file", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const target = path.join(f.workspace, "Atomic.md");
  await writeFile(target, "old valid bytes");
  await assert.rejects(atomicWriteForTest(target, Buffer.from("new bytes"), async () => {
    throw new Error("simulated interruption");
  }));
  assert.equal(await readFile(target, "utf8"), "old valid bytes");
  assert.deepEqual((await readdir(f.workspace)).filter((name) => name.includes(".lantern-tmp-")), []);
});

test("save checkpoints prior bytes and history restore is byte-correct", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "History.md"), "version one\r\n");
  const first = await readMarkdown(f.workspace, "History.md");
  const saved = await saveMarkdown(f.workspace, "History.md", "version two\n", first.hash);
  const records = await listHistory(f.workspace, "History.md");
  assert.equal(records.length, 1);
  assert.equal(records[0].hash, first.hash);
  await restoreHistory(f.workspace, records[0].id, saved.hash);
  assert.equal(await readFile(path.join(f.workspace, "History.md"), "utf8"), "version one\r\n");
});

test("snapshot and empty-folder restore verify Markdown and attachments", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await mkdir(path.join(f.workspace, "Attachments"));
  await writeFile(path.join(f.workspace, "Note.md"), "# Source\n");
  await writeFile(path.join(f.workspace, "Attachments", "artifact.bin"), Buffer.from([0, 1, 2, 255]));
  const snapshot = await createSnapshot(f.workspace, f.backups);
  assert.equal((await verifySnapshot(snapshot.path)).verified, true);
  const restored = path.join(f.root, "Restored");
  const result = await restoreSnapshot(snapshot.path, restored);
  assert.equal(result.verified, true);
  assert.deepEqual(await readFile(path.join(restored, "Attachments", "artifact.bin")), Buffer.from([0, 1, 2, 255]));
  assert.equal(await readFile(path.join(restored, "Note.md"), "utf8"), "# Source\n");
});

test("snapshot corruption is detected and unsafe destinations are rejected", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "Note.md"), "# Source\n");
  await assert.rejects(createSnapshot(f.workspace, path.join(f.workspace, "Backups")), (error) => error.code === "UNSAFE_DESTINATION");
  const snapshot = await createSnapshot(f.workspace, f.backups);
  await writeFile(path.join(snapshot.path, "files", "Note.md"), "tampered");
  await assert.rejects(verifySnapshot(snapshot.path), (error) => error.code === "SNAPSHOT_CORRUPT");
});

test("workspace migration copies bytes, excludes private metadata, and writes a verification manifest", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await mkdir(path.join(f.workspace, "Attachments", "日本語"), { recursive: true });
  const original = Buffer.from("# Café 🏮\r\n", "utf8");
  const attachment = Buffer.from([0, 1, 2, 255]);
  await writeFile(path.join(f.workspace, "Résumé.md"), original);
  await writeFile(path.join(f.workspace, "Attachments", "日本語", "artifact.bin"), attachment);
  await mkdir(path.join(f.workspace, ".lantern"));
  await writeFile(path.join(f.workspace, ".lantern", "private.json"), "must not migrate");
  const destination = path.join(f.root, "Migrated");
  const report = await migrateWorkspace(f.workspace, destination);
  assert.equal(report.files.length, 2);
  assert.deepEqual(await readFile(path.join(destination, "Résumé.md")), original);
  assert.deepEqual(await readFile(path.join(destination, "Attachments", "日本語", "artifact.bin")), attachment);
  await assert.rejects(readFile(path.join(destination, ".lantern", "private.json")), (error) => error.code === "ENOENT");
  const manifest = JSON.parse(await readFile(path.join(destination, ".nimvara-migration.json"), "utf8"));
  assert.deepEqual(manifest.files.map((file) => file.path).sort(), ["Attachments/日本語/artifact.bin", "Résumé.md"]);
  assert.equal(manifest.files.find((file) => file.path === "Résumé.md").sha256, sha256(original));
  assert.deepEqual(await readFile(path.join(f.workspace, "Résumé.md")), original);
  assert.deepEqual(await readFile(path.join(f.workspace, "Attachments", "日本語", "artifact.bin")), attachment);
});

test("workspace migration rejects an existing destination and never removes it", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "Note.md"), "source");
  const destination = path.join(f.root, "Existing");
  await mkdir(destination);
  await writeFile(path.join(destination, "keep.txt"), "keep me");
  await assert.rejects(migrateWorkspace(f.workspace, destination), (error) => error.code === "MIGRATION_DESTINATION");
  assert.equal(await readFile(path.join(destination, "keep.txt"), "utf8"), "keep me");
});

test("workspace migration rejects destinations inside the source vault", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "Note.md"), "source");
  await assert.rejects(migrateWorkspace(f.workspace, path.join(f.workspace, "Nested")), (error) => error.code === "MIGRATION_DESTINATION");
});

test("static export is safe, selected, and does not alter Markdown", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeFile(path.join(f.workspace, "One.md"), "# One\n<script>alert(1)</script>");
  await writeFile(path.join(f.workspace, "Two.md"), "# Two\n");
  const destination = path.join(f.root, "Published");
  const result = await exportStatic(f.workspace, destination, ["One.md"]);
  assert.deepEqual(result.files, ["One.md"]);
  const html = await readFile(path.join(destination, "One.html"), "utf8");
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  await assert.rejects(readFile(path.join(destination, "Two.html")), (error) => error.code === "ENOENT");
  assert.equal(await readFile(path.join(f.workspace, "One.md"), "utf8"), "# One\n<script>alert(1)</script>");
});

test("workspace escape and non-Markdown edit attempts are rejected", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(saveMarkdown(f.workspace, "../outside.md", "bad", null), (error) => error.code === "PATH_ESCAPE");
  await assert.rejects(saveMarkdown(f.workspace, ".lantern/settings.md", "bad", null), (error) => error.code === "RESERVED_PATH");
  await assert.rejects(saveMarkdown(f.workspace, "binary.exe", "bad", null), (error) => error.code === "NOT_MARKDOWN");
});

test("workspace root and internal symlink traversal are rejected", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const outside = path.join(f.root, "Outside");
  await mkdir(outside);
  await writeFile(path.join(outside, "Secret.md"), "outside bytes");
  const linked = path.join(f.workspace, "Linked");
  try {
    await symlink(outside, linked, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (process.platform === "win32" && (error.code === "EPERM" || error.code === "EACCES")) return t.skip("Windows host does not permit creating a junction for this test.");
    throw error;
  }
  await assert.rejects(
    readMarkdown(f.workspace, "Linked/Secret.md"),
    (error) => error instanceof NimvaraError && error.code === "SYMLINK_PATH"
  );
  await assert.rejects(
    saveMarkdown(f.workspace, "Linked/New.md", "must not escape", null),
    (error) => error instanceof NimvaraError && error.code === "SYMLINK_PATH"
  );
  assert.equal(await readFile(path.join(outside, "Secret.md"), "utf8"), "outside bytes");
  await assert.rejects(
    canonicalRoot(linked),
    (error) => error instanceof NimvaraError && error.code === "SYMLINK_WORKSPACE"
  );
});

test("Nimvara metadata symlink is rejected before checkpointing", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const outside = path.join(f.root, "OutsideMetadata");
  await mkdir(outside);
  await writeFile(path.join(f.workspace, "Note.md"), "old");
  try {
    await symlink(outside, path.join(f.workspace, ".lantern"), process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (process.platform === "win32" && (error.code === "EPERM" || error.code === "EACCES")) return t.skip("Windows host does not permit creating a junction for this test.");
    throw error;
  }
  const opened = await readMarkdown(f.workspace, "Note.md");
  await assert.rejects(
    saveMarkdown(f.workspace, "Note.md", "new", opened.hash),
    (error) => error instanceof NimvaraError && error.code === "SYMLINK_PATH"
  );
  assert.deepEqual(await readdir(outside), []);
  assert.equal(await readFile(path.join(f.workspace, "Note.md"), "utf8"), "old");
});
