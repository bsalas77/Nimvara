import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { planAttachmentRepair } from "../server/lantern-core.mjs";
import { test } from "node:test";

test("attachment repair creates a review-only proposal and preserves source", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-repair-"));
  try {
    await mkdir(path.join(root, "Assets"));
    const original = "# Note\n![[missing.png]]\n";
    await writeFile(path.join(root, "Note.md"), original);
    await writeFile(path.join(root, "Assets", "image.png"), Buffer.from([1, 2, 3]));
    const proposal = await planAttachmentRepair(root, "Note.md", 2, "missing.png", "Assets/image.png");
    assert.equal(proposal.before, "![[missing.png]]");
    assert.equal(proposal.after, "![[./Assets/image.png]]");
    assert.match(proposal.content, /\.\/Assets\/image\.png/);
    assert.equal(await readFile(path.join(root, "Note.md"), "utf8"), original);
    await assert.rejects(planAttachmentRepair(root, "Note.md", 2, "missing.png", "missing.bin"), /existing workspace attachment/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
