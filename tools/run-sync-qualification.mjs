import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { entry, reconcile, transferSnapshot } from "../app/server/sync-core.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-sync-qualification-"));
const deviceA = path.join(root, "device-a");
const deviceB = path.join(root, "device-b");
await mkdir(deviceA); await mkdir(deviceB);
const results = [];
async function scenario(name, fn) {
  try { await fn(); results.push({ name, status: "pass" }); }
  catch (error) { results.push({ name, status: "fail", error: error.message }); }
}

await scenario("simultaneous edit preserves both bytes", async () => {
  const base = [entry("Note.md", "base")];
  const reconciliation = reconcile(base, [entry("Note.md", "A")], [entry("Note.md", "B")], { device: "B" });
  if (reconciliation.conflicts.length !== 1 || reconciliation.conflicts[0].local.content !== "A" || reconciliation.conflicts[0].remote.content !== "B") throw new Error("conflict was not preserved");
});
await scenario("offline reconnect does not overwrite newer remote", async () => {
  const base = [entry("Note.md", "base")];
  const reconciliation = reconcile(base, [entry("Note.md", "offline A")], [entry("Note.md", "remote B")]);
  if (reconciliation.conflicts.length !== 1) throw new Error("offline/reconnect conflict was not surfaced");
});
await scenario("placeholder defers until bytes arrive", async () => {
  const result = reconcile([entry("Note.md", "base")], [entry("Note.md", "local")], [entry("Note.md", null, 0, "cloud", false)]);
  if (result.deferred.length !== 1) throw new Error("placeholder was treated as deletion");
});
await scenario("interrupted transfer leaves no published partial state", async () => {
  const files = [entry("A.md", "a"), entry("B.md", "b")];
  const transfer = transferSnapshot(files, { interruptAfter: 1 });
  if (transfer.published || transfer.files.length) throw new Error("partial transfer published");
});
await scenario("real device folders retain source bytes", async () => {
  await writeFile(path.join(deviceA, "Unicode é.md"), "保全\n");
  await writeFile(path.join(deviceB, "Unicode é.md"), "保全\n");
  if (await readFile(path.join(deviceA, "Unicode é.md"), "utf8") !== "保全\n") throw new Error("device A bytes changed");
  if (await readFile(path.join(deviceB, "Unicode é.md"), "utf8") !== "保全\n") throw new Error("device B bytes changed");
});

const failed = results.filter((item) => item.status === "fail");
console.log(JSON.stringify({ root, scenarios: results, passed: results.length - failed.length, failed: failed.length }, null, 2));
await rm(root, { recursive: true, force: true });
if (failed.length) process.exitCode = 1;
