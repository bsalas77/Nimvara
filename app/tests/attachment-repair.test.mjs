import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyAttachmentRepair, attachmentDiagnostics, planAttachmentRepair } from "../server/lantern-core.mjs";
import { test } from "node:test";

test("attachment repair creates a review-only proposal and preserves source", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-repair-"));
  try {
    await mkdir(path.join(root, "Assets"));
    const original = "# Note\n![[Elsewhere/image.png]]\n";
    await writeFile(path.join(root, "Note.md"), original);
    await writeFile(path.join(root, "Assets", "image.png"), Buffer.from([1, 2, 3]));
    await writeFile(path.join(root, "Assets", "image-old.png"), Buffer.from([4]));
    const proposal = await planAttachmentRepair(root, "Note.md", 2, "Elsewhere/image.png", "Assets/image.png");
    assert.equal(proposal.before, "![[Elsewhere/image.png]]");
    assert.equal(proposal.after, "![[./Assets/image.png]]");
    assert.match(proposal.content, /\.\/Assets\/image\.png/);
    assert.equal(await readFile(path.join(root, "Note.md"), "utf8"), original);
    const diagnostics = await attachmentDiagnostics(root);
    assert.deepEqual(diagnostics.diagnostics[0].rankedCandidates.map((item) => item.path), ["Assets/image.png", "Assets/image-old.png"]);
    const saved = await applyAttachmentRepair(root, { ...proposal, target: "Elsewhere/image.png" });
    assert.equal(saved.path, "Note.md");
    assert.match(await readFile(path.join(root, "Note.md"), "utf8"), /\.\/Assets\/image\.png/);
    await writeFile(path.join(root, "Note.md"), original);
    await assert.rejects(applyAttachmentRepair(root, { ...proposal, target: "Elsewhere/image.png", expectedHash: "stale" }), /changed since diagnostics/);
    await assert.rejects(planAttachmentRepair(root, "Note.md", 2, "Elsewhere/image.png", "missing.bin"), /existing workspace attachment/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
