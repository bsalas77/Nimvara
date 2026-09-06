import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readPublic = (file) => readFile(new URL(`public/${file}`, root), "utf8");

test("native interactive boards and canvas edits use the direct desktop route adapter", async () => {
  const [adapter, canvas, boards, runtime, app, migration, extensions] = await Promise.all([
    readPublic("desktop-request.js"),
    readPublic("canvas-ui.js"),
    readPublic("kanban-boards-ui.js"),
    readPublic("kanban-runtime.js"),
    readPublic("app.js"),
    readPublic("migration-ui.js"),
    readPublic("extension-ui.js")
  ]);
  for (const route of [
    "GET /api/workspace-dashboard",
    "GET /api/kanban/boards",
    "POST /api/kanban/boards",
    "GET /api/canvas",
    "POST /api/canvas/save",
    "GET /api/history",
    "POST /api/history/restore"
  ]) assert.match(adapter, new RegExp(route.replace(/[/?]/g, "\\$&")));
  for (const source of [canvas, boards, runtime]) {
    assert.match(source, /desktopRequest/);
    assert.doesNotMatch(source, /window\.nimvaraApi/);
  }
  assert.match(app, /native_migrate_workspace/);
  assert.match(migration, /window\.__TAURI__\?\.core\?\.invoke/);
  assert.match(extensions, /window\.__TAURI__\?\.core\?\.invoke/);
});
