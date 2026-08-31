import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { diagnosticsReport } from "../server/lantern-core.mjs";

test("support diagnostics are aggregate-only and redact workspace identity", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-diagnostics-"));
  await mkdir(path.join(root, "Private Projects"));
  await writeFile(path.join(root, "Private Projects", "Secret.md"), "Sensitive note content");
  await writeFile(path.join(root, "image.png"), Buffer.from([1, 2, 3]));
  const report = await diagnosticsReport(root, "0.7.0-test");
  assert.equal(report.appVersion, "0.7.0-test");
  assert.deepEqual(report.workspace, {
    fileCount: 2,
    markdownCount: 1,
    attachmentCount: 1,
    totalBytes: 25,
    largestFileBytes: 22,
    maxPathDepth: 2,
    byExtension: { ".md": 1, ".png": 1 }
  });
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes("Private Projects"));
  assert.ok(!serialized.includes("Secret.md"));
  assert.ok(!serialized.includes("Sensitive note content"));
  assert.ok(!serialized.includes(root));
});
