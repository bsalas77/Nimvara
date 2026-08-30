import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createSnapshot, restoreSnapshot, verifySnapshot } from "../app/server/lantern-core.mjs";

const hashTree = async (root) => {
  const digest = createHash("sha256");
  const walk = async (current, relative = "") => {
    const entries = await (await import("node:fs/promises")).readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = path.join(relative, entry.name).replaceAll("\\", "/");
      if (entry.isDirectory()) await walk(full, rel);
      else { digest.update(rel); digest.update(await readFile(full)); }
    }
  };
  await walk(root);
  return digest.digest("hex");
};

const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-restore-drill-"));
const workspace = path.join(root, "workspace");
const backups = path.join(root, "backups");
const restored = path.join(root, "restored");
try {
  await mkdir(path.join(workspace, "Attachments"), { recursive: true });
  await writeFile(path.join(workspace, "Daily.md"), "# Restore drill\n\nUnicode: Café 🏮\n", "utf8");
  await writeFile(path.join(workspace, "Attachments", "sample.bin"), Buffer.from([0, 1, 2, 255]));
  const before = await hashTree(workspace);
  const snapshot = await createSnapshot(workspace, backups);
  const verified = await verifySnapshot(snapshot.path);
  const result = await restoreSnapshot(snapshot.path, restored);
  const after = await hashTree(restored);
  if (!verified || before !== after || result.files !== 2) throw new Error("RESTORE_DRILL: restored bytes did not match the source fixture.");
  console.log(JSON.stringify({ status: "pass", files: result.files, snapshot: snapshot.id, sourceHash: before, restoredHash: after }));
} finally {
  await rm(root, { recursive: true, force: true });
}
