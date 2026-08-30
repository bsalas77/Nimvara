import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listKanbanBoards, saveKanbanBoard } from "../server/kanban-boards.mjs";
import { test } from "node:test";

test("Kanban boards persist validated configuration in private metadata", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-boards-"));
  try {
    assert.deepEqual(await listKanbanBoards(root), []);
    await saveKanbanBoard(root, { id: "projects", name: "Projects", columns: ["backlog", "doing", "review", "done"] });
    assert.deepEqual((await listKanbanBoards(root))[0].columns, ["backlog", "doing", "review", "done"]);
    await assert.rejects(saveKanbanBoard(root, { id: "../bad", name: "Bad", columns: ["a", "b"] }), /invalid/);
    const metadata = await readFile(path.join(root, ".lantern", "kanban-boards.json"), "utf8");
    assert.doesNotMatch(metadata, /Markdown|content/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
