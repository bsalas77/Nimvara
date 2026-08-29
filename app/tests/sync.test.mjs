import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDecisions, detectRenames, entry, reconcile, transferSnapshot } from "../server/sync-core.mjs";

test("one-sided device edits converge without a clock-based winner", () => {
  const base = [entry("Note.md", "base")];
  const result = reconcile(base, [entry("Note.md", "local")], base);
  assert.equal(result.decisions[0].status, "local-only");
  assert.equal(applyDecisions(base, result)[0].content, "local");
});

test("simultaneous Markdown edits preserve both versions as a conflict", () => {
  const base = [entry("Note.md", "base")];
  const result = reconcile(base, [entry("Note.md", "local")], [entry("Note.md", "remote")], { device: "device-b" });
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].conflictPath, "Note (Nimvara conflict - device-b).md");
  assert.equal(applyDecisions(base, result)[0].content, "base");
});

test("delete-versus-edit is a conflict, never silent deletion", () => {
  const base = [entry("Note.md", "base")];
  const result = reconcile(base, [entry("Note.md", null)], [entry("Note.md", "remote edit")]);
  assert.equal(result.decisions[0].status, "conflict");
  assert.equal(result.conflicts[0].local.content, null);
  assert.equal(result.conflicts[0].remote.content, "remote edit");
});

test("placeholders defer decisions until content is available", () => {
  const base = [entry("Note.md", "base")];
  const result = reconcile(base, [entry("Note.md", "local")], [entry("Note.md", null, 0, "cloud", false)]);
  assert.equal(result.deferred.length, 1);
  assert.equal(result.decisions[0].status, "deferred-placeholder");
});

test("rename detection uses content hashes and does not rewrite files", () => {
  const renames = detectRenames([entry("Old.md", "same")], [entry("New.md", "same")]);
  assert.deepEqual(renames, [{ from: "Old.md", to: "New.md", hash: entry("x", "same").hash }]);
});

test("interrupted or failed transfer publishes nothing", () => {
  const files = [entry("A.md", "a"), entry("B.md", "b"), entry("C.md", "c")];
  assert.deepEqual(transferSnapshot(files, { interruptAfter: 1 }), { status: "interrupted", published: false, files: [] });
  assert.deepEqual(transferSnapshot(files, { fail: true }), { status: "failed", published: false, files: [] });
  assert.equal(transferSnapshot(files).published, true);
});
