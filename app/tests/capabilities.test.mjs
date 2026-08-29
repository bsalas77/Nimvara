import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

test("MCP bridge is read-only and declares expected tools", async () => {
  const source = await readFile(path.join(root, "server", "mcp-server.mjs"), "utf8");
  for (const tool of ["nimvara_capabilities", "nimvara_list_notes", "nimvara_read_note", "nimvara_search", "nimvara_note_context"]) assert.match(source, new RegExp(tool));
  assert.doesNotMatch(source, /saveMarkdown|restoreSnapshot|write_note|delete_note/);
});

test("extension capability contract documents local API and guarded AI", async () => {
  const doc = await readFile(path.join(root, "..", "implementation", "EXTENSION-CAPABILITIES.md"), "utf8");
  assert.match(doc, /127\.0\.0\.1/);
  assert.match(doc, /no MCP write tool/);
  assert.match(doc, /never write directly to the workspace/);
  assert.match(doc, /checkpointed Save path/);
});
